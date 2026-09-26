/**
 * data/raw/ の表を読み、正規化 JSON を data/normalized/ に書き出す。PDF には poppler の pdftotext が要る。
 *
 *   npm run normalize
 */

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ELECTIONS, type Election, type TableId } from "../src/lib/data/elections.ts";
import { pdfText, readExcelLines, readPdfLines } from "../src/lib/parse/sources.ts";
import { parseAge, parseHistory, parsePrefTable, percent } from "../src/lib/parse/tables.ts";
import type { Counts, NormalizedElection, PrefTable } from "../src/lib/parse/types.ts";
import { AGE_PATH, HISTORY_PATH, rawPath } from "./fetch-data.ts";

const OUT_DIR = resolve(import.meta.dirname, "../data/normalized");

function table(e: Election, id: TableId): PrefTable {
  const source = e.tables[id]!;
  const path = rawPath(e.n, id, source.format);
  try {
    return parsePrefTable(source.format === "pdf" ? readPdfLines(path) : readExcelLines(path));
  } catch (err) {
    throw new Error(`第${e.n}回 ${id}: ${(err as Error).message}`);
  }
}

const rate = ([em, ef, vm, vf]: Counts) => percent(vm + vf, em + ef).toFixed(2);

async function write(name: string, value: unknown): Promise<void> {
  await writeFile(resolve(OUT_DIR, `${name}.json`), `${JSON.stringify(value, null, 1)}\n`);
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });

  const history = parseHistory(pdfText(HISTORY_PATH));
  await write("history", history);
  const h = history.elections;
  console.log(`  確定結果調  第${h[0]!.n}〜${h.at(-1)!.n}回（比例代表は第${h.find((e) => e.pr !== null)!.n}回から）`);

  const age = parseAge(pdfText(AGE_PATH));
  await write("age", age);
  console.log(`  年代別投票率  第${age.elections[0]}〜${age.elections.at(-1)}回`);

  for (const e of ELECTIONS) {
    if (e.tables.smdPref === undefined) continue;
    const data: NormalizedElection = { n: e.n, smd: table(e, "smdPref"), pr: table(e, "prPref") };
    await write(String(e.n), data);
    console.log(`  第${e.n}回  小選挙区 ${rate(data.smd.national)}%  比例代表 ${rate(data.pr.national)}%`);
  }
}

await main();
