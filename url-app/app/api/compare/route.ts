import { compareLines } from "@/lib/diff";
import { extractContent } from "@/lib/extractor";
import { compareQueue, queueEvents } from "@/lib/queue";
import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';

export const maxDuration = 60;

const compareSchema = z.object({
    id: z.number().optional(),
    oldUrl: z.string().trim().url({ message: 'oldUrl must be a valid HTTP/HTTPS URL' }),
    newUrl: z.string().trim().url({ message: 'newUrl must be a valid HTTP/HTTPS URL' }),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validation = compareSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0]?.message || 'Validation error' },
                { status: 400 }
            );
        }

        const { oldUrl, newUrl, id } = validation.data;

        // 1. Delegate to BullMQ worker if active
        try {
            const job = await compareQueue.add("urls", { oldUrl, newUrl, id });
            const result = await job.waitUntilFinished(queueEvents, 10000);
            return NextResponse.json({ success: true, data: result });
        } catch {
            // 2. Direct fallback (Static-First <1.5s) if worker is not polling
        }

        const [oldData, newData] = await Promise.all([
            extractContent(oldUrl),
            extractContent(newUrl),
        ]);

        if (oldData.lines.length === 0) {
            throw new Error(`No readable text found on the baseline page (${oldUrl}).`);
        }
        if (newData.lines.length === 0) {
            throw new Error(`No readable text found on the target page (${newUrl}).`);
        }

        const diff = compareLines(oldData.lines, newData.lines);

        return NextResponse.json({
            success: true,
            data: {
                id,
                oldUrl,
                newUrl,
                oldTitle: oldData.title,
                newTitle: newData.title,
                oldMode: oldData.mode,
                newMode: newData.mode,
                diff,
            },
        });
    } catch (err: unknown) {
        console.error('Comparison error:', err);
        return NextResponse.json(
            { success: false, error: err instanceof Error ? err.message : 'Comparison failed' },
            { status: 500 }
        );
    }
}