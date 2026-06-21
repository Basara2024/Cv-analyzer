"use client";

import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

export function RecaptchaProvider({ children }: { children: React.ReactNode }) {
  if (!siteKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("NEXT_PUBLIC_RECAPTCHA_SITE_KEY no configurada — registro sin reCAPTCHA en el cliente.");
    }
    return <>{children}</>;
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={siteKey}
      scriptProps={{ async: true, defer: true }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}
