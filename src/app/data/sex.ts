/**
 * 男女計・男・女の読み出しと色。
 */

import type { Counts } from "../../lib/data/cube.ts";
import { CATEGORICAL, toneOf, type Tone } from "../../lib/data/palette.ts";

export type Sex = "all" | "m" | "f";

export const SEXES = [
  { value: "all", label: "男女計" },
  { value: "m", label: "男性" },
  { value: "f", label: "女性" },
] as const;

export const SEX_LABEL: Record<Sex, string> = { all: "男女計", m: "男性", f: "女性" };

export const SEX_TONE: Record<Sex, Tone> = {
  all: toneOf(null),
  m: toneOf(CATEGORICAL.skyBlue),
  f: toneOf(CATEGORICAL.vermilion),
};

export interface Turnout {
  electors: number;
  voters: number;
}

export function pick([em, ef, vm, vf]: Counts, sex: Sex): Turnout {
  if (sex === "m") return { electors: em, voters: vm };
  if (sex === "f") return { electors: ef, voters: vf };
  return { electors: em + ef, voters: vm + vf };
}

export const rateOf = (t: Turnout) => t.voters / t.electors;

export const sumCounts = (rows: Counts[]): Counts =>
  rows.reduce((acc, c) => acc.map((v, i) => v + c[i]!) as Counts, [0, 0, 0, 0]);

export const isSex = (v: string) => SEXES.some((s) => s.value === v);
