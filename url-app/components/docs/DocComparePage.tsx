"use client";

import React, { useState } from "react";
import Header from "../common/Header";
import DocInputCard from "./DocInputCard";
import DiffResult, { DiffData } from "../common/DiffResult";
import { FileText } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function DocComparePage() {
    const [resultData, setResultData] = useState<DiffData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleCompare = async ({ docUrl, file, webUrl }: { docUrl?: string; file?: File; webUrl: string }) => {
        setIsLoading(true);
        try {
            let res;
            if (file) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("webUrl", webUrl);
                res = await api.post("/compare-doc", formData);
            } else {
                res = await api.post("/compare-doc", { docUrl, webUrl });
            }

            if (res.data?.success) {
                setResultData(res.data.data);
                toast.success("Document and web page audited successfully!");
            }
        } catch {
            // Handled automatically by axios interceptor in lib/api.ts
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-linear-to-tr from-slate-100/90 via-indigo-50/40 to-violet-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-zinc-950 text-foreground transition-colors selection:bg-primary/10">
            <Header activeTab="docs" />

            {/* Ambient Background Gradient Mesh */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-225 h-125 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.22)_0%,rgba(139,92,246,0.12)_40%,transparent_70%)] blur-2xl" />
                <div className="absolute top-12 -left-20 w-137.5 h-137.5 rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.14)_0%,transparent_70%)] blur-3xl" />
                <div className="absolute top-24 -right-20 w-137.5 h-137.5 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.15)_0%,transparent_70%)] blur-3xl" />
            </div>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-12 space-y-3.5">
                <header className="space-y-0.5">
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                            Document to URL Comparison
                        </h1>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                            <FileText className="size-3" />
                            Doc Auditor
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Audit published web pages against source drafts in Google Docs, Word (.docx), PDF, or Markdown.
                    </p>
                </header>

                <DocInputCard onCompare={handleCompare} isLoading={isLoading} />
                <DiffResult data={resultData} />
            </main>
        </div>
    );
}
