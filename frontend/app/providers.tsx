"use client";
import { SessionProvider } from "next-auth/react";
import { RecaptchaProvider } from "./components/RecaptchaProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <RecaptchaProvider>{children}</RecaptchaProvider>
    </SessionProvider>
  );
}
