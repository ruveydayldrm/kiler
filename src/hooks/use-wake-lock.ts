"use client";

import { useEffect, useRef, useState } from "react";

/** Pişirme modunda ekranın kapanmasını engeller (Wake Lock API). Sekme gizlenip geri gelince yeniden alır. */
export function useWakeLock(active: boolean) {
  const lock = useRef<WakeLockSentinel | null>(null);
  const [supported, setSupported] = useState(false);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && "wakeLock" in navigator);
  }, []);

  useEffect(() => {
    if (!active || !supported) return;
    let cancelled = false;
    const request = async () => {
      try {
        const sentinel = await navigator.wakeLock.request("screen");
        if (cancelled) {
          await sentinel.release();
          return;
        }
        lock.current = sentinel;
        setHeld(true);
        sentinel.addEventListener("release", () => setHeld(false));
      } catch {
        setHeld(false);
      }
    };
    const onVisible = () => {
      // Sekme gizlendiğinde tarayıcı kilidi bırakır; geri gelince yeniden iste.
      if (document.visibilityState === "visible" && (!lock.current || lock.current.released)) void request();
    };
    void request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void lock.current?.release().catch(() => {});
      lock.current = null;
      setHeld(false);
    };
  }, [active, supported]);

  return { supported, held };
}
