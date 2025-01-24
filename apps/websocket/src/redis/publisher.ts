import { redisPublisher } from "redis-client";

export async function publisher(message : any) {
    try {
        const data = JSON.stringify(message);
        await redisPublisher.publish("board" , data);
    } catch (error) {
        console.log("Error occured while publish an event",error);
    }
};

