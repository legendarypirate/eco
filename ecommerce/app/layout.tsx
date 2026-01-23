// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from './context/AuthContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Нүүр хуудас",
    template: "%s | TSAAS"
  },
  description: "E-commerce app",
  icons: {
    icon: [
      { url: "/logotsas.png", type: "image/png" },
    ],
    shortcut: "/logotsas.png",
    apple: "/logotsas.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}