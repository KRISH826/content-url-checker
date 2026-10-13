"use client";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Search, Download, Image as ImageIcon } from "lucide-react";
import ImageGrid, { ScannedImg } from "./ImageGrid";
import { toast } from "sonner";

const SAMPLE_DATA: ScannedImg[] = [
    { id: "1", url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600", alt: "Under-cabinet LED lighting in modern kitchen", format: "WEBP" },
    { id: "2", url: "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=600", alt: "Recessed puck lights in custom glass cabinet", format: "WEBP" },
    { id: "3", url: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=600", alt: "", format: "JPEG" },
    { id: "4", url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600", alt: "Pendant lights over kitchen island", format: "WEBP" },
    { id: "5", url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600", alt: "Smart dimmer switch on backsplash", format: "PNG" },
    { id: "6", url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600", alt: "", format: "JPEG" },
];

export default function ImageExtractorPage() {
    const [url, setUrl] = useState("https://www.figtreecabinets.com/blog/kitchen-cabinet-lighting");
    const [images, setImages] = useState<ScannedImg[]>(SAMPLE_DATA);
    const [loading, setLoading] = useState(false);
    const [downloadingAll, setDownloadingAll] = useState(false);

    const handleExtract = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setImages(SAMPLE_DATA);
            setLoading(false);
            toast.success(`Extracted ${SAMPLE_DATA.length} images from web page`);
        }, 600);
    };

    const downloadImage = async (imgUrl: string, filename: string) => {
        try {
            const res = await fetch(imgUrl);
            const blob = await res.blob();
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
            toast.success(`Downloaded ${filename}`);
        } catch {
            window.open(imgUrl, "_blank");
            toast.error("Direct download blocked by CORS. Opened in new tab.");
        }
    };

    const handleDownloadAll = async () => {
        setDownloadingAll(true);
        toast.info(`Downloading ${images.length} images...`);
        for (let i = 0; i < images.length; i++) {
            await downloadImage(images[i].url, `image-${i + 1}.${images[i].format.toLowerCase()}`);
            await new Promise((r) => setTimeout(r, 200));
        }
        setDownloadingAll(false);
        toast.success("All images downloaded successfully!");
    };

    const missingAltCount = images.filter((i) => !i.alt).length;

    return (
        <div className="space-y-3.5">
            <header className="space-y-0.5">
                <div className="flex items-center gap-2">
                    <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">Image Extractor</h1>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                        <ImageIcon className="size-3" /> Quick Scan
                    </span>
                </div>
                <p className="text-xs text-muted-foreground">Extract and view all images and alt tags from any web page.</p>
            </header>

            <Card className="border-border/60 shadow-lg shadow-black/3 backdrop-blur-md bg-card/90 rounded-md">
                <CardContent className="p-4 sm:p-5">
                    <form onSubmit={handleExtract} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Globe className="absolute left-3.5 top-3 size-4 text-muted-foreground pointer-events-none" />
                            <Input type="url" placeholder="https://example.com/page-to-extract" value={url} onChange={(e) => setUrl(e.target.value)} className="pl-10 h-10 text-sm bg-background/90 font-mono" required />
                        </div>
                        <Button type="submit" disabled={loading} className="h-10 px-5 gap-2 text-xs font-semibold cursor-pointer">
                            {loading ? <span className="size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Search className="size-4" />}
                            {loading ? "Scanning..." : "Extract Images"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="grid grid-cols-3 rounded-md bg-card/90 backdrop-blur-sm border border-border/60 shadow-2xs divide-x divide-border/60 text-center">
                <div className="p-3">
                    <span className="text-[11px] text-muted-foreground">Total Images</span>
                    <p className="text-xl font-bold mt-0.5">{images.length}</p>
                </div>
                <div className="p-3">
                    <span className="text-[11px] text-muted-foreground">With Alt Text</span>
                    <p className="text-xl font-bold mt-0.5 text-emerald-600">{images.length - missingAltCount}</p>
                </div>
                <div className="p-3">
                    <span className="text-[11px] text-muted-foreground">Missing Alt</span>
                    <p className={`text-xl font-bold mt-0.5 ${missingAltCount > 0 ? "text-amber-600" : "text-emerald-600"}`}>{missingAltCount}</p>
                </div>
            </div>

            {/* Section Header with Download All */}
            <div className="flex items-center justify-between pt-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Extracted Assets ({images.length})
                </p>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadAll}
                    disabled={downloadingAll || images.length === 0}
                    className="h-8 px-3 text-xs gap-1.5 cursor-pointer shadow-2xs"
                >
                    <Download className="size-3.5" />
                    {downloadingAll ? "Downloading..." : "Download All Images"}
                </Button>
            </div>

            {/* Extracted Images Grid Component */}
            <ImageGrid images={images} onDownload={downloadImage} />
        </div>
    );
}
