import { useEffect, useRef, useState } from "react";

/**
 * Renders a number and flashes emerald/crimson behind it whenever the value
 * ticks up or down, giving the tape a live "price ticker" feel.
 */
export function LiveNumber({
  value,
  format,
  className = "",
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const prev = useRef(value);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (value === prev.current) return;
    const dir = value > prev.current ? "up" : "down";
    prev.current = value;
    setFlash(dir);
    setKey((k) => k + 1);
    const t = setTimeout(() => setFlash(null), 800);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <span
      key={key}
      className={`inline-block rounded-md px-1.5 -mx-1.5 tabular-nums ${
        flash === "up" ? "animate-flash-up" : flash === "down" ? "animate-flash-down" : ""
      } ${className}`}
    >
      {format(value)}
    </span>
  );
}

/** Emerald green for gains, crimson red for drops. */
export const tickColor = (up: boolean) => (up ? "#10b981" : "#EF4444");
export const tickTint = (up: boolean) => (up ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)");
