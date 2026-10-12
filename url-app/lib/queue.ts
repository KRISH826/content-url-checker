import { Queue, QueueEvents } from "bullmq";
import { redis } from "./redis";

export const QUEUE_NAME = "compare-queue";

const globalQueue = globalThis as unknown as {
    compareQueue?: Queue;
    queueEvents?: QueueEvents;
};

export const compareQueue =
    globalQueue.compareQueue ??
    new Queue(QUEUE_NAME, {
        connection: redis,
        defaultJobOptions: {
            attempts: 2,
            backoff: { type: "exponential", delay: 1000 },
            removeOnComplete: 100,
            removeOnFail: 200,
        },
    });

export const queueEvents =
    globalQueue.queueEvents ??
    new QueueEvents(QUEUE_NAME, { connection: redis });

if (process.env.NODE_ENV !== "production") {
    globalQueue.compareQueue = compareQueue;
    globalQueue.queueEvents = queueEvents;
}
