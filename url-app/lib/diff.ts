import { diffArrays } from 'diff';

export interface DiffLine {
    /** 'h1'..'h6' or 'text' (only used for the badge, never for matching) */
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
    /** the content exists on both pages but at a different position (NOT a difference) */
    moved?: boolean;
}

export interface DiffResult {
    score: number;
    verdict: string;
    isExactMatch: boolean;
    removeWords: number;
    addWords: number;
    movedLines: number;
    rows: DiffRow[];
}

/* ------------------------------------------------------------------ */
/* Matching rules: what counts as "the same content"                   */
/*   - capital letters, punctuation, spaces, dashes: ignored            */
/*   - heading level (h2 / h3 / h4): ignored                            */
/*   - position on the page: ignored                                    */
/* ------------------------------------------------------------------ */

const canon = (s: string): string =>
    s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

const tokens = (s: string): string[] => s.match(/\S+\s*/g) ?? [];
const tokenKey = (t: string): string => canon(t) || t.trim().toLowerCase();
const words = (s: string): number => s.split(/\s+/).filter(Boolean).length;

/** Dice similarity of two lines (0..1) on word keys. Used to pair a line with its edited version. */
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

    for (const p of parts) {
        const n = p.value.length;
        if (p.added) {
            newSegments.push({ value: tb.slice(j, j + n).join(''), changed: true });
            j += n;
        } else if (p.removed) {
            oldSegments.push({ value: ta.slice(i, i + n).join(''), changed: true });
            i += n;
        } else {
            oldSegments.push({ value: ta.slice(i, i + n).join(''), changed: false });
            newSegments.push({ value: tb.slice(j, j + n).join(''), changed: false });
            i += n;
            j += n;
        }
    }
    return { oldSegments, newSegments };
}

/* ------------------------------------------------------------------ */
/* Main compare                                                        */
/* ------------------------------------------------------------------ */

export function compareLines(oldInput: DiffLine[], newInput: DiffLine[]): DiffResult {
    const oldLines = oldInput.filter((l) => canon(l.text));
    const newLines = newInput.filter((l) => canon(l.text));

    // 1) Align both pages line by line (keeps the screen readable, row by row)
    const changes = diffArrays(
        oldLines.map((l) => canon(l.text)),
        newLines.map((l) => canon(l.text))
    );

    let rows: DiffRow[] = [];
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
                continue;
            }

            for (; j < found; j++) rows.push({ kind: 'added', new: pendingAdded[j] });

            const a = pendingAdded[found];
            const wd = wordDiff(r.text, a.text);
            rows.push({
                kind: 'changed',
                old: r,
                new: a,
                oldSegments: wd.oldSegments,
                newSegments: wd.newSegments,
            });
            j = found + 1;
        }

        for (; j < pendingAdded.length; j++) rows.push({ kind: 'added', new: pendingAdded[j] });

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
                rows.push({ kind: 'same', old: oldLines[oi + k], new: newLines[ni + k] });
            }
            oi += n;
            ni += n;
        }
    }
    flushChanged();

    // 2) Position does not matter: a "removed" line whose text exists as an "added"
    //    line somewhere else is the SAME content, just moved. Merge them into one row.
    const drop = new Set<number>();

    const addedByKey = new Map<string, number[]>();
    rows.forEach((r, i) => {
        if (r.kind !== 'added') return;
        const key = canon(r.new!.text);
        const list = addedByKey.get(key);
        if (list) list.push(i);
        else addedByKey.set(key, [i]);
    });

    rows.forEach((r, i) => {
        if (r.kind !== 'removed') return;
        const j = addedByKey.get(canon(r.old!.text))?.shift();
        if (j === undefined) return;
        rows[j] = { kind: 'same', old: r.old, new: rows[j].new, moved: true };
        drop.add(i);
    });

    // 3) Moved AND edited: pair what is left when the lines are clearly the same text.
    rows.forEach((r, i) => {
        if (r.kind !== 'removed' || drop.has(i)) return;
        let best = -1;
        let bestSim = 0;
        for (let j = 0; j < rows.length; j++) {
            if (rows[j].kind !== 'added') continue;
            const s = similarity(r.old!.text, rows[j].new!.text);
            if (s >= 0.6 && s > bestSim) {
                best = j;
                bestSim = s;
            }
        }
        if (best === -1) return;
        const wd = wordDiff(r.old!.text, rows[best].new!.text);
        rows[best] = {
            kind: 'changed',
            old: r.old,
            new: rows[best].new,
            oldSegments: wd.oldSegments,
            newSegments: wd.newSegments,
            moved: true,
        };
        drop.add(i);
    });

    rows = rows.filter((_, i) => !drop.has(i));

    // 4) Numbers
    let addWords = 0;
    let removeWords = 0;
    let equalWords = 0;
    let movedLines = 0;

    for (const r of rows) {
        if (r.moved) movedLines++;
        switch (r.kind) {
            case 'same':
                equalWords += words(r.new!.text);
                break;
            case 'removed':
                removeWords += words(r.old!.text);
                break;
            case 'added':
                addWords += words(r.new!.text);
                break;
            case 'changed':
                for (const s of r.oldSegments ?? []) if (s.changed) removeWords += words(s.value);
                for (const s of r.newSegments ?? []) {
                    const n = words(s.value);
                    if (s.changed) addWords += n;
                    else equalWords += n;
                }
                break;
        }
    }

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
        movedLines,
        rows,
    };
}