"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2,
    AlertTriangle,
    FileText,
    Columns,
    AlignLeft,
    ArrowUpRight,
    PlusCircle,
    MinusCircle,
    Copy,
    Check,
    TrendingUp,
    Percent,
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
    data?: DiffData;
}

const mockDefaultData: DiffData = {
    oldUrl: "https://www.figtreecabinets.com",
    newUrl: "https://figtreecabinets.proquantic.work",
    oldTitle: "Kitchen Cabinets Charlotte NC | Custom Cabinetry | Fig Tree Cabinets",
    newTitle: "Kitchen Cabinets Charlotte NC | Custom Cabinetry | Fig Tree Cabinets",
    diff: {
        score: 84,
        verdict: "Minor Changes",
        isExactMatch: false,
        removeWords: 48,
        addWords: 192,
        parts: [
            {
                value: "High-Quality Cabinets Designed for Your Home and Lifestyle. ",
            },
            {
                value: "Serving homeowners across Charlotte and surrounding areas with functional, budget-friendly cabinetry. ",
                removed: true,
            },
            {
                value: "Serving homeowners across Charlotte, NC and surrounding areas with functional, budget-friendly, beautifully crafted cabinetry. ",
                added: true,
            },
            {
                value: "Book a Free Design Consultation or explore our cabinet collections today. ",
            },
            {
                value: "Awarded Charlotte Home Remodeling MVP 2024. ",
                removed: true,
            },
            {
                value: "Lennar Carolinas Quality Control MVP 2025 & Best Kitchen and Bath Display 2026. ",
                added: true,
            },
            {
                value: "Designing your space shouldn't feel complicated. We simplify every step — from concept to installation — so you can move forward with confidence.",
            },
        ],
    },
};

const DiffResult: React.FC<DiffResultProps> = ({ data = mockDefaultData }) => {
    const [viewMode, setViewMode] = useState<"unified" | "split">("unified");
    const [copied, setCopied] = useState(false);

    const { oldTitle, newTitle, diff, oldUrl, newUrl } = data;
    const isTitleMatch = oldTitle === newTitle;

    const handleCopy = () => {
        const fullText = diff.parts.map((p) => p.value).join("");
        navigator.clipboard.writeText(fullText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Verdict color and badge style
    const getVerdictStyle = (score: number) => {
        if (score === 100) {
            return {
                bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                badge: "Identical",
            };
        }
        if (score >= 90) {
            return {
                bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                badge: "Minor Changes",
            };
        }
        if (score >= 60) {
            return {
                bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                badge: "Moderate Changes",
            };
        }
        return {
            bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
            badge: "Major Changes",
        };
    };

    const verdictStyle = getVerdictStyle(diff.score);

    return (
        <div className="space-y-6">
            {/* 1. Summary Cards Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Similarity Score Card */}
                <Card className="border-border/60 bg-card/90 shadow-xs relative overflow-hidden">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Similarity Score
                            </p>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-extrabold tracking-tight">
                                    {diff.score}%
                                </span>
                                <span className="text-xs text-muted-foreground font-medium">match</span>
                            </div>
                        </div>
                        <div className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${verdictStyle.bg}`}>
                            {diff.verdict || verdictStyle.badge}
                        </div>
                    </CardContent>
                    <div className="h-1 w-full bg-muted">
                        <div
                            className={`h-full transition-all duration-500 ${diff.score >= 90
                                ? "bg-emerald-500"
                                : diff.score >= 60
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                                }`}
                            style={{ width: `${diff.score}%` }}
                        />
                    </div>
                </Card>

                {/* Added Words Card */}
                <Card className="border-border/60 bg-card/90 shadow-xs">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <PlusCircle className="size-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Added Words
                            </p>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                +{diff.addWords.toLocaleString()}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Removed Words Card */}
                <Card className="border-border/60 bg-card/90 shadow-xs">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                            <MinusCircle className="size-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Removed Words
                            </p>
                            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                                -{diff.removeWords.toLocaleString()}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Content Status Card */}
                <Card className="border-border/60 bg-card/90 shadow-xs">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="size-5 text-primary" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Net Delta
                            </p>
                            <p className="text-2xl font-bold">
                                {diff.addWords - diff.removeWords >= 0 ? "+" : ""}
                                {(diff.addWords - diff.removeWords).toLocaleString()}
                                <span className="text-xs font-normal text-muted-foreground ml-1">words</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 2. SEO Title Comparison Banner */}
            <Card className="border-border/60 bg-card/90 shadow-xs">
                <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Page Title (SEO Meta)
                            </span>
                            {isTitleMatch ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="size-3" /> Exact Match
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                    <AlertTriangle className="size-3" /> Title Modified
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                        <div className="space-y-1">
                            <span className="text-[11px] font-medium text-muted-foreground uppercase">
                                Old Title
                            </span>
                            <p className="text-xs font-mono bg-muted/50 p-2.5 rounded-lg border border-border/40 text-foreground">
                                {oldTitle || "(Empty or not detected)"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[11px] font-medium text-muted-foreground uppercase">
                                New Title
                            </span>
                            <p className="text-xs font-mono bg-muted/50 p-2.5 rounded-lg border border-border/40 text-foreground">
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
                        <p className="text-xs text-muted-foreground">
                            Review additions, removals, and unchanged body copy.
                        </p>
                    </div>

                    {/* View Mode & Actions Toolbar */}
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

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopy}
                            className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer"
                        >
                            {copied ? (
                                <>
                                    <Check className="size-3 text-emerald-500" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="size-3" />
                                    Copy Text
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    {/* Legend Banner */}
                    <div className="flex flex-wrap items-center gap-4 text-xs pb-4 mb-6 border-b border-border/40 text-muted-foreground">
                        <span className="font-semibold text-foreground">Legend:</span>
                        <span className="inline-flex items-center gap-1.5">
                            <span className="size-2.5 rounded-xs bg-emerald-500/20 border border-emerald-500/40 inline-block" />
                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Added to New URL</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <span className="size-2.5 rounded-xs bg-rose-500/20 border border-rose-500/40 inline-block" />
                            <span className="text-rose-700 dark:text-rose-400 font-medium line-through">Removed from Old URL</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <span className="size-2.5 rounded-xs bg-zinc-400/20 border border-zinc-400/40 inline-block" />
                            <span>Unchanged Copy</span>
                        </span>
                    </div>

                    {/* Unified View */}
                    {viewMode === "unified" && (
                        <div className="prose prose-sm dark:prose-invert max-w-none font-sans text-sm leading-relaxed p-6 rounded-xl bg-muted/20 border border-border/50 select-text whitespace-pre-wrap">
                            {diff.parts.map((part, index) => {
                                if (part.added) {
                                    return (
                                        <mark
                                            key={index}
                                            className="bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border-b-2 border-emerald-500/40 px-1 py-0.5 rounded-xs font-medium decoration-clone"
                                        >
                                            {part.value}
                                        </mark>
                                    );
                                }
                                if (part.removed) {
                                    return (
                                        <del
                                            key={index}
                                            className="bg-rose-500/15 text-rose-800 dark:text-rose-300 line-through decoration-rose-500/60 px-1 py-0.5 rounded-xs font-normal decoration-clone opacity-80"
                                        >
                                            {part.value}
                                        </del>
                                    );
                                }
                                return <span key={index} className="text-foreground/90">{part.value}</span>;
                            })}
                        </div>
                    )}

                    {/* Split (Side-by-Side) View */}
                    {viewMode === "split" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column: Old Version */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <span className="size-2 rounded-full bg-rose-500" />
                                        Old Content
                                    </span>
                                    <span className="text-[11px] text-muted-foreground truncate max-w-50" title={oldUrl}>
                                        {oldUrl}
                                    </span>
                                </div>
                                <div className="text-sm leading-relaxed p-5 rounded-xl bg-muted/20 border border-border/50 min-h-75 select-text whitespace-pre-wrap">
                                    {diff.parts
                                        .filter((part) => !part.added)
                                        .map((part, index) => {
                                            if (part.removed) {
                                                return (
                                                    <del
                                                        key={index}
                                                        className="bg-rose-500/15 text-rose-800 dark:text-rose-300 line-through px-1 py-0.5 rounded-xs box-decoration-clone opacity-80"
                                                    >
                                                        {part.value}
                                                    </del>
                                                );
                                            }
                                            return <span key={index} className="text-foreground/90">{part.value}</span>;
                                        })}
                                </div>
                            </div>

                            {/* Right Column: New Version */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <span className="size-2 rounded-full bg-emerald-500" />
                                        New Content
                                    </span>
                                    <span className="text-[11px] text-muted-foreground truncate max-w-50" title={newUrl}>
                                        {newUrl}
                                    </span>
                                </div>
                                <div className="text-sm leading-relaxed p-5 rounded-xl bg-muted/20 border border-border/50 min-h-[300px] select-text whitespace-pre-wrap">
                                    {diff.parts
                                        .filter((part) => !part.removed)
                                        .map((part, index) => {
                                            if (part.added) {
                                                return (
                                                    <mark
                                                        key={index}
                                                        className="bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border-b-2 border-emerald-500/40 px-1 py-0.5 rounded-xs font-medium decoration-clone"
                                                    >
                                                        {part.value}
                                                    </mark>
                                                );
                                            }
                                            return <span key={index} className="text-foreground/90">{part.value}</span>;
                                        })}
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