/**
 * 結果調のセルの読み方。Excel と PDF で共通。
 */

/** 全角英数を半角に寄せ、空白を落とす。 */
export function clean(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, "");
}

/** 人数のセルか。 */
export function isCount(value: unknown): boolean {
  if (typeof value === "number") return Number.isInteger(value) && value >= 0;
  return /^\d[\d,]*$/.test(clean(value));
}

/** 人数。 */
export function count(value: unknown): number {
  const v = typeof value === "number" ? value : Number(clean(value).replace(/,/g, ""));
  if (!Number.isInteger(v) || v < 0) throw new Error(`人数として読めない: ${String(value)}`);
  return v;
}
