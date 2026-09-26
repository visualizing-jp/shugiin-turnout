/**
 * 回・都道府県・年代の一覧。右端は投票率と棒。棒の尺度（domain）は一覧ごとに決め、見出しに書く。
 */

import { useEffect, useRef } from "react";
import type { Domain } from "../../lib/data/palette.ts";
import { pct } from "../data/format.ts";

export interface RateRow {
  key: string;
  label: string;
  /** null はその行に値がない。 */
  rate: number | null;
  /** 行の右に添える短い文字（順位など）。 */
  aside?: string;
}

/** 棒の長さ（0〜1）。尺度の外は端で止める。 */
const extent = (rate: number, [lo, hi]: Domain) => Math.min(1, Math.max(0, (rate - lo) / (hi - lo)));

export function RateList({
  rows,
  selected,
  onSelect,
  color,
  domain,
  reference,
  none,
}: {
  rows: RateRow[];
  /** 空文字は先頭の「すべて」の行。 */
  selected: string;
  onSelect: (key: string) => void;
  /** 棒の色。 */
  color: string;
  domain: Domain;
  /** 棒に重ねる基準線（全国の投票率など）。 */
  reference?: number;
  /** 先頭に置く「すべて」の行（全国・全体）。選択を解除できるようにする。 */
  none?: { label: string; rate: number };
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // 選んだ行が見えるよう、一覧の枠の中だけをスクロールする。scrollIntoView はページごと動かすので、
  // 一覧が本文の下に回る狭い画面では、開いた途端にページの末尾へ飛んでしまう。
  useEffect(() => {
    const box = boxRef.current;
    const el = selectedRef.current;
    if (box === null || el === null || box.scrollHeight <= box.clientHeight) return;
    const b = box.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (r.top < b.top) box.scrollTop += r.top - b.top;
    else if (r.bottom > b.bottom) box.scrollTop += r.bottom - b.bottom;
  }, [selected]);

  const item = (isSelected: boolean) =>
    `flex w-full cursor-pointer items-center gap-2 rounded px-2 py-[3px] text-left transition-colors duration-150 ${
      isSelected ? "bg-ink/[0.06]" : "hover:bg-ink/[0.03]"
    }`;
  const meter = (rate: number | null, dim: boolean) => (
    <Meter rate={rate} color={color} dim={dim} domain={domain} reference={reference} />
  );

  return (
    <div ref={boxRef} className="min-h-0 flex-1 overflow-y-auto">
      <ul className="flex flex-col">
        {none !== undefined && (
          <li className="mb-1 border-b border-rule pb-1">
            <button
              type="button"
              ref={selected === "" ? selectedRef : null}
              onClick={() => onSelect("")}
              aria-pressed={selected === ""}
              className={item(selected === "")}
            >
              <span className={`flex-1 text-[12px] ${selected === "" ? "font-semibold text-ink" : "text-muted"}`}>{none.label}</span>
              <Value rate={none.rate} strong={selected === ""} />
              {meter(none.rate, false)}
            </button>
          </li>
        )}
        {rows.map((row) => {
          const isSelected = row.key === selected;
          return (
            <li key={row.key}>
              <button
                type="button"
                ref={isSelected ? selectedRef : null}
                onClick={() => onSelect(row.key)}
                aria-pressed={isSelected}
                className={item(isSelected)}
              >
                {row.aside !== undefined && (
                  <span className="tnum w-[1.4rem] shrink-0 text-right text-[10.5px] text-faint">{row.aside}</span>
                )}
                <span className={`min-w-0 flex-1 truncate text-[12px] ${isSelected ? "font-semibold text-ink" : "text-muted"}`}>
                  {row.label}
                </span>
                <Value rate={row.rate} strong={isSelected} />
                {meter(row.rate, selected !== "" && !isSelected)}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Value({ rate, strong }: { rate: number | null; strong: boolean }) {
  return (
    <span className={`tnum w-[3.6rem] shrink-0 text-right text-[11px] ${strong ? "text-ink" : "text-faint"}`}>
      {rate === null ? "—" : pct(rate)}
    </span>
  );
}

function Meter({
  rate,
  color,
  dim,
  domain,
  reference,
}: {
  rate: number | null;
  color: string;
  dim: boolean;
  domain: Domain;
  reference?: number;
}) {
  return (
    <span className="relative h-[9px] w-[64px] shrink-0 bg-ink/[0.05]">
      {rate !== null && (
        <span
          className="block h-full origin-left transition-[transform,opacity] duration-200 ease-out"
          style={{ transform: `scaleX(${extent(rate, domain)})`, backgroundColor: color, opacity: dim ? 0.4 : 1 }}
        />
      )}
      {reference !== undefined && (
        // 棒の上では紙色の切れ目、棒の上下には墨色の目印として見せる。棒と同じ墨色だと棒に埋もれる。
        <span aria-hidden className="absolute -inset-y-[3px] w-px bg-ink" style={{ left: `${extent(reference, domain) * 100}%` }}>
          <span className="absolute inset-x-0 top-[3px] bottom-[3px] bg-paper" />
        </span>
      )}
    </span>
  );
}

/** 一覧の見出し。列の位置を RateList の数字と棒に揃え、棒の尺度を書く。 */
export function RateListHeader({ label, domain }: { label: string; domain: Domain }) {
  const [lo, hi] = domain.map((v) => Math.round(v * 100));
  return (
    <h2 className="flex items-baseline gap-2 px-2 pb-1 text-[11px] font-semibold tracking-wide text-faint">
      <span className="flex-1">{label}</span>
      <span className="w-[3.6rem] shrink-0 text-right font-normal">投票率</span>
      <span className="tnum flex w-[64px] shrink-0 justify-between text-[9.5px] font-normal">
        <span>{lo}</span>
        <span>{hi}%</span>
      </span>
    </h2>
  );
}
