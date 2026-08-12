import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interpretable Credit Risk Lab | Matheus Nascimento",
  description:
    "An interactive end-to-end walkthrough of fuzzy credit-risk classification, Student-t copulas and second-order Monte Carlo simulation.",
  keywords: [
    "credit risk",
    "fuzzy logic",
    "Student-t copula",
    "Monte Carlo",
    "portfolio risk",
    "model validation",
  ],
  authors: [{ name: "Matheus de Azevedo Nascimento" }],
  openGraph: {
    title: "Interpretable Credit Risk Lab",
    description:
      "A transparent, tail-aware credit-risk research prototype — explained end to end.",
    type: "website",
    images: [{ url: "/social-card.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Interpretable Credit Risk Lab",
    description:
      "Fuzzy inference, t-copulas and second-order Monte Carlo — explained end to end.",
    images: ["/social-card.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
