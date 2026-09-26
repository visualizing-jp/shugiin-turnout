/**
 * ツール全体の配色ルール。色空間は CIE HCL（d3-color の hcl）。兄弟サイトと同じ考え方。
 *
 * - 兄弟サイトでは色相を党に使う。このサイトに党は出ないので、男女計は無彩色（墨）、
 *   男女は兄弟サイトの性別の内訳と同じ Okabe–Ito の2色（男性 空色・女性 朱色）にする。
 * - 明度は量だけを表す。地図の投票率→明度は、全回・全都道府県・男女で共通の関数（rateColor）。
 * - 彩度は sRGB の色域に収めるためだけに下げる。
 */

import { hcl } from "d3-color";

/**
 * Okabe & Ito, Color Universal Design, Fig. 16 "Colorblind barrier-free color pallet"
 * https://jfly.uni-koeln.de/color/#pallet の R,G,B（0–255）。
 */
export const CATEGORICAL = {
  skyBlue: "#56b4e9",
  vermilion: "#d55e00",
} as const;

/** 明度と色相を保ったまま、表示できるまで彩度を下げる。 */
function fit(h: number, c: number, l: number): string {
  let chroma = c;
  while (chroma > 0 && !hcl(h, chroma, l).displayable()) chroma -= 1;
  return hcl(h, Math.max(0, chroma), l).formatHex();
}

/** 系列の色一式。hue が null なら無彩色。 */
export interface Tone {
  /** 投票者の棒。 */
  base: string;
  /** 他の系列を強調しているときの投票者の棒。 */
  faded: string;
  hue: number | null;
}

export function toneOf(hex: string | null): Tone {
  if (hex === null) return { base: fit(0, 0, 34), faded: fit(0, 0, 78), hue: null };
  const { h, c, l } = hcl(hex);
  return { base: hex, faded: fit(h, c * 0.3, l + (94 - l) * 0.7), hue: h };
}

/** 地図の塗りの目盛り。全回の都道府県・男女の投票率（45〜80%）が収まる幅で固定する。 */
export const RATE_DOMAIN = [0.4, 0.8] as const;

/** 目盛りの下端 → 明度 96（紙色に近い）、上端 → 28。 */
const L_LOW = 96;
const L_HIGH = 28;

export function rateColor(hue: number | null, rate: number): string {
  const [lo, hi] = RATE_DOMAIN;
  const v = Math.min(1, Math.max(0, (rate - lo) / (hi - lo)));
  const l = L_LOW + (L_HIGH - L_LOW) * v;
  const c = hue === null ? 0 : 12 + 48 * Math.min(1, v / 0.5);
  return fit(hue ?? 0, c, l);
}
