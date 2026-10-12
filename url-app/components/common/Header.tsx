"use client";

import React from "react";
import Link from "next/link";

interface HeaderProps {
    activeTab?: "content" | "links" | "images";
}

export const Header: React.FC<HeaderProps> = ({ activeTab = "content" }) => {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-6">
                {/* Brand / Logo */}
                <div className="flex items-center gap-6 sm:gap-8">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-foreground font-semibold text-sm tracking-tight hover:opacity-80 transition-opacity"
                    >
                        <div className="size-6 rounded-md bg-foreground text-background flex items-center justify-center font-bold">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="size-3.5"
                            >
                                <path d="m18 16 4-4-4-4" />
                                <path d="m6 8-4 4 4 4" />
                                <path d="m14.5 4-5 16" />
                            </svg>
                        </div>
                        <span className="font-semibold text-sm tracking-tight">Content Auditor</span>
                    </Link>

                    {/* Navigation Menu */}
                    <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm">
                        <Link
                            href="/"
                            className={`relative py-3 transition-colors ${
                                activeTab === "content"
                                    ? "text-foreground font-semibold after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            Content Checker
                        </Link>

                        <button
                            type="button"
                            className={`relative py-3 transition-colors cursor-pointer ${
                                activeTab === "links"
                                    ? "text-foreground font-semibold after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-foreground"
                                    : "text-muted-foreground/80 hover:text-foreground"
                            }`}
                        >
                            Link Checker
                        </button>

                        <button
                            type="button"
                            className={`relative py-3 transition-colors cursor-pointer ${
                                activeTab === "images"
                                    ? "text-foreground font-semibold after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-foreground"
                                    : "text-muted-foreground/80 hover:text-foreground"
                            }`}
                        >
                            Image Extractor
                        </button>
                    </nav>
                </div>

                {/* Right side status / meta */}
                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-muted-foreground/70 hidden sm:inline">
                        v1.0
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Online
                    </span>
                </div>
            </div>
        </header>
    );
};

export default Header;
