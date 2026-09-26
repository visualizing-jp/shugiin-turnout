/**
 * 総務省の Excel・PDF を「ラベル + 数値の並び」の行として読む。
 */

import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as XLSX from "xlsx";
import * as cptable from "xlsx/dist/cpexcel.full.mjs";
import { clean, count, isCount } from "./cells.ts";

XLSX.set_fs(fs);
XLSX.set_cptable(cptable);

export interface Line {
  /** 数値より左の文字をつなげたもの（空白なし）。 */
  label: string;
  nums: number[];
}

/**
 * 先頭のシートだけを読む。2枚目のシートは「うち在外」（在外選挙人の内数）で、先頭のシートの数に含まれている。
 */
export function readExcelLines(path: string): Line[] {
  const wb = XLSX.readFile(path);
  const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]!]!, { header: 1, raw: true, defval: "" });
  return rows.map((row) => ({
    label: row.filter((c) => !isCount(c)).map(clean).join(""),
    nums: row.filter(isCount).map(count),
  }));
}

/** pdftotext（poppler）の -layout で、ページを \f で区切ったテキスト。 */
export function pdfText(path: string): string {
  return execFileSync("pdftotext", ["-layout", path, "-"], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
}

/** PDF の表の行。数値は桁区切りつきの整数だけを拾う。空欄のない表にだけ使う。 */
export function readPdfLines(path: string): Line[] {
  return pdfText(path)
    .split("\n")
    .map((line) => {
      const s = line.normalize("NFKC");
      const first = s.search(/\d/);
      if (first < 0) return { label: clean(s), nums: [] };
      const nums = s.slice(first).trim().split(/\s+/);
      return { label: clean(s.slice(0, first)), nums: nums.every(isCount) ? nums.map(count) : [] };
    });
}
