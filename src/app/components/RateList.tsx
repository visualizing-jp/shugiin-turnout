/**
 * 回・都道府県・年代の一覧。右端は投票率と、0〜100% の棒（どの一覧でも同じ尺度）。
 */

import { useEffect, useRef } from "react";
import { pct } from "../data/format.ts";

export interface RateRow {
  key: string;
  label: string;
  /** null はその行に値がない。 */
  rate: number | null;
  /** 行の右に添える短い文字（順位など）。 */
  aside?: string;
}

export function RateList({
  rows,
  selected,
  onSelect,
  color,
  none,
}: {
  rows: RateRow[];
  /** 空文字は先頭の「すべて」の行。 */
  selected: string;
  onSelect: (key: string) => void;
  /** 棒の色。 */
  color: string;
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
              <Meter rate={none.rate} color={color} dim={false} />
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
                <Meter rate={row.rate} color={color} dim={selected !== "" && !isSelected} />
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

function Meter({ rate, color, dim }: { rate: number | null; color: string; dim: boolean }) {
  return (
    <span className="h-[9px] w-[56px] shrink-0 bg-ink/[0.05]">
      {rate !== null && (
        <span
          className="block h-full origin-left transition-[transform,opacity] duration-200 ease-out"
          style={{ transform: `scaleX(${rate})`, backgroundColor: color, opacity: dim ? 0.4 : 1 }}
        />
      )}
    </span>
  );
}

/** 一覧の見出し。列の位置を RateList の数字に揃える。 */
export function RateListHeader({ label }: { label: string }) {
  return (
    <h2 className="flex items-baseline gap-2 px-2 pb-1 text-[11px] font-semibold tracking-wide text-faint">
      <span className="flex-1">{label}</span>
      <span className="w-[3.6rem] shrink-0 text-right font-normal">投票率</span>
      <span className="w-[56px] shrink-0" />
    </h2>
  );
}
