/**
 * 対象とする総選挙の目録。出典の正本は docs/data-sources.md。
 *
 * 全国の投票率は第22回（1946年、男女普通選挙の最初の総選挙）から。
 * 都道府県別の有権者数・投票者数の表が回ごとに電子的に読める形で公開されているのは第44回から。
 */

export type Edition = "確定" | "速報";

/** 各回の結果ページから取る表。都道府県別有権者数、投票者数（小選挙区・比例代表）。 */
export const TABLES = ["smdPref", "prPref"] as const;
export type TableId = (typeof TABLES)[number];

export interface Source {
  url: string;
  format: "xls" | "xlsx" | "pdf";
}

export interface Election {
  n: number;
  date: string;
  edition: Edition;
  page: string | null;
  /** 空なら都道府県別の表はない（全国値だけ）。 */
  tables: Partial<Record<TableId, Source>>;
}

const MAIN = "https://www.soumu.go.jp/main_content/";
const PAGE = (n: number) =>
  `https://www.soumu.go.jp/senkyo/senkyo_s/data/shugiin${n}/index.html`;
const H17 = "https://www.soumu.go.jp/senkyo/senkyo_s/data/shugiin44/pdf/h17sousenkyo_050911_";

/** 第22〜49回の全国の男女別有権者数・投票者数（第49回確定結果調、PDF の24ページ「男女別投票者数投票率」）。 */
export const HISTORY_SOURCE: Source = { url: `${MAIN}000930924.pdf`, format: "pdf" };

/** 年代別投票率（抽出）の推移（第31回以降）。総務省が総選挙のたびに同じ URL で差し替える。 */
export const AGE_SOURCE: Source = { url: `${MAIN}000255967.pdf`, format: "pdf" };
export const AGE_PAGE = "https://www.soumu.go.jp/senkyo/senkyo_s/news/sonota/nendaibetu/index.html";

const x = (id: string): Source => ({ url: `${MAIN}${id}`, format: id.endsWith(".xlsx") ? "xlsx" : "xls" });
const pdf = (id: string): Source => ({ url: `${H17}${id}.pdf`, format: "pdf" });

/** 全国値だけの回（第49回確定結果調の表が正本）。 */
const old = (n: number, date: string): Election => ({ n, date, edition: "確定", page: null, tables: {} });

export const ELECTIONS: Election[] = [
  old(22, "1946-04-10"),
  old(23, "1947-04-25"),
  old(24, "1949-01-23"),
  old(25, "1952-10-01"),
  old(26, "1953-04-19"),
  old(27, "1955-02-27"),
  old(28, "1958-05-22"),
  old(29, "1960-11-20"),
  old(30, "1963-11-21"),
  old(31, "1967-01-29"),
  old(32, "1969-12-27"),
  old(33, "1972-12-10"),
  old(34, "1976-12-05"),
  old(35, "1979-10-07"),
  old(36, "1980-06-22"),
  old(37, "1983-12-18"),
  old(38, "1986-07-06"),
  old(39, "1990-02-18"),
  old(40, "1993-07-18"),
  old(41, "1996-10-20"),
  old(42, "2000-06-25"),
  old(43, "2003-11-09"),
  { n: 44, date: "2005-09-11", edition: "確定", page: PAGE(44), tables: { smdPref: pdf("02_01"), prPref: pdf("02_02") } },
  { n: 45, date: "2009-08-30", edition: "確定", page: PAGE(45), tables: { smdPref: x("000037612.xls"), prPref: x("000037614.xls") } },
  { n: 46, date: "2012-12-16", edition: "確定", page: PAGE(46), tables: { smdPref: x("000194180.xls"), prPref: x("000194182.xls") } },
  { n: 47, date: "2014-12-14", edition: "確定", page: PAGE(47), tables: { smdPref: x("000328940.xls"), prPref: x("000328942.xls") } },
  { n: 48, date: "2017-10-22", edition: "確定", page: PAGE(48), tables: { smdPref: x("000516715.xls"), prPref: x("000516717.xls") } },
  { n: 49, date: "2021-10-31", edition: "確定", page: PAGE(49), tables: { smdPref: x("000776963.xls"), prPref: x("000776965.xls") } },
  { n: 50, date: "2024-10-27", edition: "速報", page: PAGE(50), tables: { smdPref: x("000979118.xls"), prPref: x("000979120.xls") } },
  { n: 51, date: "2026-02-08", edition: "速報", page: PAGE(51), tables: { smdPref: x("001061471.xlsx"), prPref: x("001061473.xlsx") } },
];

/** 小選挙区比例代表並立制の最初の回。これより前は比例代表がない。 */
export const FIRST_PR = 41;

/** 確定結果調（HISTORY_SOURCE）に載っている最後の回。 */
export const LAST_HISTORY = 49;

/** 年代別投票率の年代。10歳代は選挙権年齢が18歳に下がった第48回から。 */
export const AGE_GROUPS = ["10歳代", "20歳代", "30歳代", "40歳代", "50歳代", "60歳代", "70歳代以上"] as const;
