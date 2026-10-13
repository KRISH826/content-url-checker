import { compareLines } from "@/lib/diff";
import { extractContent } from "@/lib/extractor";
import { extractGoogleDoc, extractDocx, extractPdf, extractTextFile, DocExtractedData } from "@/lib/docsextractor";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get("content-type") || "";
        let docPromise: Promise<DocExtractedData>;
        let webUrl = "";
        let docDisplayName = "";

        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            webUrl = (formData.get("webUrl") as string || "").trim();
            const file = formData.get("file") as File | null;
            const docUrl = (formData.get("docUrl") as string || "").trim();

            if (!webUrl) {
                return NextResponse.json({ success: false, error: "Target web URL is required." }, { status: 400 });
            }

            if (file && file.size > 0) {
                docDisplayName = file.name;
                const buffer = Buffer.from(await file.arrayBuffer());
                const ext = file.name.split('.').pop()?.toLowerCase() || '';

                if (ext === 'docx') {
                    docPromise = Promise.resolve(extractDocx(buffer, file.name));
                } else if (ext === 'pdf') {
                    docPromise = Promise.resolve(extractPdf(buffer, file.name));
                } else if (['txt', 'md', 'markdown'].includes(ext)) {
                    docPromise = Promise.resolve(extractTextFile(buffer.toString('utf8'), file.name));
                } else {
                    return NextResponse.json({ success: false, error: "Unsupported file type. Please upload a .docx, .pdf, or .txt file." }, { status: 400 });
                }
            } else if (docUrl) {
                docDisplayName = "Google Doc";
                docPromise = extractGoogleDoc(docUrl);
            } else {
                return NextResponse.json({ success: false, error: "Please provide either a Google Doc link or upload a file (.docx, .pdf, .txt)." }, { status: 400 });
            }
        } else {
            const body = await req.json();
            webUrl = (body.webUrl || "").trim();
            const docUrl = (body.docUrl || "").trim();
            const rawText = (body.rawText || "").trim();

            if (!webUrl) {
                return NextResponse.json({ success: false, error: "Target web URL is required." }, { status: 400 });
            }

            if (docUrl) {
                docDisplayName = "Google Doc";
                docPromise = extractGoogleDoc(docUrl);
            } else if (rawText) {
                docDisplayName = "Document Text";
                docPromise = Promise.resolve(extractTextFile(rawText, "Document Text"));
            } else {
                return NextResponse.json({ success: false, error: "Please provide a Google Doc URL or document text." }, { status: 400 });
            }
        }

        // Validate URL format
        try {
            const u = new URL(webUrl);
            if (!['http:', 'https:'].includes(u.protocol)) throw new Error();
        } catch {
            return NextResponse.json({ success: false, error: "Target URL must be a valid HTTP or HTTPS web address." }, { status: 400 });
        }

        // Run both document parsing and target web page extraction concurrently for maximum speed
        const [docData, webData] = await Promise.all([
            docPromise,
            extractContent(webUrl),
        ]);

        if (docData.lines.length === 0) {
            throw new Error("No readable text found in the source document.");
        }
        if (webData.lines.length === 0) {
            throw new Error(`No readable text found on the target web page (${webUrl}).`);
        }

        // Compare lines using existing high-speed diff engine
        const diff = compareLines(docData.lines, webData.lines);

        return NextResponse.json({
            success: true,
            data: {
                oldUrl: docDisplayName || docData.title,
                newUrl: webUrl,
                oldTitle: docData.title,
                newTitle: webData.title,
                sourceType: docData.sourceType,
                docWordCount: docData.wordCount,
                webMode: webData.mode,
                diff,
            },
        });
    } catch (err: unknown) {
        console.error("Doc to URL comparison error:", err);
        return NextResponse.json(
            { success: false, error: err instanceof Error ? err.message : "Document comparison failed." },
            { status: 500 }
        );
    }
}
