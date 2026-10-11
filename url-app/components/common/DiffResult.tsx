"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2,
    AlertTriangle,
    Columns,
    AlignLeft,
    Copy,
    Check,
    GitCompare,
    Filter,
} from "lucide-react";

export interface DiffLine {
    tag: string; // 'h1'..'h6' | 'text'
    text: string;
}

export interface DiffSegment {
    value: string;
    changed: boolean;
}

export interface DiffRow {
    kind: "same" | "changed" | "removed" | "added";
    old?: DiffLine;
    new?: DiffLine;
    oldSegments?: DiffSegment[];
    newSegments?: DiffSegment[];
    tagChanged?: boolean;
}

export interface DiffData {
    oldUrl: string;
    newUrl: string;
    oldTitle: string;
    newTitle: string;
    oldMode?: "browser" | "static";
    newMode?: "browser" | "static";
    diff: {
        score: number;
        verdict: string;
        isExactMatch: boolean;
        removeWords: number;
        addWords: number;
        tagChanges: number;
        rows: DiffRow[];
    };
}

/* ------------------------------ styling ------------------------------ */

const TAG_BADGE: Record<string, string> = {
    h1: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    h2: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    h3: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    h4: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
    h5: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
    h6: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
};

const TAG_TEXT: Record<string, string> = {
    h1: "text-xl font-extrabold",
    h2: "text-lg font-bold",
    h3: "text-base font-semibold",
    h4: "text-sm font-semibold",
    h5: "text-sm font-medium",
    h6: "text-sm font-medium",
};

const TONE: Record<string, string> = {
    rose: "bg-rose-500/10 border-l-2 border-rose-400",
    emerald: "bg-emerald-500/10 border-l-2 border-emerald-400",
    amber: "bg-amber-500/10 border-l-2 border-amber-400",
    "": "",
};

const tagLabel = (t: string) => (t === "text" ? "normal text" : t.toUpperCase());
const looseEqual = (a: string, b: string) =>
    a.trim().replace(/\s+/g, " ").toLowerCase() === b.trim().replace(/\s+/g, " ").toLowerCase();

/* ------------------------------ pieces ------------------------------ */

const LineView = ({
    line,
    segments,
    tone,
}: {
    line: DiffLine;
    segments?: DiffSegment[];
    tone?: "removed" | "added";
}) => {
    const isHeading = line.tag in TAG_BADGE;
    const textCls = isHeading ? TAG_TEXT[line.tag] : "text-sm";
    const hi =
        tone === "removed"
            ? "bg-rose-500/25 text-rose-900 dark:text-rose-200 line-through decoration-rose-500/60 rounded-xs px-0.5"
            : "bg-emerald-500/25 text-emerald-900 dark:text-emerald-200 rounded-xs px-0.5 font-semibold";

    return (
        <div className="flex items-start gap-2 min-w-0">
            <span className="w-7 shrink-0 pt-0.5">
                {isHeading && (
                    <span
                        className={`inline-block text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${TAG_BADGE[line.tag]}`}
                    >
                        {line.tag}
                    </span>
                )}
            </span>
            <p className={`${textCls} leading-relaxed text-foreground/90 min-w-0 [overflow-wrap:anywhere]`}>
                {segments
                    ? segments.map((s, i) => (
                        <span key={i} className={s.changed ? hi : undefined}>
                            {s.value}
                        </span>
                    ))
                    : line.text}
            </p>
        </div>
    );
};

const Gutter = ({ kind }: { kind: "removed" | "added" }) => (
    <span
        className={`w-3 shrink-0 select-none pt-1 text-xs font-bold ${kind === "removed" ? "text-rose-600" : "text-emerald-600"
            }`}
    >
        {kind === "removed" ? "−" : "+"}
    </span>
);

const TagNote = ({ row }: { row: DiffRow }) =>
    row.tagChanged && row.old && row.new ? (
        <p className="pl-9 pt-0.5 text-[11px] font-medium text-amber-600">
            Tag changed: {tagLabel(row.old.tag)} → {tagLabel(row.new.tag)}
        </p>
    ) : null;

const UnifiedRow = ({ row }: { row: DiffRow }) => {
    switch (row.kind) {
        case "same":
            return (
                <div className={`px-3 py-1.5 ${row.tagChanged ? TONE.amber : ""}`}>
                    <LineView line={row.new!} />
                    <TagNote row={row} />
                </div>
            );
        case "removed":
            return (
                <div className={`flex gap-2 px-3 py-1.5 ${TONE.rose}`}>
                    <Gutter kind="removed" />
                    <LineView line={row.old!} />
                </div>
            );
        case "added":
            return (
                <div className={`flex gap-2 px-3 py-1.5 ${TONE.emerald}`}>
                    <Gutter kind="added" />
                    <LineView line={row.new!} />
                </div>
            );
        case "changed":
            return (
                <div className={`space-y-1 px-3 py-1.5 ${TONE.amber}`}>
                    <div className="flex gap-2">
                        <Gutter kind="removed" />
                        <LineView line={row.old!} segments={row.oldSegments} tone="removed" />
                    </div>
                    <div className="flex gap-2">
                        <Gutter kind="added" />
                        <LineView line={row.new!} segments={row.newSegments} tone="added" />
                    </div>
                    <TagNote row={row} />
                </div>
            );
        default:
            return null;
    }
};

const Cell = ({ row, side }: { row: DiffRow; side: "old" | "new" }) => {
    const line = side === "old" ? row.old : row.new;
    if (!line) return <div className="hidden min-h-8 rounded-md bg-muted/30 lg:block" />;

    const segments = side === "old" ? row.oldSegments : row.newSegments;
    const tone =
        row.kind === "changed" ? "amber" :
            row.kind === "removed" ? "rose" :
                row.kind === "added" ? "emerald" :
                    row.tagChanged ? "amber" : "";

    return (
        <div className={`px-3 py-1.5 ${TONE[tone]}`}>
            <LineView line={line} segments={segments} tone={side === "old" ? "removed" : "added"} />
            {side === "new" && <TagNote row={row} />}
        </div>
    );
};

const SplitRow = ({ row }: { row: DiffRow }) => (
    <div className="grid grid-cols-1 gap-x-4 lg:grid-cols-2">
        <Cell row={row} side="old" />
        <Cell row={row} side="new" />
    </div>
);

/* ------------------------------ main ------------------------------ */

const DiffResult: React.FC<{ data?: DiffData | null }> = ({ data }) => {
    const [viewMode, setViewMode] = useState<"unified" | "split">("split");
    const [onlyChanges, setOnlyChanges] = useState(false);
    const [copied, setCopied] = useState(false);

    if (!data) {
        return (
            <Card className="border-dashed border-border/80 bg-card/40 py-12 text-center">
                <CardContent className="flex flex-col items-center justify-center space-y-2">
                    <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center text-muted-foreground">
                        <GitCompare className="size-5 text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">No comparison data yet</p>
                    <p className="text-xs text-muted-foreground">Enter two URLs above and click &quot;Run Comparison&quot;.</p>
                </CardContent>
            </Card>
        );
    }

    const { oldTitle, newTitle, diff, oldUrl, newUrl, oldMode, newMode } = data;
    const rows = diff.rows;
    const visibleRows = onlyChanges ? rows.filter((r) => r.kind !== "same" || r.tagChanged) : rows;

    const handleCopy = () => {
        const report = rows
            .map((r) => {
                if (r.kind === "removed") return `- ${r.old!.text}`;
                if (r.kind === "added") return `+ ${r.new!.text}`;
                if (r.kind === "changed") return `- ${r.old!.text}\n+ ${r.new!.text}`;
                if (r.tagChanged) return `~ [${tagLabel(r.old!.tag)} -> ${tagLabel(r.new!.tag)}] ${r.new!.text}`;
                return null;
            })
            .filter(Boolean)
            .join("\n");
        navigator.clipboard.writeText(report || "No content differences.");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const scoreBar = diff.score >= 90 ? "bg-emerald-500" : diff.score >= 60 ? "bg-amber-500" : "bg-rose-500";
    const verdictStyle =
        diff.score >= 90
            ? "bg-emerald-500/10 text-emerald-700"
            : diff.score >= 60
                ? "bg-amber-500/10 text-amber-700"
                : "bg-rose-500/10 text-rose-700";
    const totalChanged = diff.addWords + diff.removeWords || 1;
    const stats = [
        { label: "Added words", value: `+${diff.addWords.toLocaleString()}`, color: "text-emerald-600", bar: "bg-emerald-500", share: diff.addWords / totalChanged },
        { label: "Removed words", value: `−${diff.removeWords.toLocaleString()}`, color: "text-rose-600", bar: "bg-rose-500", share: diff.removeWords / totalChanged },
        { label: "Heading / tag changes", value: diff.tagChanges.toLocaleString(), color: "text-amber-600", bar: "bg-amber-500", share: undefined as number | undefined },
    ];
    const titlesMatch = looseEqual(oldTitle, newTitle);
    const staticUsed = oldMode === "static" || newMode === "static";

    return (
        <div className="space-y-6">
            {staticUsed && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <span>
                        The browser could not render {oldMode === "static" ? "the baseline" : ""}
                        {oldMode === "static" && newMode === "static" ? " and " : ""}
                        {newMode === "static" ? "the target" : ""} page, so raw HTML text was used. Results may be
                        less accurate for JavaScript sites.
                    </span>
                </div>
            )}

            {/* Metrics strip */}
            <div className="grid md:grid-cols-4 rounded-xl bg-card ring-1 ring-foreground/10 divide-y md:divide-y-0 md:divide-x divide-border">
                <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Content match</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${verdictStyle}`}>{diff.verdict}</span>
                    </div>
                    <p className="text-3xl font-bold tracking-tight">{diff.score}%</p>
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${scoreBar}`} style={{ width: `${diff.score}%` }} />
                    </div>
                </div>
                {stats.map((s) => (
                    <div key={s.label} className="p-5 space-y-3">
                        <span className="block text-xs font-medium text-muted-foreground">{s.label}</span>
                        <p className={`text-3xl font-bold tracking-tight ${s.color}`}>{s.value}</p>
                        <div className="h-1 rounded-full bg-muted overflow-hidden">
                            {s.share !== undefined && (
                                <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${s.share * 100}%` }} />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* SEO Title Card */}
            <Card className="border-border/60 bg-card/90 shadow-xs">
                <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between pb-3 border-b border-border/40">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Page Title (SEO)</span>
                        {titlesMatch ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="size-3" /> Match
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="size-3" /> Title Modified
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 text-xs">
                        <div>
                            <span className="text-[11px] text-muted-foreground uppercase font-medium">Old Title</span>
                            <p className="font-mono bg-muted/50 p-2.5 rounded-lg border border-border/40 mt-1 truncate">{oldTitle || "(Empty)"}</p>
                        </div>
                        <div>
                            <span className="text-[11px] text-muted-foreground uppercase font-medium">New Title</span>
                            <p className="font-mono bg-muted/50 p-2.5 rounded-lg border border-border/40 mt-1 truncate">{newTitle || "(Empty)"}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Content Diff Viewer */}
            <Card className="border-border/60 bg-card shadow-lg shadow-black/5">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                    <div>
                        <CardTitle className="text-base font-semibold">Content Comparison</CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Matches words only: capital letters, punctuation and spacing are ignored.{" "}
                            <span className="inline-block rounded bg-blue-500/15 px-1 font-mono text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300">h2</span>{" "}
                            badges show the heading tag of each line.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border/60">
                            <Button variant={viewMode === "unified" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("unified")} className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer">
                                <AlignLeft className="size-3.5" /> Unified
                            </Button>
                            <Button variant={viewMode === "split" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("split")} className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer">
                                <Columns className="size-3.5" /> Side-by-Side
                            </Button>
                        </div>
                        <Button variant={onlyChanges ? "default" : "outline"} size="sm" onClick={() => setOnlyChanges((v) => !v)} className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer">
                            <Filter className="size-3" /> Only changes
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleCopy} className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer">
                            {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                            {copied ? "Copied" : "Copy changes"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    {viewMode === "split" && (
                        <div className="mb-2 hidden grid-cols-2 gap-x-4 lg:grid">
                            <span className="flex items-center gap-1.5 px-3 text-xs font-bold uppercase text-muted-foreground">
                                <span className="size-2 rounded-full bg-rose-500" /> Baseline:
                                <span className="max-w-60 truncate font-normal normal-case">{oldUrl}</span>
                            </span>
                            <span className="flex items-center gap-1.5 px-3 text-xs font-bold uppercase text-muted-foreground">
                                <span className="size-2 rounded-full bg-emerald-500" /> Target:
                                <span className="max-w-60 truncate font-normal normal-case">{newUrl}</span>
                            </span>
                        </div>
                    )}

                    <div className="max-h-[75vh] overflow-y-auto rounded-xl border border-border/50 bg-muted/20 py-1">
                        {visibleRows.length === 0 ? (
                            <p className="p-6 text-center text-sm text-muted-foreground">
                                No content differences. Both pages have the same words and headings.
                            </p>
                        ) : (
                            visibleRows.map((row, i) =>
                                viewMode === "unified" ? <UnifiedRow key={i} row={row} /> : <SplitRow key={i} row={row} />
                            )
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DiffResult;