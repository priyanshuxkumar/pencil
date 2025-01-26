import { Router , Response , Request} from "express";
import {prisma , PrismaClientValidationError} from "db";
import { v4 as uuidv4 } from 'uuid';
import { authUserMiddleware } from "../middleware/user.middleware";
import { redisClient } from "redis-client";
import { CreateBoardSchema } from "../types";

const router = Router();

/** Create Board */
router.post('/' , authUserMiddleware , async (req : Request , res : Response) => {
    const userId = req.id as number;
    const body = req.body;
    try { 
        const parsedData = CreateBoardSchema.safeParse(body);
        if(!parsedData.success){
            res.status(400).json({message : "Invalid inputs"});
            return;
        }
        const board  = await prisma.board.create({
            data: {
                name : parsedData.data?.name as string,
                userId
            }
        })
        await redisClient.del(`${userId}-boards`);
        res.status(200).json(board)
    } catch (error : any) {
        if(error instanceof PrismaClientValidationError){
            res.status(400).json({message: "Invalid inputs"});
        }else{
            res.status(500).json({ message: "Unexpected error occured"});
        }
    }
});

/** Fetch all boards */
router.get('/' , authUserMiddleware , async(req: Request , res: Response) => {
    const userId =  req.id;
    try {
        const cacheData = await redisClient.get(`${userId}-boards`);
        if(cacheData){
            res.status(200).json(JSON.parse(cacheData));
            return;
        }
        const boards = await prisma.board.findMany({
            where: {
                userId
            }
        })
        await redisClient.set(`${userId}-boards`, JSON.stringify(boards));
        res.status(200).json(boards);
    } catch (error) {
        res.status(500).json({ message: "Unexpected error occured"});
    }
});

router.get('/generate-collab-link' , async(req: Request , res: Response) => {
    try {
        const id = uuidv4();
        const url = `${process.env.CLIENT_URL}?room=${id}`
        res.status(200).json(url);
    } catch (error) {
        res.status(500).json({ message: "Unexpected error occured"});
    }
});

/** Fetch a board */
router.get('/:id', authUserMiddleware , async(req: Request , res: Response) => {
    const userId = req.id as number;
    const id = req.params.id;
    try {
        const cacheData = await redisClient.get(`${id}-board`);
        if(cacheData){
            res.status(200).json(JSON.parse(cacheData));
            return;
        };

        const board = await prisma.board.findFirst({
            where: {
                id,
                userId
            },
            include: {
                events: true
            }
        });

        if(!board){
            res.status(404).json({message : "Board not found!"});
            return;
        }
        await redisClient.set(`${id}-board`, JSON.stringify(board));
        res.status(200).json(board ? board : {});
    } catch (error) {
        res.status(500).json({ message: "Unexpected error occured"});
    }
});

router.delete('/:id', authUserMiddleware, async(req: Request , res: Response) => {
    const userId = req.id as number;
    const id = req.params.id;
    try {
        const board = await prisma.board.delete({
            where: {
                id,
                userId
            }
        })
        if(board){
            res.status(200).json({message: "Board has been deleted successfully!"});
            return;
        }
    } catch (error : any) {
        if(error.code == 'P2025'){
            res.status(404).json({message : "Board doesnot exist"});
        }else{
            res.status(500).json({ message: "Unexpected error occured"});
        }
    }
});

export const boardRouter = router