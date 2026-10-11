import { compareText } from "@/lib/diff";
import { extractContent } from "@/lib/extractor";
import { NextRequest, NextResponse } from "next/server"
import { z } from 'zod';


const compareSchema = z.object({
    id: z.number().optional(),
    oldUrl: z.string().trim().url({ message: 'oldUrl must be a valid HTTP/HTTPS URL' }),
    newUrl: z.string().trim().url({ message: 'newUrl must be a valid HTTP/HTTPS URL' }),
})

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.json();
        const validation = compareSchema.safeParse(rawBody);
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: "validation error",
                    issues: validation.error.issues,
                },
                { status: 400 }
            );
        }

        const { oldUrl, newUrl, id } = validation.data;

        const [oldData, newData] = await Promise.all([
            extractContent(oldUrl),
            extractContent(newUrl),
        ]);

        const diffResult = compareText(oldData.text, newData.text);

        return NextResponse.json({
            success: true,
            data: {
                id,
                oldUrl,
                newUrl,
                oldTitle: oldData.title,
                newTitle: newData.title,
                diff: diffResult,
            },
        });
    } catch (err: unknown) {
        console.error('Comparison error:', err);
        return NextResponse.json(
            {
                success: false,
                error: err instanceof Error ? err.message : "Unknown error occurred",
            },
            { status: 500 }
        );
    }
}