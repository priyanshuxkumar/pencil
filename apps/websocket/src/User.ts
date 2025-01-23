import { WebSocket } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import prisma from "db";
import { JWT_SECRET } from "./config/jwt.config";
import { Room } from "./Room";

export class User {
  private ws: WebSocket;
  public id?: number;
  public name?: string;
  public boardId?: string;
  public board: any;

  constructor(ws: WebSocket) {
    this.ws = ws;
    this.init(); 
  }

  private init() {
    this.ws.on("message", async (data: any) => {
      try {
        const parsedData = JSON.parse(data.toString());
        if (!parsedData) {
          throw new Error("Invalid message format.");
        }

        switch (parsedData.type) {
          case "join":
            await this.handleJoin(parsedData.payload);
            break;

          case "draw":
            await this.handleDraw(parsedData.payload);
            break;

          default:
            console.error("Unknown message type:", parsedData.type);
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });

    this.ws.on("close", () => {
      console.log(`User ${this.id} disconnected.`);
      Room.getInstance().removeUser(this, this.boardId || "");
    });
  }

  private async handleJoin(payload: any) {
    const { token, boardId } = payload; 
    try {
      const userId = (jwt.verify(token, JWT_SECRET) as JwtPayload).id;
      if (!userId) {
        throw new Error("Invalid token.");
      }

      const user = await prisma.user.findFirst({ where: { id: userId } });
      if (!user) {
        throw new Error("User not found.");
      }

      this.id = user.id;
      this.name = user.name;

      const board = await prisma.board.findFirst({ where: { id: boardId } });
      if (!board) {
        throw new Error("Board not found.");
      }
      this.boardId = board.id;
      this.board = board;

      Room.getInstance().addUser(this.boardId, this);
      console.log(`User ${this.name} joined board ${this.boardId}.`);
    } catch (error) {
      console.error("Error in handleJoin:", error);
      this.ws.close();
    }
  }

  private async handleDraw(payload: any) {
    const { boardId, elementType, color, x, y } = payload;
    if(!elementType && !boardId && !color && !x && !y){
      return;
    };

    try {
      await prisma.boardEvent.create({
        data: {
          boardId, 
          userId: this.id as number,
          type: elementType,
          data: { color, x, y },
        },
      });

      const userCount = Room.getInstance().getUserCountInBoard(boardId)
      if(userCount > 1){
        Room.getInstance().broadcast({
            type: 'draw',
            payload: {
              elementType,
              boardId,
              color,
              x,
              y
            }
          },
          this,
          boardId
        )
      }
    } catch (error) {
      console.error("Error creating board event:", error);
    }
  }

  send(message: string) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    }
  }
}