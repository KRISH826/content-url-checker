import DocComparePage from "@/components/docs/DocComparePage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Doc to URL Checker - Content Auditor",
    description: "Compare drafts in Google Docs, Word (.docx), PDF, or text against published web page URLs.",
};

export default function DocCheckerPage() {
    return <DocComparePage />;
}
