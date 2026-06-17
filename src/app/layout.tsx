import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ClientEffects } from "@/components/effects/client-effects";
import { getSession } from "@/lib/auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { ToastProvider } from "@/hooks/use-toast";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-neural",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AIVerse - AI Agent Marketplace",
    template: "%s | AIVerse",
  },
  description: "Discover, deploy, build, and monetize AI agents",
  keywords: ["AI agents", "marketplace", "AI", "machine learning", "agent store"],
  authors: [{ name: "AIVerse" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "AIVerse",
    title: "AIVerse - AI Agent Marketplace",
    description: "Discover, deploy, build, and monetize AI agents",
  },
  twitter: {
    card: "summary_large_image",
    title: "AIVerse - AI Agent Marketplace",
    description: "Discover, deploy, build, and monetize AI agents",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} min-h-screen bg-theme antialiased`}>
        <ThemeProvider>
          <ToastProvider>
            <ClientEffects>
              <a href="#main-content" className="skip-link">
                Skip to content
              </a>
              <div className="relative z-10">
                <Navbar session={session} />
                <main id="main-content" className="min-h-[calc(100vh-4rem)]">
                  {children}
                </main>
                <Footer />
              </div>
            </ClientEffects>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
