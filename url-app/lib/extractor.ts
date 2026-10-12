import * as cheerio from 'cheerio';
import fs from 'node:fs';
import puppeteer, { type Browser } from 'puppeteer-core';

export interface ContentLine {
    tag: string;
    text: string;
}

export interface ExtractedData {
    title: string;
    lines: ContentLine[];
    text: string;
    mode: 'browser' | 'static';
}

const UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const PRIVATE_V4 = /^(0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;
const MIN_WORDS = 20;

function assertPublicUrl(raw: string): URL {
    const u = new URL(raw);
    if (!['http:', 'https:'].includes(u.protocol)) throw new Error(`Unsupported protocol: ${u.protocol}`);
    const h = u.hostname.toLowerCase();
    if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.internal') || h === '[::1]' || PRIVATE_V4.test(h)) {
        throw new Error(`Restricted host blocked: ${h}`);
    }
    return u;
}

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

const wordCount = (lines: ContentLine[]) =>
    lines.reduce((n, l) => n + l.text.split(' ').length, 0);

function toLines(text: string, headings: [string, string][]): ContentLine[] {
    const tags = new Map(headings.map(([tag, h]) => [normalizeText(h), tag]));
    const out: ContentLine[] = [];
    for (const raw of text.split('\n')) {
        const t = normalizeText(raw);
        if (!t || !/[\p{L}\p{N}]/u.test(t) || /^skip to (main )?content$/i.test(t)) continue;
        if (out[out.length - 1]?.text === t) continue;
        out.push({ tag: tags.get(t) ?? 'text', text: t });
    }
    return out;
}

function findLocalBrowser(): string | undefined {
    const local = process.env.LOCALAPPDATA;
    return [
        process.env.CHROME_PATH,
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        local && `${local}\\Google\\Chrome\\Application\\chrome.exe`,
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
    ].find((p): p is string => !!p && fs.existsSync(p));
}

async function launchBrowser(): Promise<Browser> {
    const local = findLocalBrowser();
    if (local) {
        return puppeteer.launch({ executablePath: local, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    }
    if (process.platform === 'linux') {
        const { default: chromium } = await import('@sparticuz/chromium');
        return puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: true });
    }
    throw new Error('No Chrome/Edge found. Install Google Chrome or set CHROME_PATH in .env.local.');
}

async function getBrowser(): Promise<Browser> {
    const g = globalThis as { __compareBrowser?: Promise<Browser> };
    if (g.__compareBrowser) {
        const b = await g.__compareBrowser.catch(() => null);
        if (b?.connected) return b;
    }
    g.__compareBrowser = launchBrowser();
    return g.__compareBrowser;
}

async function readWithBrowser(url: string) {
    const page = await (await getBrowser()).newPage();
    try {
        await page.setUserAgent(UA);
        await page.setViewport({ width: 1366, height: 900 });
        await page.evaluateOnNewDocument('window.__name = window.__name || function (f) { return f; };');
        await page.setRequestInterception(true);
        page.on('request', (r) => (['image', 'media', 'font'].includes(r.resourceType()) ? void r.abort() : void r.continue()));

        const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        assertPublicUrl(page.url());
        await page.waitForNetworkIdle({ idleTime: 500, timeout: 4000 }).catch(() => { });
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise((r) => setTimeout(r, 400));
        await page.addStyleTag({ content: '.elementor-invisible{visibility:visible !important;opacity:1 !important}' });

        const data = await page.evaluate(() => {
            const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(
                (h) => [h.tagName.toLowerCase(), (h as HTMLElement).innerText] as [string, string]
            );
            const full = document.body.innerText;
            document
                .querySelectorAll(
                    'header,footer,nav,dialog,[role=banner],[role=contentinfo],[role=navigation],[aria-modal=true],' +
                    '[data-elementor-type=header],[data-elementor-type=footer],#onetrust-consent-sdk,' +
                    '#CybotCookiebotDialog,.cmplz-cookiebanner,#cookie-law-info-bar,.cky-consent-container'
                )
                .forEach((el) => {
                    if (!el.closest('main,article') && !el.querySelector('h1')) el.remove();
                });
            document.querySelectorAll('[id*=cookie i],[class*=cookie i],[id*=consent i],[class*=consent i]').forEach((el) => {
                const small = (el as HTMLElement).innerText.length < 800;
                if (small && el !== document.body && !el.querySelector('h1,main,article')) el.remove();
            });
            const cleaned = document.body.innerText;
            const enough = cleaned.split(/\s+/).filter(Boolean).length >= 20;
            return { text: enough ? cleaned : full, headings, title: document.title };
        });

        return { ...data, status: res?.status(), finalUrl: page.url() };
    } finally {
        await page.close();
    }
}

async function readStatic(url: string) {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status} while fetching ${url}`);
    const $ = cheerio.load(await res.text());
    const title = $('title').first().text();
    const headings = $('h1,h2,h3,h4,h5,h6')
        .map((_, el) => [[el.tagName.toLowerCase(), $(el).text()]])
        .get() as [string, string][];
    $('script,style,noscript,template,svg,iframe,input,select,textarea,header,footer,nav,[role=banner],[role=contentinfo],[role=navigation]')
        .filter((_, el) => !$(el).parent().closest('main,article').length && !$(el).find('h1').length)
        .remove();
    $('br').replaceWith('\n');
    $('p,div,li,h1,h2,h3,h4,h5,h6,section,article,tr').append('\n');
    return { lines: toLines($('body').text(), headings), title };
}

export async function extractContent(url: string): Promise<ExtractedData> {
    const parsed = assertPublicUrl(url);
    let mode: ExtractedData['mode'] = 'browser';
    let lines: ContentLine[] = [];
    let title = '';
    let note = '';

    try {
        const r = await readWithBrowser(parsed.toString());
        lines = toLines(r.text, r.headings);
        title = r.title;
        note = `browser HTTP ${r.status ?? '?'}, final URL ${r.finalUrl}`;
    } catch (err) {
        note = `browser error: ${err instanceof Error ? err.message : String(err)}`;
        console.warn(`Browser read failed for ${url}:`, err);
    }

    if (wordCount(lines) < MIN_WORDS) {
        mode = 'static';
        const s = await readStatic(parsed.toString());
        if (s.lines.length > lines.length) {
            lines = s.lines;
            title = title || s.title;
        }
    }

    if (lines.length === 0) throw new Error(`No readable text found on ${url} (${note})`);

    title = normalizeText(title) || lines.find((l) => l.tag === 'h1')?.text || 'Untitled';
    return { title, lines, text: lines.map((l) => l.text).join('\n'), mode };
}