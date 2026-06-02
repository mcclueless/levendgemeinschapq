"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

/**
 * Lightweight consent store (accessibility-compliance spec). Persists the
 * visitor's choice and gates non-essential third-party embeds/cookies until
 * consent is given. The visible EU cookie banner (Group 10) sets these values;
 * components like the Google Map read them via `useConsent`.
 */
export type ConsentCategory = "embeds" | "analytics";

export interface ConsentState {
  /** Non-essential third-party embeds (e.g. Google Maps). */
  embeds: boolean;
  /** Analytics / measurement. */
  analytics: boolean;
  /** Whether the visitor has made an explicit choice yet. */
  decided: boolean;
}

const DEFAULT: ConsentState = { embeds: false, analytics: false, decided: false };
const STORAGE_KEY = "lg-consent";

interface ConsentContextValue extends ConsentState {
  setConsent: (categories: Partial<Omit<ConsentState, "decided">>) => void;
  acceptAll: () => void;
  rejectAll: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConsentState>(DEFAULT);

  // Hydrate from storage on mount (essential-only until then).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...DEFAULT, ...JSON.parse(raw), decided: true });
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: ConsentState) => {
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const setConsent: ConsentContextValue["setConsent"] = useCallback(
    (categories) => persist({ ...state, ...categories, decided: true }),
    [persist, state],
  );

  const acceptAll = useCallback(
    () => persist({ embeds: true, analytics: true, decided: true }),
    [persist],
  );
  const rejectAll = useCallback(
    () => persist({ embeds: false, analytics: false, decided: true }),
    [persist],
  );

  return (
    <ConsentContext.Provider
      value={{ ...state, setConsent, acceptAll, rejectAll }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within a ConsentProvider");
  return ctx;
}
