"use client";

import React, { useState } from "react";
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
        <div className="space-y-3.5">
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
        </div>
    );
}
