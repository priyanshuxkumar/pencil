import { redisSubscriber } from "redis-client";
import { Room } from "../Room";

export function initRedisSubscriber() {
  redisSubscriber.subscribe("board", (message: any) => {
    try {
      const event = JSON.parse(message);
      const { type, payload, senderId } = event;

      if (type === "draw") {
        const { boardId, elementType, color, x, y } = payload;

        Room.getInstance().broadcast(
          {
            type: "draw",
            payload: { elementType, boardId, color, x, y },
          },
          senderId,
          boardId
        );
      }
    } catch (error) {
      console.error("Error processing Redis event:", error);
    }
  });
}
