"use client";

import React, { useState } from "react";
import InputCard from "./InputCard";
import DiffResult, { DiffData } from "./DiffResult";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const ComparePage = () => {
    const [resultData, setResultData] = useState<DiffData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleCompare = async (oldUrl: string, newUrl: string) => {
        setIsLoading(true);
        try {
            const res = await api.post("/compare", { oldUrl, newUrl });
            if (res.data?.success) {
                setResultData(res.data.data);
                toast.success("Content comparison completed successfully!");
            }
        } catch {
            // Handled automatically by axios interceptor
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-3.5">
            <header className="space-y-0.5">
                <div className="flex items-center gap-2">
                    <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                        URL Content Comparison
                    </h1>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                        <Sparkles className="size-3" />
                        Visual Diff
                    </span>
                </div>
                <p className="text-xs text-muted-foreground">
                    Detect additions, removals, and SEO metadata changes between any two web pages.
                </p>
            </header>

            <InputCard onCompare={handleCompare} isLoading={isLoading} />
            <DiffResult data={resultData} />
        </div>
    );
};

export default ComparePage;