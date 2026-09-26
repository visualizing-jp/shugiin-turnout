/**
 * 配信データ（public/data/*.json）の型。scripts/build.ts が書き、画面が読む。
 * 回のメタ情報（執行日・版）は elections.ts を正本とし、ここには回番号だけ持つ。
 */

/** [有権者 男, 有権者 女, 投票者 男, 投票者 女]。 */
export type Counts = [number, number, number, number];

/** smd 選挙区（第40回までは中選挙区、第22回は大選挙区）、pr 比例代表。 */
export type System = "smd" | "pr";

/** 全国。pr はその回に比例代表がなければ null。 */
export interface EraJson {
  elections: number[];
  smd: Counts[];
  pr: (Counts | null)[];
}

/** 都道府県。counts[制度][回][県]。 */
export interface PrefJson {
  elections: number[];
  prefs: string[];
  smd: Counts[][];
  pr: Counts[][];
}

/** 年代別投票率（抽出）。rates[年代][回] は百分率、その回に調べていない年代は null。 */
export interface AgeJson {
  elections: number[];
  groups: string[];
  rates: (number | null)[][];
  total: number[];
}
