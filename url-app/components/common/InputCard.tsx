"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Globe,
    ArrowRightLeft,
    Search,
    ShieldCheck,
} from "lucide-react";

interface InputCardProps {
    onCompare?: (oldUrl: string, newUrl: string) => void;
    isLoading?: boolean;
    featureDescription?: string;
    loadingText?: string;
    buttonText?: string;
}

const InputCard: React.FC<InputCardProps> = ({
    onCompare,
    isLoading = false,
    featureDescription = "Full text extraction, Cheerio cleanup & word diff analysis",
    loadingText = "Analyzing Content...",
    buttonText = "Run Comparison",
}) => {
    const [oldUrl, setOldUrl] = useState("");
    const [newUrl, setNewUrl] = useState("");

    const handleSwap = () => {
        const temp = oldUrl;
        setOldUrl(newUrl);
        setNewUrl(temp);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onCompare) {
            onCompare(oldUrl, newUrl);
        }
    };

    return (
        <Card className="border-border/60 shadow-lg shadow-black/3 backdrop-blur-md bg-card/90 rounded-2xl">
            <CardContent className="p-6 sm:p-7">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col lg:flex-row items-center gap-4 sm:gap-6 relative">
                        {/* Old / Production URL */}
                        <div className="w-full flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-rose-500 inline-block animate-pulse" />
                                    Original / Old URL
                                </label>
                                <span className="text-[11px] font-medium text-muted-foreground/80 px-2 py-0.5 rounded-full bg-muted">
                                    Baseline
                                </span>
                            </div>
                            <div className="relative flex items-center">
                                <Globe className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    type="url"
                                    placeholder="https://example.com/original-page"
                                    value={oldUrl}
                                    onChange={(e) => setOldUrl(e.target.value)}
                                    className="pl-10 h-11 text-sm bg-background/90 transition-all font-mono"
                                    required
                                />
                            </div>
                        </div>

                        {/* Swap Button */}
                        <div className="flex items-center justify-center pt-4 lg:pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleSwap}
                                title="Swap URLs"
                                className="size-9 rounded-full border-border/80 hover:bg-muted transition-transform active:scale-95 shadow-xs cursor-pointer"
                            >
                                <ArrowRightLeft className="size-3.5 text-muted-foreground" />
                            </Button>
                        </div>

                        {/* New / Staging URL */}
                        <div className="w-full flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                                    New / Staging URL
                                </label>
                                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    Target
                                </span>
                            </div>
                            <div className="relative flex items-center">
                                <Globe className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    type="url"
                                    placeholder="https://staging.example.com/updated-page"
                                    value={newUrl}
                                    onChange={(e) => setNewUrl(e.target.value)}
                                    className="pl-10 h-11 text-sm bg-background/90 transition-all font-mono"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Row */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/40">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ShieldCheck className="size-4 text-emerald-500" />
                            <span>{featureDescription}</span>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full sm:w-auto h-10 px-6 gap-2 text-xs font-semibold transition-all cursor-pointer"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                        {loadingText}
                                    </>
                                ) : (
                                    <>
                                        <Search className="size-4" />
                                        {buttonText}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default InputCard;