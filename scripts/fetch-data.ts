/**
 * 目録（src/lib/data/elections.ts）の表と資料を総務省から data/raw/ に落とす。
 * 既にあるファイルは取り直さない。
 *
 *   npm run fetch
 */

import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { AGE_SOURCE, ELECTIONS, HISTORY_SOURCE, type Source, type TableId } from "../src/lib/data/elections.ts";

const RAW_DIR = resolve(import.meta.dirname, "../data/raw");

export function rawPath(n: number, table: TableId, format: string): string {
  return resolve(RAW_DIR, String(n), `${table}.${format}`);
}

export const HISTORY_PATH = resolve(RAW_DIR, "history.pdf");
export const AGE_PATH = resolve(RAW_DIR, "age.pdf");

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function download(source: Source, path: string, what: string): Promise<void> {
  if (await exists(path)) return;
  const res = await fetch(source.url);
  if (!res.ok) throw new Error(`${what}: ${res.status} ${source.url}`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, Buffer.from(await res.arrayBuffer()));
  console.log(`  ${what}`);
}

async function main(): Promise<void> {
  await download(HISTORY_SOURCE, HISTORY_PATH, "第49回確定結果調");
  await download(AGE_SOURCE, AGE_PATH, "年代別投票率（抽出）の推移");
  for (const e of ELECTIONS) {
    for (const [table, source] of Object.entries(e.tables)) {
      await download(source, rawPath(e.n, table as TableId, source.format), `第${e.n}回 ${table}.${source.format}`);
    }
  }
}

if (import.meta.main) await main();
