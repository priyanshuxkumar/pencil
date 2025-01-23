import { User } from "./User";

export class Room {
  private static instance: Room;
  private rooms: Map<string, User[]>;

  private constructor() {
    this.rooms = new Map();
  }

  public static getInstance(): Room {
    if (!Room.instance) {
      Room.instance = new Room();
    }
    return Room.instance;
  }

  public addUser(boardId: string, user: User): void {
    if (!this.rooms.has(boardId)) {
      this.rooms.set(boardId, []);
    }
    const users = this.rooms.get(boardId) || [];
    this.rooms.set(boardId, [...users, user]);
    console.log(`User ${user.id} added to board ${boardId}`);
  }

  public removeUser(user: User, boardId: string): void {
    if (!this.rooms.has(boardId)) {
      return;
    }
    const updatedUsers = (this.rooms.get(boardId) || []).filter((u) => u.id !== user.id);
    if (updatedUsers.length === 0) {
      this.rooms.delete(boardId); 
      console.log(`Board ${boardId} deleted as it is now empty.`);
    } else {
      this.rooms.set(boardId, updatedUsers);
      console.log(`User ${user.id} removed from board ${boardId}`);
    }
  }

  public broadcast(message: any, sender: User, boardId: string): void {
    if (!this.rooms.has(boardId)) {
      return;
    }

    this.rooms.get(boardId)?.forEach((x) => {
      if (x.id !== sender.id) {
        message = JSON.stringify(message)
        x.send(message);
      }
    });
    console.log(`Message broadcasted to board ${boardId} by user ${sender.id}`);
  }

  public getUsers(boardId: string): User[] {
    return this.rooms.get(boardId) || [];
  }

  
  public isUserInBoard(user: User, boardId: string): boolean {
    return (this.rooms.get(boardId) || []).some((u) => u.id === user.id);
  }

  public getBoardCount(): number {
    return this.rooms.size;
  }

  public getUserCountInBoard(boardId: string): number {
    return this.rooms.get(boardId)?.length || 0;
  }  
}
