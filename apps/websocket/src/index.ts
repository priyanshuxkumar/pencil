import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";
import { User } from "./User";
import { initRedisSubscriber } from "./redis/subscriber";

dotenv.config();

const PORT = Number(process.env.PORT);

const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server is running on ws://localhost:${PORT}`);

/** Initialize Redis subscriber once when the server starts */
initRedisSubscriber();

wss.on("connection", (ws: WebSocket) => {
  console.log("User connected to WS!");

  let user: User = new User(ws);

  ws.on("error", (error) => {
    console.error("WebSocket error occurred:", error);
  });

  ws.on("close", () => {
    console.log("User disconnected from WS.");
  });
});
