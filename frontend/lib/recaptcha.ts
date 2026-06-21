"use client";

import { useCallback, useEffect, useState } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

export const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
export const RECAPTCHA_ENABLED = Boolean(RECAPTCHA_SITE_KEY);

export function useRecaptchaToken() {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(typeof executeRecaptcha === "function");
  }, [executeRecaptcha]);

  const getToken = useCallback(
    async (action: string) => {
      if (!executeRecaptcha) {
        throw new Error(
          "Verificación anti-bot no disponible. Recarga la página e intenta de nuevo."
        );
      }
      return executeRecaptcha(action);
    },
    [executeRecaptcha]
  );

  return { ready, getToken, enabled: RECAPTCHA_ENABLED };
}
