import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Sharma Visa & Passport Services | ভিসা ও পাসপোর্ট কনসালটেন্সি",
  description:
    "গ্লোবাল ভিসা প্রসেসিং, ই-পাসপোর্ট আবেদন ও রিনিউয়াল, ওয়ার্ক পারমিট এবং স্টুডেন্ট ভিসা ফাইল ট্র্যাকিং ম্যানেজমেন্ট প্ল্যাটফর্ম।",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <div
            style={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              zIndex: 1,
            }}
          >
            <Navbar />
            <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {children}
            </main>
            <footer
              style={{
                borderTop: "1px solid var(--border-subtle)",
                padding: "24px 24px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                backdropFilter: "blur(10px)",
                background: "var(--bg-surface)",
              }}
            >
              <div
                style={{
                  maxWidth: "1280px",
                  margin: "0 auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  &copy; 2026 <strong>Sharma Visa & Passport Services</strong>. সর্বস্বত্ব সংরক্ষিত।
                </div>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", color: "var(--text-secondary)" }}>
                  <span>ই-পাসপোর্ট সার্ভিস</span>
                  <span>&bull;</span>
                  <span>গ্লোবাল ভিসা প্রসেসিং</span>
                  <span>&bull;</span>
                  <span>কনসালটেন্সি সাপোর্ট</span>
                </div>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </body>
  </html>
);
}
