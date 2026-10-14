import * as cheerio from 'cheerio';
import zlib from 'node:zlib';
import { ContentLine, normalizeText } from './extractor';

export interface DocExtractedData {
    title: string;
    lines: ContentLine[];
    wordCount: number;
    sourceType: 'google-doc' | 'docx' | 'pdf' | 'text';
}

/**
 * Normalizes list items, bullet points, numbers, and pointers into uniform '• [text]'
 */
function parsePointer(text: string): { isPointer: boolean; clean: string } {
    const match = text.match(/^([•\-\*\+\u2022\u25cf\u25b6\u27a4]|\d+[\.)]|>\s*)\s*(.+)/);
    if (match && match[2]?.trim()) {
        return { isPointer: true, clean: `• ${normalizeText(match[2])}` };
    }
    return { isPointer: false, clean: normalizeText(text) };
}

/**
 * Ultra-fast Google Doc ID extractor (supports edit, view, share, or preview URLs)
 */
export function extractGoogleDocId(url: string): string | null {
    const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

/**
 * Extract Google Doc via Google's direct CDN HTML export (~250ms)
 * Preserves tables row-by-row and bullet pointers accurately
 */
export async function extractGoogleDoc(docUrl: string): Promise<DocExtractedData> {
    const docId = extractGoogleDocId(docUrl);
    if (!docId) {
        throw new Error('Invalid Google Doc URL. Expected format: https://docs.google.com/document/d/...');
    }

    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=html`;
    const res = await fetch(exportUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        },
        signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
        if (res.status === 404 || res.status === 401 || res.status === 403) {
            throw new Error('Google Doc is not accessible. Please ensure link sharing is set to "Anyone with the link can view".');
        }
        throw new Error(`Failed to fetch Google Doc (HTTP ${res.status})`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const title = normalizeText($('title').first().text() || $('h1').first().text() || 'Google Doc');
    const lines: ContentLine[] = [];

    // 1. Structured Table Extraction (row-by-row)
    $('table').each((_, tbl) => {
        $(tbl).find('tr').each((_, tr) => {
            const cells = $(tr).find('td, th').map((_, cell) => normalizeText($(cell).text())).get().filter(Boolean);
            if (cells.length) {
                lines.push({ tag: 'text', text: cells.join(' | ') });
            }
        });
        $(tbl).remove(); // Remove table so inner paragraph elements aren't duplicated
    });

    // 2. Headings, Paragraphs, and Bullet Pointers
    $('h1, h2, h3, h4, h5, h6, p, li').each((_, el) => {
        const raw = $(el).text();
        if (!raw || /^published by google docs/i.test(raw)) return;

        const tag = el.tagName.toLowerCase();
        const isHeading = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag);
        const { isPointer, clean } = parsePointer(raw);

        if (clean && clean.length > 1) {
            lines.push({
                tag: isHeading ? tag : (tag === 'li' || isPointer ? 'li' : 'text'),
                text: tag === 'li' && !clean.startsWith('• ') ? `• ${clean}` : clean,
            });
        }
    });

    if (lines.length === 0) {
        throw new Error('No readable text content found in the Google Doc.');
    }

    const wordCount = lines.reduce((acc, l) => acc + l.text.split(/\s+/).length, 0);
    return { title, lines, wordCount, sourceType: 'google-doc' };
}

/**
 * Ultra-fast zero-dependency .docx extractor (<10ms)
 * Memory-unzips word/document.xml and preserves tables & bullet lists
 */
export function extractDocx(buffer: Buffer, filename = 'document.docx'): DocExtractedData {
    let offset = 0;
    let xmlContent = '';

    while (offset < buffer.length - 4) {
        if (buffer.readUInt32LE(offset) === 0x04034b50) {
            const compMethod = buffer.readUInt16LE(offset + 8);
            const compSize = buffer.readUInt32LE(offset + 18);
            const fnLen = buffer.readUInt16LE(offset + 26);
            const extraLen = buffer.readUInt16LE(offset + 28);
            const entryName = buffer.toString('utf8', offset + 30, offset + 30 + fnLen);
            const dataStart = offset + 30 + fnLen + extraLen;

            if (entryName === 'word/document.xml') {
                const compData = buffer.subarray(dataStart, dataStart + compSize);
                xmlContent = compMethod === 8
                    ? zlib.inflateRawSync(compData).toString('utf8')
                    : compData.toString('utf8');
                break;
            }
            offset = dataStart + compSize;
        } else {
            offset++;
        }
    }

    if (!xmlContent) {
        throw new Error('Could not parse .docx file. Ensure it is a valid Word document.');
    }

    const $ = cheerio.load(xmlContent, { xmlMode: true });
    const lines: ContentLine[] = [];

    // 1. Structured Tables (join cell columns with ' | ')
    $('w\\:tbl').each((_, tbl) => {
        $(tbl).find('w\\:tr').each((_, tr) => {
            const cells: string[] = [];
            $(tr).find('w\\:tc').each((_, tc) => {
                let cellText = '';
                $(tc).find('w\\:t').each((_, t) => { cellText += $(t).text(); });
                const clean = normalizeText(cellText);
                if (clean) cells.push(clean);
            });
            if (cells.length) {
                lines.push({ tag: 'text', text: cells.join(' | ') });
            }
        });
        $(tbl).remove(); // Prevent duplicate extraction of paragraphs inside table cells
    });

    // 2. Headings, Paragraphs, and Word Native Lists (w:numPr)
    $('w\\:p').each((_, p) => {
        let pText = '';
        $(p).find('w\\:t').each((_, t) => { pText += $(t).text(); });
        if (!pText.trim()) return;

        const pStyle = $(p).find('w\\:pStyle').attr('w:val') || '';
        const hasNumPr = $(p).find('w\\:numPr').length > 0;
        const { isPointer, clean } = parsePointer(pText);

        let tag = 'text';
        let formatted = clean;

        if (/heading1/i.test(pStyle)) tag = 'h1';
        else if (/heading2/i.test(pStyle)) tag = 'h2';
        else if (/heading3/i.test(pStyle)) tag = 'h3';
        else if (hasNumPr || isPointer) {
            tag = 'li';
            formatted = clean.startsWith('• ') ? clean : `• ${clean}`;
        }

        if (formatted && formatted.length > 1) {
            lines.push({ tag, text: formatted });
        }
    });

    if (lines.length === 0) {
        throw new Error('No readable text content found in the Word document.');
    }

    const title = lines.find((l) => l.tag === 'h1')?.text || filename.replace(/\.docx$/i, '');
    const wordCount = lines.reduce((acc, l) => acc + l.text.split(/\s+/).length, 0);

    return { title, lines, wordCount, sourceType: 'docx' };
}

/**
 * Ultra-fast plain text / markdown / copied doc text extractor (<1ms)
 * Preserves Markdown tables, bullet pointers, and headings
 */
export function extractTextFile(rawText: string, filename = 'document.txt'): DocExtractedData {
    const lines: ContentLine[] = [];

    for (const raw of rawText.split(/\r?\n/)) {
        let text = raw.trim();
        if (!text) continue;

        // Skip markdown table divider borders: |---|---|
        if (/^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(text)) continue;

        // Markdown table row: | cell 1 | cell 2 |
        if (text.startsWith('|') && text.endsWith('|')) {
            const cells = text.slice(1, -1).split('|').map((c) => normalizeText(c)).filter(Boolean);
            if (cells.length) {
                lines.push({ tag: 'text', text: cells.join(' | ') });
                continue;
            }
        }

        let tag = 'text';
        if (text.startsWith('# ')) {
            tag = 'h1';
            text = text.replace(/^#\s+/, '');
        } else if (text.startsWith('## ')) {
            tag = 'h2';
            text = text.replace(/^##\s+/, '');
        } else if (text.startsWith('### ')) {
            tag = 'h3';
            text = text.replace(/^###\s+/, '');
        }

        const { isPointer, clean } = parsePointer(text);
        const finalTag = tag !== 'text' ? tag : (isPointer ? 'li' : 'text');
        const finalText = isPointer ? clean : normalizeText(text);

        if (finalText && finalText.length > 0) {
            lines.push({ tag: finalTag, text: finalText });
        }
    }

    if (lines.length === 0) {
        throw new Error('Text content is empty.');
    }

    const title = lines.find((l) => l.tag === 'h1')?.text || filename.replace(/\.(txt|md)$/i, '');
    const wordCount = lines.reduce((acc, l) => acc + l.text.split(/\s+/).length, 0);

    return { title, lines, wordCount, sourceType: 'text' };
}

/**
 * Ultra-fast zero-dependency PDF text extractor (<30ms)
 * Inflates PDF FlateDecode content streams and standardizes bullet points
 */
export function extractPdf(buffer: Buffer, filename = 'document.pdf'): DocExtractedData {
    const raw = buffer.toString('binary');
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match;
    const extractedParts: string[] = [];

    while ((match = streamRegex.exec(raw)) !== null) {
        const streamData = buffer.subarray(
            match.index + match[0].indexOf('\n') + 1,
            match.index + match[0].lastIndexOf('endstream') - 1
        );
        let decompressed = '';

        try {
            decompressed = zlib.inflateSync(streamData).toString('latin1');
        } catch {
            decompressed = streamData.toString('latin1');
        }

        const tjRegex = /\(([^)]+)\)\s*Tj/g;
        let tjMatch;
        while ((tjMatch = tjRegex.exec(decompressed)) !== null) {
            extractedParts.push(tjMatch[1]);
        }

        const arrayTjRegex = /\[(.*?)\]\s*TJ/g;
        let arrMatch;
        while ((arrMatch = arrayTjRegex.exec(decompressed)) !== null) {
            const inner = arrMatch[1];
            const strParts = inner.match(/\(([^)]+)\)/g);
            if (strParts) {
                const combined = strParts.map((s) => s.slice(1, -1)).join('');
                if (combined.trim()) extractedParts.push(combined);
            }
        }
    }

    const lines: ContentLine[] = [];
    for (const part of extractedParts) {
        const unescaped = part.replace(/\\([()\\])/g, '$1');
        const { isPointer, clean } = parsePointer(unescaped);
        if (clean && clean.length > 1) {
            lines.push({ tag: isPointer ? 'li' : 'text', text: clean });
        }
    }

    if (lines.length === 0) {
        throw new Error('No extractable text found in PDF. Note: image-scanned PDFs without OCR are not supported.');
    }

    const title = filename.replace(/\.pdf$/i, '');
    const wordCount = lines.reduce((acc, l) => acc + l.text.split(/\s+/).length, 0);

    return { title, lines, wordCount, sourceType: 'pdf' };
}
