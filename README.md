# 衆議院選挙で、どれだけの人が投票したか

総務省の結果調と年代別投票率の資料をもとに、1946年以降の総選挙で有権者のうちどれだけの人が投票したかを、全国・都道府県・年代で探索するダッシュボード。

visualizing.jp スタンドアロン（dataviz.jp サブスクツールではない）。
兄弟サイト: [衆議院選挙で、どの党がどれだけ票を得てきたか](https://election-shugiin-timeseries.visualizing.jp/)（[election-shugiin-timeseries](https://github.com/visualizing-jp/election-shugiin-timeseries)）、[衆議院選挙で、誰が立候補し、誰が当選したか](https://election-shugiin-candidates.visualizing.jp/)（[shugiin-candidates](https://github.com/visualizing-jp/shugiin-candidates)）。

想定URL: https://election-shugiin-turnout.visualizing.jp

## ビュー

| ビュー | 内容 |
| --- | --- |
| 時代 | 全国の投票率（第22〜51回、1946–2026）。選挙区／比例代表、男女計／男性／女性、投票率／人数 |
| 都道府県 | 都道府県別の投票率（第44回以降）の地図と、選んだ県の推移。小選挙区／比例代表、男女計／男性／女性 |
| 年齢 | 年代別投票率（抽出調査、第31回以降）。選んだ回の年代の並びと、年代ごとの推移 |

データ設計の正本は [`docs/data-sources.md`](docs/data-sources.md)。

## 開発

```bash
npm install
npm run fetch && npm run normalize && npm run verify && npm run data
npm run dev
```

| スクリプト | 内容 |
| --- | --- |
| `npm run fetch` | 総務省の Excel / PDF を `data/raw/` に取得 |
| `npm run normalize` | 正規化 JSON を `data/normalized/` に書き出す（PDF には poppler の `pdftotext` が要る） |
| `npm run verify` | 都道府県の和・確定結果調・年代別の「全体」との突合 |
| `npm run data` | 正規化 JSON から配信用 JSON を `public/data/` に書き出す |
| `npm run dev` | Vite 開発サーバ |
| `npm run build` | 本番ビルド |
| `npm run typecheck` | TypeScript 検査 |

配色のルールは `src/lib/data/palette.ts`（男女計は無彩色、男女は兄弟サイトと同じ Okabe–Ito の2色、明度＝投票率）。

`data/normalized/` と `public/data/` は追跡する。

## GitHub Pages / DNS

- `.github/workflows/pages.yml` で Pages にデプロイする。
- カスタムドメイン `election-shugiin-turnout.visualizing.jp` は `public/CNAME` に置いた。Pages 設定と visualizing.jp 側 DNS（既存シリーズと同じ運用）で登録する。
- Google Analytics の測定ID（`src/app/analytics.ts`）はシリーズ共通（表紙 japan-election と同じ）。
