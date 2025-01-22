import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { userRouter } from "./router/user.route"
import { boardRouter } from "./router/board.route"

dotenv.config()

const app = express()
const HTTP_PORT = process.env.HTTP_PORT

app.use(express.json())
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
}))

app.use('/api/v1/user', userRouter);
app.use('/api/v1/board', boardRouter);

app.listen(HTTP_PORT, () => {
    console.log(`HTTP server is running on port ${HTTP_PORT}`)
})