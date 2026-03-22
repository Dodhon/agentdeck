"use client";

import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

export function usePersistentState<T>(
  key: string,
  initialValue: T,
): readonly [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      // Ignore storage parsing failures and keep defaults.
    } finally {
      setHydrated(true);
    }
  }, [key]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage write failures and keep in-memory state.
    }
  }, [hydrated, key, value]);

  return [value, setValue] as const;
}
