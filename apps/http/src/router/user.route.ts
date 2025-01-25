import { Router , Response , Request} from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { JWT_SECRET } from "../config/jwt.config";
import { UserSignInSchema, UserSignupSchema } from "../types";
import { prisma } from "db";
import { sendVerificationEmail } from "../services/email";
import { redisClient } from "redis-client";
import { authUserMiddleware } from "../middleware/user.middleware";


const router = Router();

router.post("/signup", async(req : Request , res : Response) => {
    const body = req.body;
    const parsedData = UserSignupSchema.safeParse(body);
    if(!parsedData.success){
        res.status(400).json({message: "Invalid input"})
        return;
    }
    try {
        const isUserExists = await prisma.user.findFirst({
            where: {
                email: parsedData.data.email
            }
        })
        if(isUserExists){
            res.status(403).json({message: "User already exists"})
            return;
        }

        const hashPassword = await bcrypt.hash(parsedData.data.password , 10);

        await prisma.user.create({
            data: {
               ...parsedData.data,
               password: hashPassword

            }
        })

        await sendVerificationEmail(parsedData.data.email);

        res.status(200).json({message: "Please verify your email"})
    } catch (err : any) {
        if(err.code === 'P2002'){
            res.status(409).json({message : "Username already exists"});
            return;
        }else if (err.message.includes("email")) {
            res.status(500).json({ message: "Failed to send verification email" });
            return;
        }else{
            res.status(500).json({ message: "Unexpected error occured"});
        }
    }
})


router.post("/signin", async(req : Request , res : Response) => {
    const body = req.body;
    const parsedData = UserSignInSchema.safeParse(body);
    if(!parsedData.success){
        res.status(400).json({message: "Invalid input"})
        return;
    }
    try {
        const user = await prisma.user.findFirst({
            where: {
                email: parsedData.data.email
            },
        })
        if(!user){
            res.status(403).json({message: "User doesnot exists"})
            return;
        }

        const isPasswordValid = await bcrypt.compare(parsedData.data.password , user.password as string);
        if(!isPasswordValid){
            res.status(401).json({message : "Invalid crendentials"});
        }
        const token = jwt.sign({id : user.id} , JWT_SECRET , {expiresIn: '24h'});
        const options = {
            httpOnly : true,
            secure : process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 24,
            sameSite: 'strict' as 'strict',
            path: '/',
        }
        res.cookie("_token_", token, options);
        res.status(200).json({ message: "User logged in successfully", token});
    } catch (err) {
        res.status(500).json({ message: "Unexpected error occured"});
    }
})

router.get("/" , authUserMiddleware ,async(req : Request, res : Response) => {
    const userdId = req.id;
    if(!userdId){
        res.status(403).json({message : "Unauthenticated"});
        return;
    } 
    try {
        const cacheData =  await redisClient.get(`${userdId}-profile`);
        if(cacheData){
            res.status(200).json(JSON.parse(cacheData));
            return;
        }

        const user = await prisma.user.findFirst({
            where: {
                id : userdId
            },
            select: {
                name: true,
                username: true,
            }
        })
        if(!user){
            res.status(404).json({message : "User not found!"});
            return
        }
        await redisClient.set(`${userdId}-profile`, JSON.stringify(user));
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: "Unexpected error occured"});
    }
})

router.get("/verify-email", async(req : Request, res : Response) => {
    const token = req.query.token as string;
    try {
        const payload = jwt.verify(token , JWT_SECRET);
        if(typeof payload === "string" || !payload.email) {
            res.status(400).json({message : "Invalid request"})
            return;
        }
        await prisma.user.update({
            where : {
                email : payload.email
            },
            data: {
                isVerified : true
            }
        })
        res.status(200).json({message: "Email verified successfully!"});
    } catch (err) {
        res.status(500).json({ message: "Unexpected error occured"});
    }
})

export const userRouter = router;