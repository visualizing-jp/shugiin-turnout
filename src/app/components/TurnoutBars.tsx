/**
 * 回ごとに、有権者を「投票者（濃い）」と「棄権者（淡い）」に分けた棒を並べる。男女を出すときは1回に2本。
 *
 * 選挙は年次の連続系列ではないので、回は等間隔に置き、回と回のあいだを線でつながない（兄弟サイトと同じ）。
 * 投票率では棒の上端が 100% に揃い、濃い部分の高さが投票率になる。人数では棒の高さが有権者数になる。
 */

import { scaleBand, scaleLinear, type ScaleBand } from "d3-scale";
import type { Counts } from "../../lib/data/cube.ts";
import { election, num, pct, year } from "../data/format.ts";
import { SEX_LABEL, SEX_TONE, pick, rateOf, type Sex, type Turnout } from "../data/sex.ts";
import { useWidth } from "../hooks/useWidth.ts";

export type Measure = "rate" | "count";

export interface Bar extends Turnout {
  key: Sex;
  emphasized: boolean;
}

export interface Column {
  n: number;
  /** null はその回に値がない（比例代表のない回など）。 */
  bars: Bar[] | null;
}

/** 男女計は1本、男女を選んだときは男女2本を並べ、選んだほうを濃くする。 */
export function toColumn(n: number, counts: Counts | null, sex: Sex): Column {
  if (counts === null) return { n, bars: null };
  const keys: Sex[] = sex === "all" ? ["all"] : ["m", "f"];
  return { n, bars: keys.map((k) => ({ key: k, ...pick(counts, k), emphasized: sex === "all" || k === sex })) };
}

/** 棒の左に引く区切り（制度の変わり目など）。 */
export interface Mark {
  n: number;
  label: string;
}

/** 注記の段の高さ（px）。 */
const MARK_ROW = 12;

/** 注記の文字幅の見積もり（9.5px の字で、全角は1字 9.5px、半角は 5.5px）。 */
const textWidth = (s: string) => [...s].reduce((w, ch) => w + (ch.charCodeAt(0) < 128 ? 5.5 : 9.5), 0);

/**
 * 区切りの位置と注記の段を決める。注記は線の右に書き、右端からはみ出すなら左に書く。
 * 前の注記と重なるなら1段下げる（狭い画面で「並立制」と「18歳選挙権」がつながって読めないように）。
 */
function placeMarks(marks: Mark[], band: ScaleBand<number>, width: number) {
  const rows: number[] = [];
  return marks.flatMap((m) => {
    const x0 = band(m.n);
    if (x0 === undefined) return [];
    const x = x0 - (band.step() * 0.28) / 2;
    const w = textWidth(m.label) + 4;
    const flip = x + w > width;
    const [left, right] = flip ? [x - w, x] : [x, x + w];
    let row = rows.findIndex((end) => end + 6 <= left);
    if (row < 0) row = rows.length;
    rows[row] = right;
    return [{ ...m, x, flip, row }];
  });
}

/** 棄権者の塗り。墨の薄い層。 */
const ABSTAIN = "rgba(22, 20, 15, 0.075)";

export function TurnoutBars({
  columns,
  measure,
  focused,
  onFocus,
  marks = [],
  height = 300,
  label,
}: {
  columns: Column[];
  measure: Measure;
  focused: number | null;
  onFocus: (n: number) => void;
  marks?: Mark[];
  height?: number;
  label: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  // 左の余白は人数の目盛り（12,000万）に合わせる。投票率と人数を切り替えても棒の位置が動かない。
  const M = { left: 56, right: 6, top: 22, bottom: 44 };
  const right = Math.max(M.left + 1, width - M.right);

  const band = scaleBand<number>()
    .domain(columns.map((c) => c.n))
    .range([M.left, right])
    .paddingInner(0.28)
    .paddingOuter(0.1);

  const placed = placeMarks(marks, band, width);
  const top = M.top + (Math.max(1, ...placed.map((m) => m.row + 1)) - 1) * MARK_ROW;

  const max = Math.max(...columns.flatMap((c) => c.bars?.map((b) => b.electors) ?? []), 1);
  const y = scaleLinear()
    .domain([0, measure === "rate" ? 1 : max])
    .nice(4)
    .range([height - M.bottom, top]);
  const ticks = y.ticks(4);
  const tick = (v: number) => (measure === "rate" ? `${Math.round(v * 100)}%` : v === 0 ? "0" : `${num(v / 1e4)}万`);
  const perColumn = Math.max(1, ...columns.map((c) => c.bars?.length ?? 0));
  const gap = perColumn > 1 ? Math.max(1.5, band.bandwidth() * 0.06) : 0;
  const bw = (band.bandwidth() - gap * (perColumn - 1)) / perColumn;
  // 細い棒では数字が隣と重なる。そのときは焦点の回の、強調している棒だけに書く。
  const allValues = bw >= 26;
  // 年の文字（10.5px で4桁 ≒ 26px）が隣と重ならない間引き。
  const every = Math.max(1, Math.ceil(30 / band.step()));
  const fi = columns.findIndex((c) => c.n === focused);

  const value = (b: Bar) => (measure === "rate" ? pct(rateOf(b)).replace("%", "") : `${num(Math.round(b.voters / 1e4))}万`);

  return (
    <div ref={ref} className="w-full">
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={label} className="block">
          {ticks.map((t) => (
            <g key={t} transform={`translate(0,${y(t)})`}>
              <line x1={M.left} x2={width - M.right} className="stroke-rule" />
              <text x={M.left - 6} dy="0.32em" textAnchor="end" className="tnum fill-faint text-[10px]">
                {tick(t)}
              </text>
            </g>
          ))}

          {placed.map((m) => {
            const ty = M.top - 8 + m.row * MARK_ROW;
            return (
              <g key={m.n} className="pointer-events-none">
                <line x1={m.x} x2={m.x} y1={ty - 6} y2={height - M.bottom} strokeDasharray="2 3" className="stroke-rule-strong" />
                <text x={m.flip ? m.x - 4 : m.x + 4} y={ty} textAnchor={m.flip ? "end" : "start"} className="fill-muted text-[9.5px]">
                  {m.label}
                </text>
              </g>
            );
          })}

          {columns.map((c, i) => {
            const x0 = band(c.n)!;
            const cx = x0 + band.bandwidth() / 2;
            const isFocused = c.n === focused;
            const hit = band.step() * 0.96;
            // 焦点の回の年はいつも書き、その両隣の間引きの年は重なるので書かない。
            const showYear = i === fi || (i % every === 0 && (fi < 0 || Math.abs(i - fi) >= every));
            // 年の文字（約26px）が右端からはみ出すなら右寄せにする。
            const yearEdge = cx + 14 > width;
            const yearX = yearEdge ? width - 1 : cx;
            const yearAnchor = yearEdge ? "end" : "middle";
            return (
              <g
                key={c.n}
                role="button"
                tabIndex={c.bars === null ? -1 : 0}
                aria-pressed={isFocused}
                aria-label={`第${c.n}回（${year(c.n)}年）`}
                onClick={() => c.bars !== null && onFocus(c.n)}
                onKeyDown={(ev) => {
                  if (c.bars !== null && (ev.key === "Enter" || ev.key === " ")) {
                    ev.preventDefault();
                    onFocus(c.n);
                  }
                }}
                className={`group outline-none ${c.bars === null ? "" : "cursor-pointer"}`}
              >
                <rect
                  x={cx - hit / 2}
                  width={hit}
                  y={M.top - 18}
                  height={height - M.top + 18 - 2}
                  rx={4}
                  className={`group-focus-visible:stroke-ink group-focus-visible:stroke-2 ${
                    isFocused ? "fill-ink/[0.045]" : c.bars === null ? "fill-transparent" : "fill-transparent hover:fill-ink/[0.025]"
                  }`}
                />
                {c.bars?.map((b, side) => {
                  const x = x0 + side * (bw + gap);
                  const top = y(measure === "rate" ? 1 : b.electors);
                  const mid = y(measure === "rate" ? rateOf(b) : b.voters);
                  const base = y(0);
                  const tone = SEX_TONE[b.key];
                  const labelled = allValues || (isFocused && b.emphasized);
                  // 数字（最大「12,345万」≒ 40px）が右端からはみ出すなら右寄せにする。
                  const edge = x + bw / 2 + 20 > width;
                  return (
                    <g key={b.key}>
                      <title>{`第${c.n}回 ${SEX_LABEL[b.key]} 投票率 ${pct(rateOf(b))}（投票者 ${num(b.voters)}人 ÷ 有権者 ${num(b.electors)}人）`}</title>
                      <rect x={x} width={bw} y={top} height={Math.max(0, mid - top)} fill={ABSTAIN} />
                      <rect
                        x={x}
                        width={bw}
                        y={mid}
                        height={Math.max(0, base - mid)}
                        fill={b.emphasized ? tone.base : tone.faded}
                        className="transition-[fill] duration-150 ease-out"
                      />
                      {labelled && (
                        // 数字は淡い棄権者の層に重なるので、紙色で縁取ってどこでも読めるようにする。
                        <text
                          x={edge ? x + bw : x + bw / 2}
                          y={mid - 4}
                          textAnchor={edge ? "end" : "middle"}
                          stroke="var(--color-paper)"
                          strokeWidth={3}
                          strokeLinejoin="round"
                          paintOrder="stroke"
                          className={`tnum pointer-events-none text-[9.5px] font-semibold ${b.emphasized ? "fill-ink" : "fill-muted"}`}
                        >
                          {value(b)}
                        </text>
                      )}
                    </g>
                  );
                })}
                {showYear && (
                  <text
                    x={yearX}
                    y={height - M.bottom + 16}
                    textAnchor={yearAnchor}
                    className={`tnum text-[10.5px] ${isFocused ? "fill-ink font-semibold" : c.bars === null ? "fill-faint" : "fill-muted"}`}
                  >
                    {year(c.n)}
                  </text>
                )}
                {election(c.n).edition === "速報" && (every === 1 || isFocused) && (
                  <text x={yearX} y={height - M.bottom + 28} textAnchor={yearAnchor} className="fill-ink text-[9px] font-semibold">
                    速報
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
