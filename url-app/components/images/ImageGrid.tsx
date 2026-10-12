"use client";

import React, { useState } from "react";
import { Download, Copy, Check, ExternalLink, CheckCircle2, AlertTriangle } from "lucide-react";

export interface ScannedImg {
    id: string;
    url: string;
    alt: string;
    format: string;
}

interface ImageGridProps {
    images: ScannedImg[];
    onDownload: (url: string, filename: string) => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({ images, onDownload }) => {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (id: string, url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((img) => (
                <div
                    key={img.id}
                    className="group rounded-xl bg-card border border-border/70 hover:border-primary/40 shadow-2xs transition-all overflow-hidden flex flex-col"
                >
                    <div className="relative aspect-video bg-muted/40 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={img.url}
                            alt={img.alt || "Extracted image"}
                            className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 left-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/70 text-white backdrop-blur-xs">
                            {img.format}
                        </span>
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                type="button"
                                onClick={() => onDownload(img.url, `image-${img.id}.${img.format.toLowerCase()}`)}
                                className="size-7 rounded bg-white/90 text-gray-900 hover:bg-white flex items-center justify-center cursor-pointer shadow-xs"
                                title="Download Image"
                            >
                                <Download className="size-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCopy(img.id, img.url)}
                                className="size-7 rounded bg-white/90 text-gray-900 hover:bg-white flex items-center justify-center cursor-pointer shadow-xs"
                                title="Copy URL"
                            >
                                {copiedId === img.id ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                            </button>
                            <a
                                href={img.url}
                                target="_blank"
                                rel="noreferrer"
                                className="size-7 rounded bg-white/90 text-gray-900 hover:bg-white flex items-center justify-center cursor-pointer shadow-xs"
                                title="Open Image"
                            >
                                <ExternalLink className="size-3.5" />
                            </a>
                        </div>
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between gap-1 text-xs">
                        <p className="font-mono text-[10px] text-muted-foreground truncate" title={img.url}>
                            {img.url}
                        </p>
                        <div className="pt-1 border-t border-border/40">
                            {img.alt ? (
                                <div className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                                    <CheckCircle2 className="size-3 shrink-0" />
                                    <span className="truncate italic">&quot;{img.alt}&quot;</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                    <AlertTriangle className="size-3 shrink-0" />
                                    <span>Missing Alt Text</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ImageGrid;
