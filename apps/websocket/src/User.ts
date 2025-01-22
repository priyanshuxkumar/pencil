import { WebSocket } from "ws";

export class User {
    private ws: WebSocket;
  
    constructor(ws: WebSocket) {
      this.ws = ws;
      this.init();
    }

    init(){
        this.ws.on("message", (data: any) => {
            const parsedData = JSON.parse(data.toString());
            
            console.log("Message received from client:", parsedData);
            this.send(`Server received: ${parsedData}`);
        });
    }
  
    send(data: string) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(data);
      }
    }
}