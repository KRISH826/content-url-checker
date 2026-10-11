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
} from "lucide-react";

export interface DiffPart {
    value: string;
    added?: boolean;
    removed?: boolean;
}

export interface DiffData {
    oldUrl: string;
    newUrl: string;
    oldTitle: string;
    newTitle: string;
    diff: {
        score: number;
        verdict: string;
        isExactMatch: boolean;
        removeWords: number;
        addWords: number;
        parts: DiffPart[];
    };
}

const DiffResult: React.FC<{ data?: DiffData | null }> = ({ data }) => {
    const [viewMode, setViewMode] = useState<"unified" | "split">("unified");
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

    const { oldTitle, newTitle, diff, oldUrl, newUrl } = data;

    const handleCopy = () => {
        navigator.clipboard.writeText(diff.parts.map((p) => p.value).join(""));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const scoreBar = diff.score >= 90 ? "bg-emerald-500" : diff.score >= 60 ? "bg-amber-500" : "bg-rose-500";
    const verdictStyle = diff.score >= 90 ? "bg-emerald-500/10 text-emerald-700" : diff.score >= 60 ? "bg-amber-500/10 text-amber-700" : "bg-rose-500/10 text-rose-700";
    const totalChanged = diff.addWords + diff.removeWords || 1;
    const stats = [
        { label: "Added words", value: `+${diff.addWords.toLocaleString()}`, color: "text-emerald-600", bar: "bg-emerald-500", share: diff.addWords / totalChanged },
        { label: "Removed words", value: `−${diff.removeWords.toLocaleString()}`, color: "text-rose-600", bar: "bg-rose-500", share: diff.removeWords / totalChanged },
    ];

    const renderText = (parts: DiffPart[]) => (
        <div className="text-sm leading-relaxed whitespace-pre-wrap select-text font-sans">
            {parts.map((part, i) => {
                const isHeading = part.value.startsWith("#");
                const cls = part.added
                    ? "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border-b-2 border-emerald-500/40 px-1 py-0.5 rounded-xs font-medium"
                    : part.removed
                    ? "bg-rose-500/15 text-rose-800 dark:text-rose-300 line-through px-1 py-0.5 rounded-xs opacity-80"
                    : isHeading
                    ? "font-bold text-foreground block text-base my-2"
                    : "text-foreground/90";
                return <span key={i} className={cls}>{part.value}</span>;
            })}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Metrics strip */}
            <div className="grid md:grid-cols-3 rounded-xl bg-card ring-1 ring-foreground/10 divide-y md:divide-y-0 md:divide-x divide-border">
                <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Similarity</span>
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
                            <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${s.share * 100}%` }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* SEO Title Card */}
            <Card className="border-border/60 bg-card/90 shadow-xs">
                <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between pb-3 border-b border-border/40">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Page Title (SEO)</span>
                        {oldTitle === newTitle ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="size-3" /> Exact Match
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
                    <CardTitle className="text-base font-semibold">Content Comparison</CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border/60">
                            <Button variant={viewMode === "unified" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("unified")} className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer">
                                <AlignLeft className="size-3.5" /> Unified
                            </Button>
                            <Button variant={viewMode === "split" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("split")} className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer">
                                <Columns className="size-3.5" /> Side-by-Side
                            </Button>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleCopy} className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer">
                            {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                            {copied ? "Copied" : "Copy"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {viewMode === "unified" ? (
                        <div className="p-5 rounded-xl bg-muted/20 border border-border/50">{renderText(diff.parts)}</div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-rose-500" /> Baseline: <span className="truncate max-w-50 font-normal">{oldUrl}</span>
                                </span>
                                <div className="p-5 rounded-xl bg-muted/20 border border-border/50 min-h-75">{renderText(diff.parts.filter((p) => !p.added))}</div>
                            </div>
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-emerald-500" /> Target: <span className="truncate max-w-50 font-normal">{newUrl}</span>
                                </span>
                                <div className="p-5 rounded-xl bg-muted/20 border border-border/50 min-h-75">{renderText(diff.parts.filter((p) => !p.removed))}</div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default DiffResult;