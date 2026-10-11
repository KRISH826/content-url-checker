import * as cheerio from 'cheerio';

export interface ExtractedData {
    title: string;
    text: string;
}

const FORBIDDEN_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254'];

export async function extractContent(url: string): Promise<ExtractedData> {
    const parsed = new URL(url);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error(`Unsupported protocol: ${parsed.protocol}`);
    }

    if (FORBIDDEN_HOSTS.includes(parsed.hostname)) {
        throw new Error(`Restricted host blocked: ${parsed.hostname}`);
    }

    const res = await fetch(parsed.toString(), {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ContentAudit/1.0',
            'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status} failed while fetching: ${url}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Format block elements with linebreaks so headings & paragraphs are preserved
    $('h1').prepend('\n\n# ').append('\n\n');
    $('h2, h3').prepend('\n\n## ').append('\n\n');
    $('p').append('\n\n');
    $('button, a.btn, a.button').each((_, el) => {
        const t = $(el).text().trim();
        if (t) $(el).replaceWith(` [${t}] `);
    });

    $('script, style, nav, footer, header, noscript, svg, iframe, form').remove();

    const container = $('main, article, [role="main"], #content, .content, #main').first();
    const target = container.length && container.text().trim().length > 50 ? container : $('body');

    const title = $('title').first().text().trim() || $('h1').first().text().trim() || 'Untitled';
    let text = target.text().replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

    // If empty (React SPA), fallback to rendered text
    if (text.length < 50) {
        try {
            const r = await fetch(`https://r.jina.ai/${parsed.toString()}`, { signal: AbortSignal.timeout(10000) });
            if (r.ok) text = (await r.text()).replace(/^Title:[^\n]*\n?/, '').trim();
        } catch {
            text = $('meta[name="description"]').attr('content') || '';
        }
    }

    return { title, text };
}