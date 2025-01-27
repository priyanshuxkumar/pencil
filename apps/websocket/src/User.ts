import { WebSocket } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "db";
import { JWT_SECRET } from "./config/jwt.config";
import { Room } from "./Room";
import { publisher } from "./redis/publisher";

export class User {
  private ws: WebSocket;
  public id?: number;
  public name?: string;
  public boardId?: string;
  public board: any;

  constructor(ws: WebSocket) {
    this.ws = ws;
    this.init(); 
  };

  private init() {
    this.ws.on("message", async (data: any) => {
      try {
        const parsedData = JSON.parse(data.toString());
        if (!parsedData) {
          throw new Error("Invalid message format.");
        }

        switch (parsedData.type) {
          case "join": /** User join solo */
            await this.handleJoin(parsedData.payload);
            break;
           
          case "join-board": /** Collaboration */
            await this.handleJoinBoard(parsedData.payload);
            break;

          case "draw": /** Draw events */
            await this.handleDraw(parsedData.payload);
            break;
          
          case "erase": /** Erase events */
            await this.handleErase(parsedData.payload);
            break;

          default:
            console.error("Unknown message type:", parsedData.type);
        }
      } catch (error : unknown) {
        console.error("Error processing message:", error);
        if(error instanceof Error){
          this.send(JSON.stringify({ type: 'error', message: error.message}));
        }else {
          this.send(JSON.stringify({ type: 'error', message: error}));
        }
      }
    });

    this.ws.on("close", () => {
      console.log(`User ${this.id} disconnected.`);
      Room.getInstance().removeUser(this, this.boardId || "");
    });
  };

  /** User join case */
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

      const board = await prisma.board.findFirst({ where: { id: boardId , userId: userId} });
      if (!board) {
        throw new Error("Board not found!");
      }
      this.boardId = board.id;
      this.board = board;

      this.send(JSON.stringify({ type: 'joined', message: "Board joined successfully!"}));
      console.log(`User ${this.name} connected`);
    } catch (error : unknown) {
      if(error instanceof Error){
        this.send(JSON.stringify({ type: 'error', message: error.message}));
      }else {
        this.send(JSON.stringify({ type: 'error', message: error}));
      }
      this.ws.close();
    }
  };

  private async handleJoinBoard(payload: any){
    try {
      const boardId = payload.boardId;
      const token = payload.token;
      
      if(!boardId ){
        throw new Error("Url is incorrect")
      }
      if(!token){
        throw new Error("Unauthenticated!")
      }

      const userId = (jwt.verify(token, JWT_SECRET) as JwtPayload).id;
      if (!userId) {
        throw new Error("Invalid token.");
      }

      const user = await prisma.user.findFirst({ where: { id: userId }});
      if (!user) {
        throw new Error("User not found.");
      }

      this.id = user.id;
      this.name = user.name;
   
      const board = await prisma.board.findFirst({
        where: {
          id : boardId
        }
      })

      if(!board) {
        throw new Error("Room not found");
      }
  
      /** Join user to room */
      Room.getInstance().addUser(boardId , this);
      this.send(JSON.stringify({ type: 'board-room-joined', message: "Board joined successfully!"}));
      

      /**Broadcast new user joined */
      Room.getInstance().broadcast({
        type: "board-joined",
        payload: {
          name: this.name
        }
      }, this.id as number , boardId)
      console.log(`User joined ${boardId} room`);
    } catch (error : unknown) {
      console.error("Error occured while joining room", error);
      if(error instanceof Error){
        this.send(JSON.stringify({ type: 'error', message: error.message}));
      }else {
        this.send(JSON.stringify({ type: 'error', message: error}));
      }
    }
  };

  /** Draw case  */
  private async handleDraw(payload: any) {
    const { boardId, elementType, color, x, y } = payload;
    if(!elementType && !boardId && !color && !x && !y){
      return;
    };

    try { /** Create a new board event for the draw action */
      await prisma.boardEvent.create({
        data: {
          boardId, 
          userId: this.id as number,
          type: elementType,
          data: { color, x, y },
        },
      });

      /** If room has more than one member only then broadcast the event */
      if (Room.getInstance().getUserCountInBoard(boardId) > 1){

        publisher({
          type: 'draw',
          payload: {
            elementType,
            boardId,
            color,
            x,
            y,
          },
          senderId: this.id as number
        })
      }
    } catch (error: unknown) {
      console.error("Error creating board event:", error);
      if(error instanceof Error){
        this.send(JSON.stringify({ type: 'error', message: error.message}));
      }else {
        this.send(JSON.stringify({ type: 'error', message: error}));
      }
    }
  };

  /** Erase the drawing */
  private async handleErase(payload: any){
    try {
      const elementId = payload.elementId;

      /** Delete a boardEvent (Draw) */
      await prisma.boardEvent.delete({
        where: {
          id: elementId,
          boardId: this.boardId
        }
      })

      /** If room has more than one member only then broadcast the event */
      if (Room.getInstance().getUserCountInBoard(this.boardId as string) > 1){
        Room.getInstance().broadcast({
            type: 'erase',
            payload: {
              elementId,
            }
          },
          this.id as number,
          this.boardId as string
        )
      }
    } catch (error) {
      console.error("Error occured while erase" , error)
    }
  };

  send(message: string) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    }
  };

  destory(){
    //Check if user exist in board
    if(Room.getInstance().isUserInBoard(this , this.boardId as string)){
      Room.getInstance().removeUser(this , this.boardId as string); //Remove the user from board
      
      Room.getInstance().broadcast({ // broadcast on the board
        type: "user-left",
        payload: {
          userId: this.id
        }
      }, this.id as number , this.boardId as string);
    }
    this.ws.close();
  };
}