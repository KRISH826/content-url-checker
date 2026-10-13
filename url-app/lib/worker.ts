import { Worker, Job } from "bullmq";
import { redis } from "./redis";
import { QUEUE_NAME } from "./queue";
import { extractContent } from "./extractor";
import { extractGoogleDoc } from "./docsextractor";
import { compareLines } from "./diff";

export interface CompareJob {
    type?: "urls" | "doc";
    oldUrl?: string;
    newUrl?: string;
    docUrl?: string;
    webUrl?: string;
    id?: number;
}

export const compareWorker = new Worker(
    QUEUE_NAME,
    async (job: Job<CompareJob>) => {
        const { type = "urls", oldUrl, newUrl, docUrl, webUrl, id } = job.data;

        const [base, target] = await Promise.all([
            type === "doc" && docUrl ? extractGoogleDoc(docUrl) : extractContent(oldUrl!),
            extractContent(type === "doc" ? webUrl! : newUrl!),
        ]);

        const diff = compareLines(base.lines, target.lines);

        return {
            id,
            oldUrl: oldUrl || docUrl,
            newUrl: newUrl || webUrl,
            oldTitle: base.title,
            newTitle: target.title,
            oldMode: "sourceType" in base ? base.sourceType : base.mode,
            newMode: target.mode,
            diff,
        };
    },
    { connection: redis, concurrency: 4 }
);

compareWorker.on("ready", () => {
    console.log(`🚀 [Worker] Connected to Redis and listening on queue "${QUEUE_NAME}"`);
});

compareWorker.on("completed", (j) => {
    console.log(`✓ [Worker] Job ${j.id} completed successfully`);
});

compareWorker.on("failed", (j, err) => {
    console.error(`✕ [Worker] Job ${j?.id} failed:`, err.message);
});
