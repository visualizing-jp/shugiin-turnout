/** 棒の凡例。投票者（系列の色）と棄権者（淡い墨）。男女を出すときは男女の色を並べる。 */

import { SEX_LABEL, SEX_TONE, type Sex } from "../data/sex.ts";

export function SeriesLegend({ sex }: { sex: Sex }) {
  const keys: Sex[] = sex === "all" ? ["all"] : ["m", "f"];
  return (
    <div className="flex items-center gap-3 text-[11px] text-muted">
      {keys.map((k) => (
        <span key={k} className="flex items-center gap-1">
          <span
            aria-hidden
            className="size-[9px] rounded-[2px]"
            style={{ backgroundColor: sex === "all" || k === sex ? SEX_TONE[k].base : SEX_TONE[k].faded }}
          />
          {sex === "all" ? "投票者" : `投票者（${SEX_LABEL[k]}）`}
        </span>
      ))}
      <span className="flex items-center gap-1">
        <span aria-hidden className="size-[9px] rounded-[2px] bg-ink/[0.075] ring-1 ring-rule ring-inset" />
        棄権者
      </span>
    </div>
  );
}
