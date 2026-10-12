import { compareLines } from "@/lib/diff";
import { extractContent } from "@/lib/extractor";
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

        // One after the other: two Chromium instances at once use a lot of memory.
        const oldData = await extractContent(oldUrl);
        const newData = await extractContent(newUrl);

        // Never show a fake "0% match" when a page could not be read at all.
        if (oldData.lines.length === 0) {
            throw new Error(`No readable text found on the OLD page (${oldUrl}). It may block bots or need a login.`);
        }
        if (newData.lines.length === 0) {
            throw new Error(`No readable text found on the NEW page (${newUrl}). It may block bots or need a login.`);
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