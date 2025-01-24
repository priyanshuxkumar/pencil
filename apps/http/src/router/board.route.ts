import { Router , Response , Request} from "express";
import prisma from "db";
import { v4 as uuidv4 } from 'uuid';
import { authUserMiddleware } from "../middleware/user.middleware";

const router = Router();

router.post('/create' , authUserMiddleware , async (req : Request , res : Response) => {
    const userId = req.id as number;
    try {
        const {name} = req.body;
        const board  = await prisma.board.create({
            data: {
                name,
                userId
            }
        })
        res.status(200).json(board)
    } catch (error) {
        console.log("Error occured while creating board" , error)
    }
})

router.get('/generate-collab-link' , async(req: Request , res: Response) => {
    try {
        const id = uuidv4();
        const url = `${process.env.CLIENT_URL}?room=${id}`
        res.status(200).json(url);
    } catch (error) {
        console.log("Error occured while generate link" , error)
    }
})


export const boardRouter = router