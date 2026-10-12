"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Globe, Upload, Search, ShieldCheck, X, FileCode } from "lucide-react";
import { toast } from "sonner";

interface DocInputCardProps {
    onCompare: (data: { docUrl?: string; file?: File; webUrl: string }) => void;
    isLoading: boolean;
}

export default function DocInputCard({ onCompare, isLoading }: DocInputCardProps) {
    const [mode, setMode] = useState<"link" | "file">("link");
    const [docUrl, setDocUrl] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [webUrl, setWebUrl] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!webUrl.trim()) return toast.error("Please enter a target web page URL.");
        if (mode === "link" && !docUrl.trim()) return toast.error("Please enter a Google Doc link.");
        if (mode === "file" && !file) return toast.error("Please upload a .docx, .pdf, or .txt file.");
        onCompare({ docUrl: docUrl.trim(), file: file || undefined, webUrl: webUrl.trim() });
    };

    return (
        <Card className="border-border/60 shadow-lg shadow-black/3 backdrop-blur-md bg-card/90 rounded-md">
            <CardContent className="p-5 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Source Document */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between h-8">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-violet-500 inline-block animate-pulse" />
                                    Source Document
                                </label>
                                {/* Active Mode Switcher */}
                                <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/50 text-[11px] h-7">
                                    <button
                                        type="button"
                                        onClick={() => setMode("link")}
                                        className={`px-2.5 h-6 rounded-md transition-all cursor-pointer flex items-center justify-center ${
                                            mode === "link"
                                                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        Google Doc
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMode("file")}
                                        className={`px-2.5 h-6 rounded-md transition-all cursor-pointer flex items-center justify-center ${
                                            mode === "file"
                                                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        Upload File
                                    </button>
                                </div>
                            </div>

                            {mode === "link" ? (
                                <div className="relative">
                                    <FileText className="absolute left-3.5 top-3.5 size-4 text-violet-600 pointer-events-none" />
                                    <Input
                                        type="url"
                                        placeholder="https://docs.google.com/document/d/..."
                                        value={docUrl}
                                        onChange={(e) => setDocUrl(e.target.value)}
                                        className="pl-10 h-11 text-sm bg-background/90 font-mono"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <input ref={fileRef} type="file" accept=".docx,.pdf,.txt,.md" className="hidden" onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) { setFile(f); toast.success(`Selected "${f.name}"`); }
                                    }} />
                                    {file ? (
                                        <div className="h-11 px-3 rounded-lg border border-border/70 bg-background/90 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2 truncate">
                                                <FileCode className="size-4 text-violet-600 shrink-0" />
                                                <span className="font-medium truncate">{file.name}</span>
                                                <span className="text-[10px] font-mono text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
                                            </div>
                                            <button type="button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }} className="size-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer">
                                                <X className="size-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button type="button" onClick={() => fileRef.current?.click()} className="w-full h-11 px-3 rounded-lg border border-dashed border-border/80 hover:border-violet-500/50 bg-background/50 flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer">
                                            <Upload className="size-3.5 text-violet-600" />
                                            <span>Upload <strong>.docx</strong>, <strong>.pdf</strong>, or <strong>.txt</strong></span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Target Web Page */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between h-8">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                                    Published Web Page
                                </label>
                                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 h-6 inline-flex items-center rounded-full border border-emerald-500/20">Target</span>
                            </div>
                            <div className="relative">
                                <Globe className="absolute left-3.5 top-3.5 size-4 text-emerald-600 pointer-events-none" />
                                <Input
                                    type="url"
                                    placeholder="https://example.com/blog/published-post"
                                    value={webUrl}
                                    onChange={(e) => setWebUrl(e.target.value)}
                                    className="pl-10 h-11 text-sm bg-background/90 font-mono"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/40">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ShieldCheck className="size-4 text-emerald-500" />
                            <span>Word-level diff, paragraph matching &amp; heading audit</span>
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto h-10 px-6 gap-2 text-xs font-semibold cursor-pointer">
                            {isLoading ? <span className="size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Search className="size-4" />}
                            {isLoading ? "Auditing Content..." : "Compare Doc to URL"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
