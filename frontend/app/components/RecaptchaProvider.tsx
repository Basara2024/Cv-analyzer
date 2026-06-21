"use client";

import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { RECAPTCHA_SITE_KEY } from "@/lib/recaptcha";

export function RecaptchaProvider({ children }: { children: React.ReactNode }) {
  if (!RECAPTCHA_SITE_KEY) {
    if (process.env.NODE_ENV === "development") {
      console.warn("NEXT_PUBLIC_RECAPTCHA_SITE_KEY no configurada — registro sin reCAPTCHA en el cliente.");
    }
    return <>{children}</>;
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={RECAPTCHA_SITE_KEY}
      scriptProps={{ async: true, defer: true, appendTo: "head" }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}
