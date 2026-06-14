"use client";
import { useCallback, useEffect, useRef, useState } from "react";

const SUPABASE_ENABLED = process.env.NEXT_PUBLIC_SUPABASE_ENABLED === "true";

function debounce<T extends unknown[]>(fn: (...args: T) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  const debounced = (...args: T) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  debounced.flush = (...args: T) => {
    clearTimeout(timer);
    fn(...args);
  };
  return debounced;
}

export function useUserData<T>(localKey: string, apiKey: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  const pendingRef = useRef<{ key: string; val: unknown } | null>(null);

  // Load: Supabase first, localStorage fallback
  useEffect(() => {
    async function load() {
      if (SUPABASE_ENABLED) {
        try {
          const res = await fetch(`/api/data?key=${apiKey}`);
          if (res.ok) {
            const json = await res.json();
            if (json.value !== null && json.value !== undefined) {
              setValue(json.value as T);
              setLoaded(true);
              return;
            }
          }
        } catch {
          // fall through to localStorage
        }
      }
      const saved = window.localStorage.getItem(localKey);
      if (saved) {
        try { setValue(JSON.parse(saved) as T); } catch { /* invalid json */ }
      }
      setLoaded(true);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localKey, apiKey]);

  // Debounced Supabase save — 500ms
  const saveToApi = useRef(
    debounce((key: string, val: unknown) => {
      if (!SUPABASE_ENABLED) return;
      pendingRef.current = null;
      fetch(`/api/data?key=${key}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: val }),
      }).catch(() => {/* ignore — localStorage already has the data */});
    }, 500)
  ).current;

  // Flush pending save on page close via sendBeacon (non-blocking, survives unload)
  useEffect(() => {
    function handleUnload() {
      if (!SUPABASE_ENABLED || !pendingRef.current) return;
      const { key, val } = pendingRef.current;
      navigator.sendBeacon(
        `/api/data?key=${key}`,
        new Blob([JSON.stringify({ value: val })], { type: "application/json" })
      );
    }
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        return resolved;
      });
    },
    []
  );

  // On every value change: write localStorage immediately + debounce Supabase
  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(localKey, JSON.stringify(value));
    if (SUPABASE_ENABLED) {
      pendingRef.current = { key: apiKey, val: value };
      saveToApi(apiKey, value);
    }
  }, [localKey, apiKey, value, loaded, saveToApi]);

  return [value, set] as const;
}
