import { Router , Response , Request} from "express";
import prisma from "db";
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


export const boardRouter = router