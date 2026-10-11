import * as cheerio from 'cheerio';
import fs from 'node:fs';
import puppeteer, { type Browser } from 'puppeteer-core';

export interface ContentLine {
    /** 'h1'..'h6' for headings, 'text' for everything else */
    tag: string;
    text: string;
}

export interface ExtractedData {
    title: string;
    lines: ContentLine[];
    /** All lines joined with \n (handy for logging / copy) */
    text: string;
    /** 'browser' = rendered by a real browser, 'static' = raw HTML fallback (less accurate) */
    mode: 'browser' | 'static';
}

export interface ExtractOptions {
    /** Only read <main>/<article> instead of the whole page. Default: false */
    mainOnly?: boolean;
}

const UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

/* ------------------------------------------------------------------ */
/* 1. URL safety                                                       */
/* ------------------------------------------------------------------ */

const PRIVATE_V4 = /^(0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

function assertPublicUrl(raw: string): URL {
    const u = new URL(raw);
    if (!['http:', 'https:'].includes(u.protocol)) {
        throw new Error(`Unsupported protocol: ${u.protocol}`);
    }
    const h = u.hostname.toLowerCase();
    if (
        h === 'localhost' ||
        h.endsWith('.localhost') ||
        h.endsWith('.internal') ||
        h === '[::1]' ||
        PRIVATE_V4.test(h)
    ) {
        throw new Error(`Restricted host blocked: ${h}`);
    }
    return u;
}

/* ------------------------------------------------------------------ */
/* 2. Text helpers shared by browser + static mode                     */
/* ------------------------------------------------------------------ */

/** Same typography on every site: ’ vs ', — vs -, nbsp, zero-width chars... */
export function normalizeText(s: string): string {
    return s
        .normalize('NFKC')
        .replace(/[\u200B-\u200D\u2060\uFEFF\u00AD]/g, '')
        .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
        .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
        .replace(/[\u2013\u2014\u2212]/g, '-')
        .replace(/\s+/g, ' ')
        .trim();
}

const SKIP_LINE = /^skip to (main )?(content|navigation)$/i;

function cleanLines(raw: ContentLine[]): ContentLine[] {
    const out: ContentLine[] = [];
    for (const l of raw) {
        const text = normalizeText(l.text);
        if (!text) continue;
        if (!/[\p{L}\p{N}]/u.test(text)) continue; // only icons / punctuation
        if (SKIP_LINE.test(text)) continue; // accessibility skip-links are not page content

        const prev = out[out.length - 1];
        if (prev && prev.text === text) {
            // carousel / duplicate line: keep one, prefer the heading tag
            if (prev.tag === 'text' && l.tag !== 'text') prev.tag = l.tag;
            continue;
        }
        out.push({ tag: l.tag, text });
    }
    return out;
}

/* ------------------------------------------------------------------ */
/* 3. Browser launch                                                   */
/* ------------------------------------------------------------------ */

/** Find a browser already installed on this machine (Windows / macOS / Linux). */
function findLocalBrowser(): string | undefined {
    const local = process.env.LOCALAPPDATA;
    const candidates = [
        process.env.CHROME_PATH,
        // Windows
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        local && `${local}\\Google\\Chrome\\Application\\chrome.exe`,
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        // macOS
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        // Linux
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
    ];
    return candidates.find((p): p is string => !!p && fs.existsSync(p));
}

async function launchBrowser(): Promise<Browser> {
    // 1) A browser installed on this machine (your Windows PC in development)
    const local = findLocalBrowser();
    if (local) {
        return puppeteer.launch({
            executablePath: local,
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
    }

    // 2) Linux serverless (Vercel / Lambda): bundled Chromium. Linux only.
    if (process.platform === 'linux') {
        const { default: chromium } = await import('@sparticuz/chromium');
        return puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath(),
            headless: true,
        });
    }

    throw new Error(
        'No Chrome/Edge found. Install Google Chrome or set CHROME_PATH in .env.local to its chrome.exe.'
    );
}

/* ------------------------------------------------------------------ */
/* 4. Browser mode: read the page the way a visitor SEES it            */
/* ------------------------------------------------------------------ */

async function renderWithBrowser(
    url: string,
    mainOnly: boolean
): Promise<{ lines: ContentLine[]; title: string }> {
    const browser = await launchBrowser();

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1366, height: 900 });
        await page.setUserAgent(UA);

        // Text only: skip images/media/fonts (CSS still loads, so layout is real)
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const t = req.resourceType();
            if (t === 'image' || t === 'media' || t === 'font') void req.abort();
            else void req.continue();
        });

        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });
        } catch (e) {
            // Sites with endless analytics requests never reach "idle": use what has loaded.
            if (!(e instanceof Error && e.name === 'TimeoutError')) throw e;
        }
        assertPublicUrl(page.url()); // re-check after redirects

        // Scroll through the page so lazy-loaded / on-scroll sections render
        await page.evaluate(async () => {
            await new Promise<void>((resolve) => {
                let y = 0;
                const timer = setInterval(() => {
                    window.scrollBy(0, 600);
                    y += 600;
                    if (y >= document.body.scrollHeight + 600 || y > 30000) {
                        clearInterval(timer);
                        window.scrollTo(0, 0);
                        resolve();
                    }
                }, 120);
            });
        });
        await new Promise((r) => setTimeout(r, 800));

        // This function runs INSIDE the page, so it can use real computed CSS.
        // Block-level / flex / grid items start a new line, inline text stays together,
        // so "Collaborations" + "Service Areas" + "Blog" never glue together, and a
        // <ul><li> menu and a <div> menu give the same lines.
        const lines = await page.evaluate((onlyMain: boolean) => {
            const out: { tag: string; text: string }[] = [];
            let buf = '';
            let heading: string | null = null;

            const SKIP_TAGS = new Set([
                'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'CANVAS', 'IFRAME', 'OBJECT', 'EMBED',
                'INPUT', 'SELECT', 'OPTION', 'TEXTAREA', 'DATALIST', 'HEAD', 'LINK', 'META',
                'VIDEO', 'AUDIO',
            ]);
            const NOISE = /cookie|consent|cmplz|onetrust|cookiebot|gdpr/i;

            const flush = () => {
                const t = buf.replace(/\s+/g, ' ').trim();
                buf = '';
                if (t) out.push({ tag: heading ?? 'text', text: t });
            };

            const isHidden = (el: HTMLElement, cs: CSSStyleDeclaration) => {
                if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse') return true;
                if (el.hidden || el.getAttribute('aria-hidden') === 'true') return true;
                const r = el.getBoundingClientRect();
                // screen-reader-only helpers (1px boxes)
                if (r.width <= 1 && r.height <= 1 && cs.overflow !== 'visible') return true;
                // off-screen "skip to content" links
                if (
                    el.tagName === 'A' &&
                    (el.getAttribute('href') || '').startsWith('#') &&
                    (r.right <= 0 || r.bottom <= 0)
                ) {
                    return true;
                }
                return false;
            };

            const walk = (node: Node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    buf += node.textContent ?? '';
                    return;
                }
                // Only HTML elements (skips svg, math, comments)
                if (!(node instanceof HTMLElement)) return;

                const tag = node.tagName;
                if (tag === 'BR') {
                    flush();
                    return;
                }
                if (SKIP_TAGS.has(tag)) return;

                const cls = typeof node.className === 'string' ? node.className : '';
                if (NOISE.test(node.id) || NOISE.test(cls)) return;

                const cs = getComputedStyle(node);
                if (isHidden(node, cs)) return;

                const d = cs.display;
                const isInline = d === 'inline' || d === 'contents';
                const isInlineBox = !isInline && d.startsWith('inline-'); // inline-block / inline-flex ...
                const isBlock = !isInline && !isInlineBox;
                const startsHeading = /^H[1-6]$/.test(tag) && heading === null;

                if (isBlock || startsHeading) flush();
                if (isInlineBox) buf += ' ';
                if (startsHeading) heading = tag.toLowerCase();

                node.childNodes.forEach(walk);

                if (isBlock || startsHeading) flush();
                if (startsHeading) heading = null;
                if (isInlineBox) buf += ' ';
            };

            let root: HTMLElement = document.body;
            if (onlyMain) {
                const m = document.querySelector<HTMLElement>('main, [role="main"], article');
                if (m && (m.innerText || '').trim().length > 200) root = m;
            }

            walk(root);
            flush();
            return out;
        }, mainOnly);

        return { lines, title: await page.title() };
    } finally {
        await browser.close();
    }
}

/* ------------------------------------------------------------------ */
/* 5. Static fallback (no browser): raw HTML via cheerio               */
/* ------------------------------------------------------------------ */

async function fetchStatic(url: string): Promise<string> {
    const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} failed while fetching: ${url}`);
    return res.text();
}

interface DomNode {
    type: string;
    name?: string;
    data?: string;
    children?: DomNode[];
}

const BLOCK_TAGS = new Set([
    'address', 'article', 'aside', 'blockquote', 'body', 'button', 'dd', 'details', 'div', 'dl', 'dt',
    'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header',
    'hr', 'li', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'summary', 'table', 'tbody', 'td', 'tfoot',
    'th', 'thead', 'tr', 'ul', 'label', 'legend', 'a',
]);
const NOISE = /cookie|consent|cmplz|onetrust|cookiebot|gdpr/i;

export function extractLinesFromHtml(
    html: string,
    mainOnly = false
): { lines: ContentLine[]; title: string } {
    const $ = cheerio.load(html);
    const title = $('title').first().text() || $('h1').first().text();

    $(
        'script, style, noscript, template, svg, canvas, iframe, link, meta, head, input, select, option, textarea, datalist, [hidden], [aria-hidden="true"]'
    ).remove();
    $(
        '[style*="display:none"], [style*="display: none"], [style*="visibility:hidden"], [style*="visibility: hidden"]'
    ).remove();
    $('body *')
        .filter((_, el) => NOISE.test($(el).attr('id') ?? '') || NOISE.test($(el).attr('class') ?? ''))
        .remove();

    let root = $('body').get(0) as unknown as DomNode | undefined;
    if (mainOnly) {
        const main = $('main, [role="main"], article').first();
        if (main.length && main.text().trim().length > 200) root = main.get(0) as unknown as DomNode;
    }
    if (!root) return { lines: [], title };

    const raw: ContentLine[] = [];
    let buf = '';
    let heading: string | null = null;

    const flush = () => {
        const t = buf.replace(/\s+/g, ' ').trim();
        buf = '';
        if (t) raw.push({ tag: heading ?? 'text', text: t });
    };

    const walk = (node: DomNode) => {
        if (node.type === 'text') {
            buf += node.data ?? '';
            return;
        }
        if (node.type !== 'tag') return;

        const tag = (node.name ?? '').toLowerCase();
        if (tag === 'br') {
            flush();
            return;
        }

        const isHeading = /^h[1-6]$/.test(tag);
        const isBlock = BLOCK_TAGS.has(tag) || isHeading;
        const startsHeading = isHeading && heading === null;

        if (isBlock) flush();
        if (startsHeading) heading = tag;

        (node.children ?? []).forEach(walk);

        if (isBlock) flush();
        if (startsHeading) heading = null;
    };

    walk(root);
    flush();

    return { lines: cleanLines(raw), title };
}

/* ------------------------------------------------------------------ */
/* 6. Public API                                                       */
/* ------------------------------------------------------------------ */

export async function extractContent(url: string, opts: ExtractOptions = {}): Promise<ExtractedData> {
    const parsed = assertPublicUrl(url);
    const mainOnly = opts.mainOnly ?? false;

    let mode: ExtractedData['mode'] = 'browser';
    let lines: ContentLine[];
    let title: string;

    try {
        const r = await renderWithBrowser(parsed.toString(), mainOnly);
        lines = cleanLines(r.lines);
        title = r.title;
    } catch (err) {
        console.warn(`Browser render failed for ${url}, falling back to static HTML:`, err);
        mode = 'static';
        const r = extractLinesFromHtml(await fetchStatic(parsed.toString()), mainOnly);
        lines = r.lines;
        title = r.title;
    }

    title = normalizeText(title) || lines.find((l) => l.tag === 'h1')?.text || 'Untitled';

    return { title, lines, text: lines.map((l) => l.text).join('\n'), mode };
}