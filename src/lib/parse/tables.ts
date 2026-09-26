/**
 * 表の読み方。表の中の「計」との突き合わせは読むたびに行い、合わなければ止める。
 */

import { PREFECTURES } from "../data/areas.ts";
import { AGE_GROUPS } from "../data/elections.ts";
import type { Line } from "./sources.ts";
import type { Counts, NormalizedAge, NormalizedHistory, PrefTable } from "./types.ts";

/** 百分率を小数第2位で四捨五入する（結果調の投票率の書き方）。 */
export function percent(part: number, whole: number): number {
  return Math.round((part / whole) * 10000) / 100;
}

/**
 * 都道府県別有権者数、投票者数の表。行は 都道府県 + 9つの数
 * （有権者・投票者・棄権者 × 男・女・計）。比例代表の表は都道府県の前にブロック名がつく。
 */
export function parsePrefTable(lines: Line[]): PrefTable {
  const prefs: Record<string, Counts> = {};
  const totals: Record<string, Counts[]> = {};
  for (const { label, nums } of lines) {
    if (nums.length !== 9) continue;
    const [em, ef, et, vm, vf, vt, am, af, at] = nums as [number, number, number, number, number, number, number, number, number];
    const where = label === "" ? "(ラベルなし)" : label;
    if (em + ef !== et || vm + vf !== vt || am + af !== at) throw new Error(`${where}: 男 + 女 ≠ 計`);
    if (em - vm !== am || ef - vf !== af) throw new Error(`${where}: 有権者 − 投票者 ≠ 棄権者`);
    const counts: Counts = [em, ef, vm, vf];
    const pref = PREFECTURES.find((p) => label.endsWith(p));
    if (pref !== undefined) {
      if (pref in prefs) throw new Error(`${pref} が2度ある`);
      prefs[pref] = counts;
    } else if (label === "計" || label === "合計") {
      (totals[label] ??= []).push(counts);
    } else {
      throw new Error(`読めない行: ${where}`);
    }
  }
  const missing = PREFECTURES.filter((p) => !(p in prefs));
  if (missing.length > 0) throw new Error(`都道府県がない: ${missing.join("、")}`);

  // 比例代表の表はブロックごとに「計」、全国に「合計」がある。小選挙区の表は全国の「計」だけ。
  const national = totals["合計"] ?? totals["計"];
  if (national?.length !== 1) throw new Error(`全国の行が1つに決まらない（計 ${totals["計"]?.length ?? 0}・合計 ${totals["合計"]?.length ?? 0}）`);
  return { prefs, national: national[0]! };
}

const HISTORY_ROW =
  /^\s*(?:第(\d+)回|(?:回\s+)?([小比]))\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/;

/**
 * 確定結果調の「男女別投票者数投票率」。第40回までは「第n回」の1行、第41回からは小選挙区（小）と比例代表（比）の2行。
 * 2行の回は回の番号が行をまたいで縦に書かれているので、第40回の次から順に数える。
 */
export function parseHistory(text: string): NormalizedHistory {
  const page = text.split("\f").find((p) => p.includes("男女別投票者数投票率"));
  if (page === undefined) throw new Error("「男女別投票者数投票率」の表がない");

  const elections: NormalizedHistory["elections"] = [];
  let n = 0;
  for (const line of page.split("\n")) {
    const m = HISTORY_ROW.exec(line);
    if (m === null) continue;
    const [em, ef, et, vm, vf, vt] = m.slice(3, 9).map((s) => Number(s.replace(/,/g, ""))) as number[];
    const [rm, rf, rt] = m.slice(9, 12).map(Number) as number[];
    const kind = m[2];
    if (m[1] !== undefined) n = Number(m[1]);
    else if (kind === "小") n = n + 1;
    const where = `第${n}回${kind ?? ""}`;
    if (em! + ef! !== et || vm! + vf! !== vt) throw new Error(`${where}: 男 + 女 ≠ 計`);
    for (const [r, v, e] of [[rm, vm, em], [rf, vf, ef], [rt, vt, et]] as const) {
      if (percent(v!, e!) !== r) throw new Error(`${where}: 投票率 ${r} ≠ ${v} ÷ ${e}`);
    }
    const counts: Counts = [em!, ef!, vm!, vf!];
    if (kind === "比") {
      const e = elections.at(-1);
      if (e?.n !== n || e.pr !== null) throw new Error(`${where}: 小選挙区の行の次にない`);
      e.pr = counts;
    } else {
      if (elections.length > 0 && elections.at(-1)!.n !== n - 1) throw new Error(`${where}: 回が飛んでいる`);
      elections.push({ n, smd: counts, pr: null });
    }
  }
  return { elections };
}

const AGE_ROW = new RegExp(`^\\s*(${[...AGE_GROUPS, "全体"].join("|")})\\s+([\\d.\\s]+)$`);

/**
 * 「衆議院議員総選挙における年代別投票率（抽出）の推移」の下の表。上のグラフにも同じ数字と年代の名前が散らばっているので、
 * 表の見出し（最後の「回」の行）より下だけを読む。値は右詰めで、欠けているのは古い回（10歳代は第48回から）。
 */
export function parseAge(text: string): NormalizedAge {
  const lines = text.split("\n");
  const head = lines.findLastIndex((l) => /^\s*回(\s+\d+)+\s*$/.test(l));
  if (head < 0) throw new Error("表の見出し（回）がない");
  const elections = lines[head]!.trim().split(/\s+/).slice(1).map(Number);

  const rows = new Map<string, number[]>();
  for (const line of lines.slice(head + 1)) {
    const m = AGE_ROW.exec(line);
    if (m === null) continue;
    if (rows.has(m[1]!)) throw new Error(`${m[1]} の行が2つある`);
    rows.set(m[1]!, m[2]!.trim().split(/\s+/).map(Number));
  }
  const pad = (key: string): (number | null)[] => {
    const values = rows.get(key);
    if (values === undefined) throw new Error(`${key} の行がない`);
    if (values.length > elections.length) throw new Error(`${key}: 値が回より多い`);
    return [...Array<null>(elections.length - values.length).fill(null), ...values];
  };
  const total = pad("全体");
  if (total.some((v) => v === null)) throw new Error("全体の行に欠けた回がある");
  return { elections, rates: AGE_GROUPS.map(pad), total: total as number[] };
}
