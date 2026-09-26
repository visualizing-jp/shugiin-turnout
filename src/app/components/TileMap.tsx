/**
 * 都道府県のタイル地図。投票率で塗る。明度は投票率（目盛りは呼び出し側が決める）、色相は男女。
 * 配置は兄弟サイト（election-shugiin-timeseries・candidates）と同じ。
 */

import { rateColor, type Domain } from "../../lib/data/palette.ts";
import { useWidth } from "../hooks/useWidth.ts";

const LAYOUT = [
  "........................01",
  "........................02",
  "......................0503",
  "......................0604",
  "....................1507..",
  "..............171620100908",
  "..............1821..111312",
  "....3231..2625..23221914..",
  "..35343328272924..........",
  "404438373630..............",
  "4143..39..................",
  "424645....................",
  "..........................",
  "47........................",
];

const COLS = 13;
const GAP = 3;
const MAX_WIDTH = 640;

export interface Tile {
  code: string;
  label: string;
  rate: number;
  /** タイルに書く数字。 */
  text: string;
  title: string;
}

function short(label: string): string {
  return label === "北海道" ? label : label.replace(/[都府県]$/, "");
}

/** 文字の墨色。styles.css の --color-ink と同じ。 */
const INK = "#16140f";

/** WCAG 2 の相対輝度。 */
function luminance(hex: string): number {
  const [r, g, b] = (hex.match(/[\da-f]{2}/gi) ?? []).map((h) => {
    const c = parseInt(h, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** 白字と墨字のうち、塗りとのコントラスト比が高いほうを選ぶ。白字なら true。 */
function isDark(hex: string): boolean {
  const bg = luminance(hex);
  return (1 + 0.05) / (bg + 0.05) > (bg + 0.05) / (luminance(INK) + 0.05);
}

export function TileMap({
  tiles,
  hue,
  pinned,
  onPin,
  legend,
  domain,
}: {
  tiles: Tile[];
  /** 男女の色相。男女計は null（無彩色）。 */
  hue: number | null;
  pinned: string | null;
  onPin: (code: string | null) => void;
  legend: { title: string; note: string };
  domain: Domain;
}) {
  const byCode = new Map(tiles.map((t) => [t.code, t]));
  const color = (rate: number) => rateColor(hue, rate, domain);
  const [ref, width] = useWidth<HTMLDivElement>();
  // 地図は画面の幅に合わせて縮める。タイルに「56.26」と県名が入らない幅では、県名を省き投票率を整数で書く。
  const tileSize = (Math.min(width, MAX_WIDTH) - GAP * (COLS - 1)) / COLS;
  const compact = width > 0 && tileSize < 30;

  return (
    <div ref={ref}>
      <div
        className="grid aspect-[13/14] w-full"
        style={{
          maxWidth: MAX_WIDTH,
          gap: GAP,
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${LAYOUT.length}, minmax(0, 1fr))`,
        }}
      >
        {/* 凡例は左上の空き（1〜7列 × 1〜7行）に置く。 */}
        <div className="flex flex-col justify-start pt-1" style={{ gridColumn: "1 / 8", gridRow: "1 / 8" }}>
          <Legend color={color} domain={domain} {...legend} />
        </div>
        {LAYOUT.flatMap((row, r) =>
          Array.from({ length: COLS }, (_, c) => {
            const code = row.slice(c * 2, c * 2 + 2);
            const tile = code === ".." ? undefined : byCode.get(code);
            if (tile === undefined) return null;
            const isPinned = tile.code === pinned;
            const bg = color(tile.rate);
            const dark = isDark(bg);
            return (
              <button
                type="button"
                key={tile.code}
                aria-pressed={isPinned}
                onClick={() => onPin(isPinned ? null : tile.code)}
                title={tile.title}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-[3px] border transition-[box-shadow,transform,background-color] duration-150 ease-out active:scale-[0.97] ${
                  isPinned ? "border-ink shadow-[0_0_0_1.5px_var(--color-ink)]" : "border-rule hover:border-ink"
                }`}
                style={{ gridColumn: c + 1, gridRow: r + 1, backgroundColor: bg }}
              >
                {!compact && (
                  <span className={`text-[9.5px] leading-tight ${dark ? "text-white/80" : "text-ink/70"}`}>{short(tile.label)}</span>
                )}
                <span className={`tnum leading-tight font-medium ${compact ? "text-[10px]" : "text-[11px]"} ${dark ? "text-white" : ""}`}>
                  {compact ? Math.round(tile.rate * 100) : tile.text}
                </span>
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}

function Legend({
  color,
  domain: [lo, hi],
  title,
  note,
}: {
  color: (rate: number) => string;
  domain: Domain;
  title: string;
  note: string;
}) {
  const stops = Array.from({ length: 11 }, (_, i) => `${color(lo + ((hi - lo) * i) / 10)} ${i * 10}%`).join(", ");
  return (
    <div className="max-w-[240px] text-[10.5px] leading-relaxed text-muted">
      <p className="pb-1.5">{title}</p>
      <div className="flex items-center gap-2">
        <span className="tnum">{Math.round(lo * 100)}%</span>
        <span className="h-[7px] flex-1 rounded-full border border-rule" style={{ background: `linear-gradient(to right, ${stops})` }} />
        <span className="tnum">{Math.round(hi * 100)}%</span>
      </div>
      <p className="pt-1 text-faint">{note}</p>
    </div>
  );
}

if (import.meta.env.DEV) {
  const codes = LAYOUT.flatMap((row) => row.match(/../g) ?? []).filter((s) => s !== "..");
  if (new Set(codes).size !== 47) {
    throw new Error(`タイル配置の県が ${new Set(codes).size} 個しかない`);
  }
  if (LAYOUT.some((row) => row.length !== COLS * 2)) {
    throw new Error(`タイル配置の行の長さが ${COLS * 2} 文字でない`);
  }
}
