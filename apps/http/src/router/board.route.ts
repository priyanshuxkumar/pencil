import { Router , Response , Request} from "express";
import prisma from "db";

const router = Router();

router.post('/create' , async (req : Request , res : Response) => {
    try {
        const {name} = req.body;
        const board  = await prisma.board.create({
            data: {
                name: name
            }
        })
        res.status(200).json(board)
    } catch (error) {
        console.log("Error occured while creating board" , error)
    }
})


export const boardRouter = router