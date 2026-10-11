import { diffArrays } from 'diff';

export interface DiffLine {
    /** 'h1'..'h6' or 'text' */
    tag: string;
    text: string;
}

export interface DiffSegment {
    value: string;
    changed: boolean;
}

export type RowKind = 'same' | 'changed' | 'removed' | 'added';

export interface DiffRow {
    kind: RowKind;
    old?: DiffLine;
    new?: DiffLine;
    /** word-level pieces, only for kind === 'changed' */
    oldSegments?: DiffSegment[];
    newSegments?: DiffSegment[];
    /** same content, but the heading tag differs (e.g. h2 -> h3, or text -> h2) */
    tagChanged?: boolean;
}

export interface DiffResult {
    score: number;
    verdict: string;
    isExactMatch: boolean;
    removeWords: number;
    addWords: number;
    tagChanges: number;
    rows: DiffRow[];
}

/* ------------------------------------------------------------------ */
/* Matching rules: what counts as "the same content"                   */
/* ------------------------------------------------------------------ */

/** Lowercase, letters and digits only. Case, punctuation, spacing, dashes are ignored. */
const canon = (s: string): string =>
    s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

const tokens = (s: string): string[] => s.match(/\S+\s*/g) ?? [];
const tokenKey = (t: string): string => canon(t) || t.trim().toLowerCase();
const words = (s: string): number => s.split(/\s+/).filter(Boolean).length;

/** Dice similarity of two lines (0..1) on word keys. Used to pair a removed line with its edited version. */
function similarity(a: string, b: string): number {
    const ta = tokens(a).map(tokenKey);
    const tb = tokens(b).map(tokenKey);
    if (!ta.length || !tb.length) return 0;
    const bag = new Map<string, number>();
    for (const t of ta) bag.set(t, (bag.get(t) ?? 0) + 1);
    let shared = 0;
    for (const t of tb) {
        const n = bag.get(t) ?? 0;
        if (n > 0) {
            shared++;
            bag.set(t, n - 1);
        }
    }
    return (2 * shared) / (ta.length + tb.length);
}

/** Word-level diff of two edited lines. Each side keeps its OWN original text. */
function wordDiff(a: string, b: string) {
    const ta = tokens(a);
    const tb = tokens(b);
    const parts = diffArrays(ta.map(tokenKey), tb.map(tokenKey));

    const oldSegments: DiffSegment[] = [];
    const newSegments: DiffSegment[] = [];
    let i = 0;
    let j = 0;
    let add = 0;
    let rem = 0;
    let eq = 0;

    for (const p of parts) {
        const n = p.value.length;
        if (p.added) {
            newSegments.push({ value: tb.slice(j, j + n).join(''), changed: true });
            add += n;
            j += n;
        } else if (p.removed) {
            oldSegments.push({ value: ta.slice(i, i + n).join(''), changed: true });
            rem += n;
            i += n;
        } else {
            oldSegments.push({ value: ta.slice(i, i + n).join(''), changed: false });
            newSegments.push({ value: tb.slice(j, j + n).join(''), changed: false });
            eq += n;
            i += n;
            j += n;
        }
    }
    return { oldSegments, newSegments, add, rem, eq };
}

/* ------------------------------------------------------------------ */
/* Main compare                                                        */
/* ------------------------------------------------------------------ */

export function compareLines(oldInput: DiffLine[], newInput: DiffLine[]): DiffResult {
    const oldLines = oldInput.filter((l) => canon(l.text));
    const newLines = newInput.filter((l) => canon(l.text));

    // Line-by-line alignment on the canonical key, so "PROCESS" == "Process",
    // "Built- ins" == "Built-ins", "Double Shaker" == "DoubleShaker".
    const changes = diffArrays(
        oldLines.map((l) => canon(l.text)),
        newLines.map((l) => canon(l.text))
    );

    const rows: DiffRow[] = [];
    let addWords = 0;
    let removeWords = 0;
    let equalWords = 0;
    let tagChanges = 0;

    let pendingRemoved: DiffLine[] = [];
    let pendingAdded: DiffLine[] = [];

    // A block of removed + added lines: pair the ones that are edits of each other.
    const flushChanged = () => {
        let j = 0;
        for (const r of pendingRemoved) {
            let found = -1;
            for (let k = j; k < pendingAdded.length; k++) {
                if (similarity(r.text, pendingAdded[k].text) >= 0.5) {
                    found = k;
                    break;
                }
            }

            if (found === -1) {
                rows.push({ kind: 'removed', old: r });
                removeWords += words(r.text);
                continue;
            }

            for (; j < found; j++) {
                rows.push({ kind: 'added', new: pendingAdded[j] });
                addWords += words(pendingAdded[j].text);
            }

            const a = pendingAdded[found];
            const wd = wordDiff(r.text, a.text);
            const tagChanged = r.tag !== a.tag;
            if (tagChanged) tagChanges++;
            rows.push({
                kind: 'changed',
                old: r,
                new: a,
                oldSegments: wd.oldSegments,
                newSegments: wd.newSegments,
                tagChanged,
            });
            addWords += wd.add;
            removeWords += wd.rem;
            equalWords += wd.eq;
            j = found + 1;
        }

        for (; j < pendingAdded.length; j++) {
            rows.push({ kind: 'added', new: pendingAdded[j] });
            addWords += words(pendingAdded[j].text);
        }

        pendingRemoved = [];
        pendingAdded = [];
    };

    let oi = 0;
    let ni = 0;

    for (const change of changes) {
        const n = change.value.length;

        if (change.added) {
            pendingAdded.push(...newLines.slice(ni, ni + n));
            ni += n;
        } else if (change.removed) {
            pendingRemoved.push(...oldLines.slice(oi, oi + n));
            oi += n;
        } else {
            flushChanged();
            for (let k = 0; k < n; k++) {
                const o = oldLines[oi + k];
                const nw = newLines[ni + k];
                const tagChanged = o.tag !== nw.tag;
                if (tagChanged) tagChanges++;
                rows.push({ kind: 'same', old: o, new: nw, tagChanged });
                equalWords += words(nw.text);
            }
            oi += n;
            ni += n;
        }
    }
    flushChanged();

    // Dice similarity: 2 * shared / (old + new). Symmetric, not skewed by which page is longer.
    const oldTotal = equalWords + removeWords;
    const newTotal = equalWords + addWords;
    const score =
        oldTotal + newTotal === 0 ? 100 : Math.round(((2 * equalWords) / (oldTotal + newTotal)) * 100);

    const verdict =
        score === 100 ? 'Identical' :
            score >= 90 ? 'Minor Changes' :
                score >= 60 ? 'Moderate Changes' : 'Major Changes';

    return {
        score,
        verdict,
        isExactMatch: rows.every((r) => r.kind === 'same'),
        removeWords,
        addWords,
        tagChanges,
        rows,
    };
}