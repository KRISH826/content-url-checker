import { compareText } from "@/lib/diff";
import { extractContent } from "@/lib/extractor";
import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';

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

        const [oldData, newData] = await Promise.all([
            extractContent(oldUrl),
            extractContent(newUrl),
        ]);

        const diff = compareText(oldData.text, newData.text);

        return NextResponse.json({
            success: true,
            data: {
                id,
                oldUrl,
                newUrl,
                oldTitle: oldData.title,
                newTitle: newData.title,
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