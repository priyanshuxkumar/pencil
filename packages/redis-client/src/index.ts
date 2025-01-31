import { createClient } from "redis";

const redisClient = createClient();
const redisPublisher = createClient(); 
const redisSubscriber = createClient();

redisPublisher.on("error", (err) => console.error("Redis Publisher Error:", err));
redisSubscriber.on("error", (err) => console.error("Redis Subscriber Error:", err));

async function connectRedisClients() {
  try {
    await redisClient.connect();
    console.log("Redis client connected");

    await redisPublisher.connect();
    console.log("Redis Publisher connected");

    await redisSubscriber.connect();
    console.log("Redis Subscriber connected");
  } catch (error) {
    console.error("Error connecting to Redis:", error);
  }
}

connectRedisClients();

export { redisClient , redisPublisher, redisSubscriber };
