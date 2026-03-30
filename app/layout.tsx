import type { Metadata } from "next";

import { Providers } from "@/components/providers";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Prompt Vault",
  description: "A beautiful personal prompt library for storing and reusing your best LLM prompts.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
