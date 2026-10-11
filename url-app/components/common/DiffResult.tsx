"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2,
    AlertTriangle,
    Columns,
    AlignLeft,
    PlusCircle,
    MinusCircle,
    Copy,
    Check,
    TrendingUp,
    Sparkles,
    GitCompare,
} from "lucide-react";

export interface DiffPart {
    value: string;
    added?: boolean;
    removed?: boolean;
    count?: number;
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

interface DiffResultProps {
    data?: DiffData | null;
}

const DiffResult: React.FC<DiffResultProps> = ({ data }) => {
    const [viewMode, setViewMode] = useState<"unified" | "split">("unified");
    const [copied, setCopied] = useState(false);

    if (!data) {
        return (
            <Card className="border-dashed border-border/80 bg-card/40 py-14 text-center">
                <CardContent className="flex flex-col items-center justify-center space-y-3">
                    <div className="size-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-muted-foreground">
                        <GitCompare className="size-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">No comparison data yet</p>
                        <p className="text-xs text-muted-foreground max-w-sm">
                            Enter the baseline and target URLs above and click &quot;Run Comparison&quot; to review text and SEO differences.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const { oldTitle, newTitle, diff, oldUrl, newUrl } = data;
    const isTitleMatch = oldTitle === newTitle;

    const handleCopy = () => {
        const fullText = diff.parts.map((p) => p.value).join("");
        navigator.clipboard.writeText(fullText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const stats = [
        {
            label: "Similarity Score",
            value: `${diff.score}%`,
            unit: "match",
            badge: diff.verdict || (diff.score === 100 ? "Identical" : diff.score >= 90 ? "Minor Changes" : diff.score >= 60 ? "Moderate Changes" : "Major Changes"),
            badgeStyle: diff.score >= 90
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : diff.score >= 60
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
            barColor: diff.score >= 90 ? "bg-emerald-500" : diff.score >= 60 ? "bg-amber-500" : "bg-rose-500",
            barWidth: `${diff.score}%`,
            icon: Sparkles,
            iconClass: "text-primary",
            iconBg: "bg-primary/10 border-primary/20",
            desc: "Overall content similarity between pages",
        },
        {
            label: "Added Words",
            value: `+${diff.addWords.toLocaleString()}`,
            unit: "words",
            valueClass: "text-emerald-600 dark:text-emerald-400",
            badge: "+ Insertions",
            badgeStyle: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
            barColor: "bg-emerald-500",
            barWidth: "100%",
            icon: PlusCircle,
            iconClass: "text-emerald-600 dark:text-emerald-400",
            iconBg: "bg-emerald-500/10 border-emerald-500/20",
            desc: "New words introduced in target URL",
        },
        {
            label: "Removed Words",
            value: `-${diff.removeWords.toLocaleString()}`,
            unit: "words",
            valueClass: "text-rose-600 dark:text-rose-400",
            badge: "- Deletions",
            badgeStyle: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
            barColor: "bg-rose-500",
            barWidth: "100%",
            icon: MinusCircle,
            iconClass: "text-rose-600 dark:text-rose-400",
            iconBg: "bg-rose-500/10 border-rose-500/20",
            desc: "Original words deleted or replaced",
        },
    ];

    return (
        <div className="space-y-6">
            {/* 1. Summary 3-Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((item, idx) => (
                    <Card
                        key={idx}
                        className="border-border/60 bg-card/90 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                        <CardContent className="p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className={`size-8 rounded-lg border flex items-center justify-center shrink-0 ${item.iconBg}`}>
                                        <item.icon className={`size-4 ${item.iconClass}`} />
                                    </div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        {item.label}
                                    </span>
                                </div>
                                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${item.badgeStyle}`}>
                                    {item.badge}
                                </span>
                            </div>

                            <div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className={`text-3xl font-extrabold tracking-tight ${item.valueClass || "text-foreground"}`}>
                                        {item.value}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-medium">{item.unit}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                            </div>
                        </CardContent>
                        <div className="h-1.5 w-full bg-muted">
                            <div className={`h-full transition-all duration-500 ${item.barColor}`} style={{ width: item.barWidth }} />
                        </div>
                    </Card>
                ))}
            </div>

            {/* 2. SEO Title Comparison Banner */}
            <Card className="border-border/60 bg-card/90 shadow-xs">
                <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/40">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Page Title (SEO Meta)
                        </span>
                        {isTitleMatch ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                                <CheckCircle2 className="size-3" /> Exact Match
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                                <AlertTriangle className="size-3" /> Title Modified
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                        <div className="space-y-1">
                            <span className="text-[11px] font-medium text-muted-foreground uppercase">Old Title</span>
                            <p className="text-xs font-mono bg-muted/50 p-2.5 rounded-lg border border-border/40 text-foreground truncate">
                                {oldTitle || "(Empty or not detected)"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[11px] font-medium text-muted-foreground uppercase">New Title</span>
                            <p className="text-xs font-mono bg-muted/50 p-2.5 rounded-lg border border-border/40 text-foreground truncate">
                                {newTitle || "(Empty or not detected)"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Diff Content Viewer Card */}
            <Card className="border-border/60 bg-card shadow-lg shadow-black/5">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                    <div className="space-y-1">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <TrendingUp className="size-4 text-primary" />
                            Content Comparison Breakdown
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">Review additions, removals, and unchanged copy.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border/60">
                            <Button
                                variant={viewMode === "unified" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("unified")}
                                className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer"
                            >
                                <AlignLeft className="size-3.5" />
                                Unified
                            </Button>
                            <Button
                                variant={viewMode === "split" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("split")}
                                className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer"
                            >
                                <Columns className="size-3.5" />
                                Side-by-Side
                            </Button>
                        </div>

                        <Button variant="outline" size="sm" onClick={handleCopy} className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer">
                            {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                            {copied ? "Copied" : "Copy"}
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-4 text-xs pb-4 mb-6 border-b border-border/40 text-muted-foreground">
                        <span className="font-semibold text-foreground">Legend:</span>
                        <span className="inline-flex items-center gap-1.5">
                            <span className="size-2.5 rounded-xs bg-emerald-500/20 border border-emerald-500/40 inline-block" />
                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Added to Target</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <span className="size-2.5 rounded-xs bg-rose-500/20 border border-rose-500/40 inline-block" />
                            <span className="text-rose-700 dark:text-rose-400 font-medium line-through">Removed from Baseline</span>
                        </span>
                    </div>

                    {/* Unified View */}
                    {viewMode === "unified" ? (
                        <div className="text-sm leading-relaxed p-6 rounded-xl bg-muted/20 border border-border/50 select-text whitespace-pre-wrap">
                            {diff.parts.map((part, index) => {
                                if (part.added) {
                                    return (
                                        <mark
                                            key={index}
                                            className="bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border-b-2 border-emerald-500/40 px-1 py-0.5 rounded-xs font-medium box-decoration-clone"
                                        >
                                            {part.value}
                                        </mark>
                                    );
                                }
                                if (part.removed) {
                                    return (
                                        <del
                                            key={index}
                                            className="bg-rose-500/15 text-rose-800 dark:text-rose-300 line-through decoration-rose-500/60 px-1 py-0.5 rounded-xs font-normal box-decoration-clone opacity-80"
                                        >
                                            {part.value}
                                        </del>
                                    );
                                }
                                return <span key={index} className="text-foreground/90">{part.value}</span>;
                            })}
                        </div>
                    ) : (
                        /* Split View */
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <span className="size-2 rounded-full bg-rose-500" />
                                        Baseline
                                    </span>
                                    <span className="text-[11px] text-muted-foreground truncate max-w-50" title={oldUrl}>{oldUrl}</span>
                                </div>
                                <div className="text-sm leading-relaxed p-5 rounded-xl bg-muted/20 border border-border/50 min-h-75 select-text whitespace-pre-wrap">
                                    {diff.parts.filter((p) => !p.added).map((part, idx) =>
                                        part.removed ? (
                                            <del key={idx} className="bg-rose-500/15 text-rose-800 dark:text-rose-300 line-through px-1 py-0.5 rounded-xs box-decoration-clone opacity-80">
                                                {part.value}
                                            </del>
                                        ) : (
                                            <span key={idx} className="text-foreground/90">{part.value}</span>
                                        )
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <span className="size-2 rounded-full bg-emerald-500" />
                                        Target
                                    </span>
                                    <span className="text-[11px] text-muted-foreground truncate max-w-50" title={newUrl}>{newUrl}</span>
                                </div>
                                <div className="text-sm leading-relaxed p-5 rounded-xl bg-muted/20 border border-border/50 min-h-75 select-text whitespace-pre-wrap">
                                    {diff.parts.filter((p) => !p.removed).map((part, idx) =>
                                        part.added ? (
                                            <mark key={idx} className="bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border-b-2 border-emerald-500/40 px-1 py-0.5 rounded-xs font-medium box-decoration-clone">
                                                {part.value}
                                            </mark>
                                        ) : (
                                            <span key={idx} className="text-foreground/90">{part.value}</span>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default DiffResult;