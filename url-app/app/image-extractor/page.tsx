import ImageExtractorPage from "@/components/images/ImageExtractorPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Image Extractor & Auditor - Content Auditor",
    description: "Extract, inspect, and audit all web page images, SVGs, formats, and SEO alt tags.",
};

export default function ImageExtractorRoute() {
    return <ImageExtractorPage />;
}
