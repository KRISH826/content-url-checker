"use client";

import React, { useState } from "react";
import InputCard from "./InputCard";
import DiffResult, { DiffData } from "./DiffResult";
import { GitCompare, Sparkles, RefreshCw } from "lucide-react";

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
    <div className="min-h-screen bg-background text-foreground transition-colors selection:bg-primary/10">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none -z-10" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Page Hero Header */}
        <header className="space-y-3 text-center sm:text-left border-b border-border/40 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="size-3.5" />
            Content Auditor & Visual Diff
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                URL Content Comparison
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Detect additions, removals, and SEO metadata changes between any two web pages.
              </p>
            </div>
          </div>
        </header>

        {/* Input Card */}
        <section>
          <InputCard onCompare={handleCompare} isLoading={isLoading} />
        </section>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
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
        <section className="pt-2">
          {/* If API result is available, show it; otherwise show demo view so the UI is immediately visible */}
          <DiffResult data={resultData || undefined} />
        </section>
      </main>
    </div>
  );
};

export default ComparePage;