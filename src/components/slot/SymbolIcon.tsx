import { Bell, Cherry, Citrus, Gem, Rows3, Star } from "lucide-react";
import type { SymbolId } from "@/lib/slot/engine";

/** Renders the artwork for a reel symbol, tinted by its neon tone. */
export function SymbolIcon({ id, size = 34 }: { id: SymbolId; size?: number }) {
  const common = { size, strokeWidth: 1.8 } as const;
  switch (id) {
    case "cherry":
      return <Cherry {...common} />;
    case "lemon":
      return <Citrus {...common} />;
    case "bell":
      return <Bell {...common} />;
    case "bar":
      return <Rows3 {...common} />;
    case "scatter":
      return <Star {...common} />;
    case "diamond":
      return <Gem {...common} />;
    case "seven":
      return (
        <span className="font-display text-[1.9rem] leading-none font-black tracking-tighter">
          7
        </span>
      );
    case "wild":
      return (
        <span className="font-display text-[1.7rem] leading-none font-black tracking-tighter">
          W
        </span>
      );
  }
}
