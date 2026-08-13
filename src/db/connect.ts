import Redis from "ioredis";

export const redis = new Redis(Bun.env.REDIS_URL!);

// connect redis
redis.on("connect", () => {
  console.log("Redis Connected");
});

// show error if connection failed
redis.on("error", (error) => {
  console.log("Redis Connection failed", error);
});
