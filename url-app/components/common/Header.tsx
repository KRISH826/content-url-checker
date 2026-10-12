"use client";

import React from "react";
import Link from "next/link";
import { FileText, Link2, Image, Layers, Sparkles } from "lucide-react";

interface HeaderProps {
    activeTab?: "content" | "links" | "images";
}

export const Header: React.FC<HeaderProps> = ({ activeTab = "content" }) => {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                {/* Brand / Logo */}
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
                        <div className="size-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-xs">
                            <Layers className="size-4.5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold tracking-tight leading-none text-foreground flex items-center gap-1.5">
                                URL Auditor
                                <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                                    Pro
                                </span>
                            </span>
                            <span className="text-[10px] text-muted-foreground leading-tight mt-0.5 hidden sm:inline">
                                Web Suite
                            </span>
                        </div>
                    </Link>

                    {/* Navigation Menu */}
                    <nav className="hidden md:flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/40">
                        <Link
                            href="/"
                            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                activeTab === "content"
                                    ? "bg-background text-foreground shadow-xs font-semibold"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            }`}
                        >
                            <FileText className="size-3.5 text-indigo-500" />
                            Content Checker
                        </Link>

                        <button
                            type="button"
                            title="Link Checker (Coming soon)"
                            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                                activeTab === "links"
                                    ? "bg-background text-foreground shadow-xs font-semibold"
                                    : "text-muted-foreground/80 hover:text-foreground hover:bg-background/50"
                            }`}
                        >
                            <Link2 className="size-3.5 text-sky-500" />
                            Link Checker
                            <span className="text-[9px] font-normal text-muted-foreground px-1 py-0.2 bg-muted rounded">Soon</span>
                        </button>

                        <button
                            type="button"
                            title="Image Extractor (Coming soon)"
                            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                                activeTab === "images"
                                    ? "bg-background text-foreground shadow-xs font-semibold"
                                    : "text-muted-foreground/80 hover:text-foreground hover:bg-background/50"
                            }`}
                        >
                            <Image className="size-3.5 text-violet-500" />
                            Image Extractor
                            <span className="text-[9px] font-normal text-muted-foreground px-1 py-0.2 bg-muted rounded">Soon</span>
                        </button>
                    </nav>
                </div>

                {/* Right side status / badge */}
                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Engine
                    </div>

                    {/* Mobile Navigation Pills */}
                    <div className="flex md:hidden items-center gap-1">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-background shadow-xs border border-border/40 text-foreground flex items-center gap-1">
                            <FileText className="size-3 text-indigo-500" /> Content
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
