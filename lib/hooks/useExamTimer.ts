"use client";
import * as React from "react";

export function useExamTimer(serverTime?: string, expiresAt?: string, onExpire?: () => void) {
  const [offset, setOffset] = React.useState(0);
  const [remaining, setRemaining] = React.useState(0);
  const expiredRef = React.useRef(false);
  React.useEffect(() => {
    if (serverTime) setOffset(new Date(serverTime).getTime() - Date.now());
  }, [serverTime]);
  React.useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const next = Math.max(0, new Date(expiresAt).getTime() - (Date.now() + offset));
      setRemaining(next);
      if (next === 0 && !expiredRef.current) { expiredRef.current = true; onExpire?.(); }
    };
    tick(); const id = window.setInterval(tick, 1_000); return () => window.clearInterval(id);
  }, [expiresAt, offset, onExpire]);
  return remaining;
}
