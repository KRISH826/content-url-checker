"use client";

import React from "react";
import Link from "next/link";

interface HeaderProps {
    activeTab?: "content" | "docs" | "links" | "images";
}

export const Header: React.FC<HeaderProps> = ({ activeTab = "content" }) => {
    return (
        <header className="sticky border-b border-gray-50 shadow-xs top-0 z-50 w-full bg-background/60 backdrop-blur-md">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-6">
                {/* Brand / Logo */}
                <div className="flex items-center gap-8 lg:gap-10">
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 text-foreground font-semibold text-sm sm:text-base tracking-tight hover:opacity-85 transition-opacity"
                    >
                        <div className="size-7 rounded-lg bg-foreground text-background flex items-center justify-center font-bold shadow-xs">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="size-4"
                            >
                                <path d="m18 16 4-4-4-4" />
                                <path d="m6 8-4 4 4 4" />
                                <path d="m14.5 4-5 16" />
                            </svg>
                        </div>
                        <span className="font-bold tracking-tight">Content Auditor</span>
                    </Link>

                    {/* Navigation Menu (clean, borderless, seamless tabs) */}
                    <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                        <Link
                            href="/"
                            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === "content"
                                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/60 font-medium"
                                }`}
                        >
                            Content Checker
                        </Link>

                        <Link
                            href="/doc-checker"
                            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === "docs"
                                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/60 font-medium"
                                }`}
                        >
                            Doc to URL
                        </Link>

                        <button
                            type="button"
                            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === "links"
                                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/60 font-medium"
                                }`}
                        >
                            Link Checker
                        </button>

                        <Link
                            href="/image-extractor"
                            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === "images"
                                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/60 font-medium"
                                }`}
                        >
                            Image Extractor
                        </Link>
                    </nav>
                </div>

                {/* Right side status */}
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
                        v1.0
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                    </span>
                </div>
            </div>
        </header>
    );
};

export default Header;
