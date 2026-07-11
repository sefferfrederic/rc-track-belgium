import type { Metadata, Viewport } from "next";
import { Rajdhani, Inter, JetBrains_Mono } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import BottomNav from "@/components/layout/BottomNav";
import TopBar from "@/components/layout/TopBar";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-rajdhani",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "RC Tracks Belgium Meeting",
  description: "Qui roule ? Où ? Quand ? Retrouve les pilotes RC de Belgique.",
  manifest: "/manifest.json",
  icons: { icon: "/logo.svg", apple: "/logo.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${rajdhani.variable} ${inter.variable} ${mono.variable}`}>
      <body>
        <AuthProvider>
          <TopBar />
          <main className="mx-auto min-h-[calc(100dvh-64px-72px)] w-full max-w-3xl px-4 pb-8 pt-4 md:px-6">
            {children}
          </main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
