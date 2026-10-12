"use client";

import React, { useState } from "react";
import Header from "./Header";
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
        <div className="relative min-h-screen bg-gradient-to-tr from-slate-100/90 via-indigo-50/40 to-violet-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-zinc-950 text-foreground transition-colors selection:bg-primary/10">
            {/* Top Navigation Header */}
            <Header activeTab="content" />

            {/* Professional Ambient Gradient Mesh (No dots) */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                {/* Top Center Radiant Indigo Flare */}
                <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.22)_0%,rgba(139,92,246,0.12)_40%,transparent_70%)] blur-2xl" />

                {/* Left Violet Ambient Glow */}
                <div className="absolute top-12 -left-20 w-[550px] h-[550px] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.14)_0%,transparent_70%)] blur-3xl" />

                {/* Right Sky/Cyan Ambient Glow */}
                <div className="absolute top-24 -right-20 w-[550px] h-[550px] rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.15)_0%,transparent_70%)] blur-3xl" />

                {/* Bottom Center Soft Glow */}
                <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.1)_0%,transparent_70%)] blur-3xl" />
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