"use client";

import React, { useState } from "react";
import InputCard from "./InputCard";
import DiffResult, { DiffData } from "./DiffResult";
import { Sparkles } from "lucide-react";

const ComparePage = () => {
    const [resultData, setResultData] = useState<DiffData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleCompare = async (oldUrl: string, newUrl: string) => {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            const response = await fetch("/api/compare", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oldUrl, newUrl }),
            });

            const json = await response.json();

            if (!response.ok || !json.success) {
                throw new Error(json.error || "Failed to compare URLs");
            }

            setResultData(json.data);
        } catch (err: unknown) {
            console.error(err);
            setErrorMessage(err instanceof Error ? err.message : "Comparison failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-slate-50/70 dark:bg-background text-foreground transition-colors selection:bg-primary/10">
            {/* Premium Ambient Background Gradients */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                {/* Radiant top glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12),rgba(147,197,253,0.06)_40%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.18),rgba(147,197,253,0.04)_40%,transparent_70%)]" />
                {/* Ambient colorful accents */}
                <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-indigo-400/8 blur-3xl" />
                <div className="absolute top-32 right-1/4 w-[420px] h-[420px] rounded-full bg-sky-400/8 blur-3xl" />
                {/* Subtle bottom fade */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background/90" />
            </div>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-4">
                {/* Compact Page Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border/40">
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                                URL Content Comparison
                            </h1>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                                <Sparkles className="size-3" />
                                Content Auditor
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Detect additions, removals, and SEO metadata changes between any two web pages.
                        </p>
                    </div>
                </header>

                {/* Input Card */}
                <section>
                    <InputCard onCompare={handleCompare} isLoading={isLoading} />
                </section>

                {/* Error Notification */}
                {errorMessage && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm flex items-center justify-between">
                        <span>{errorMessage}</span>
                        <button
                            onClick={() => setErrorMessage(null)}
                            className="text-xs underline font-medium hover:opacity-80 cursor-pointer"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Results Section */}
                <section>
                    <DiffResult data={resultData} />
                </section>
            </main>
        </div>
    );
};

export default ComparePage;