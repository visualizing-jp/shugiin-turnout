import { ELECTIONS, FIRST_PR, type Election } from "../../lib/data/elections.ts";

const int = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 });
const two = new Intl.NumberFormat("ja-JP", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function num(n: number): string {
  return int.format(n);
}

export function people(n: number): string {
  return `${int.format(n)}人`;
}

/** 万人単位（四捨五入）。 */
export function man(n: number): string {
  return `${int.format(Math.round(n / 1e4))}万人`;
}

/** 投票率。結果調と同じく小数第2位まで（四捨五入）。 */
export function pct(rate: number): string {
  return `${two.format(Math.round(rate * 10000) / 100)}%`;
}

/** ポイント差（符号つき）。 */
export function points(diff: number): string {
  const v = Math.round(diff * 10000) / 100;
  return `${v > 0 ? "+" : v < 0 ? "−" : "±"}${two.format(Math.abs(v))}ポイント`;
}

const BY_N = new Map(ELECTIONS.map((e) => [e.n, e]));

export function election(n: number): Election {
  const e = BY_N.get(n);
  if (e === undefined) throw new Error(`第${n}回は目録にない`);
  return e;
}

export function year(n: number): string {
  return election(n).date.slice(0, 4);
}

export function longDate(n: number): string {
  const [y, m, d] = election(n).date.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}

/** その回の選挙区の制度。第22回は大選挙区制限連記制、第23〜40回は中選挙区制。 */
export function districtLabel(n: number): string {
  return n >= FIRST_PR ? "小選挙区" : n === 22 ? "大選挙区" : "中選挙区";
}
