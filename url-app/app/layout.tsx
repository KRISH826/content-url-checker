import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/common/Header";
import { Toaster } from "@/components/ui/sonner";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "URL Content Diff & Auditor",
  description: "Detect content revisions and SEO title shifts between web page versions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} font-sans h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className={`${poppins.className} font-sans min-h-full flex flex-col relative bg-linear-to-tr from-slate-100/90 via-indigo-50/40 to-violet-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-zinc-950 text-foreground transition-colors selection:bg-primary/10`}
        suppressHydrationWarning
      >
        <Header />

        {/* Global Ambient Glow Mesh */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-225 h-125 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.22)_0%,rgba(139,92,246,0.12)_40%,transparent_70%)] blur-2xl" />
          <div className="absolute top-12 -left-20 w-137.5 h-137.5 rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.14)_0%,transparent_70%)] blur-3xl" />
          <div className="absolute top-24 -right-20 w-137.5 h-137.5 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.15)_0%,transparent_70%)] blur-3xl" />
        </div>

        <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-12 flex-1">
          {children}
        </main>

        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
