import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/context/ToastContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Financial Advisor",
  description: "A simple news listing website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-white">
      <body className="antialiased bg-gray-50 text-gray-900">
        <ToastProvider>
          <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 ml-64 bg-gray-50">
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
