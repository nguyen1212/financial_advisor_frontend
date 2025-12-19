import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "News Website",
  description: "A simple news listing website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
