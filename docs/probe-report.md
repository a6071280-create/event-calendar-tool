# 情報源プローブレポート

実行日時: 2026-08-17T07:15:12+09:00 / UA: `saku-event-calendar-collector/1.0 (+https://github.com/a6071280-create/event-calendar-tool)`

DBには書き込まないドライラン。`npm run probe`（GitHub Actions の probe ワークフロー）で再生成される。

| サイト | 有効 | 接続 | robots.txt | 取得 | 取得ブロック数 | イベント件数 | 対象店舗数 | エラー内容 |
|---|---|---|---|---|---|---|---|---|
| dmm-ptown-amuamu | － | 失敗 | robots.txt なし (HTTP 403) → 全許可扱い | HTTP 403 | 0 | 0 | 0 | HTTPステータス 403 |
| dmm-ptown-maruhan-saku | － | 失敗 | robots.txt なし (HTTP 403) → 全許可扱い | HTTP 403 | 0 | 0 | 0 | HTTPステータス 403 |
| dmm-ptown-super-arena-sakudaira | － | 失敗 | robots.txt なし (HTTP 403) → 全許可扱い | HTTP 403 | 0 | 0 | 0 | HTTPステータス 403 |
| dmm-ptown-dynam-nagano-saku | － | 失敗 | robots.txt なし (HTTP 403) → 全許可扱い | HTTP 403 | 0 | 0 | 0 | HTTPステータス 403 |
| dmm-ptown-yahho-saku | － | 失敗 | robots.txt なし (HTTP 403) → 全許可扱い | HTTP 403 | 0 | 0 | 0 | HTTPステータス 403 |
| dmm-ptown-babide-saku | － | 失敗 | robots.txt なし (HTTP 403) → 全許可扱い | HTTP 403 | 0 | 0 | 0 | HTTPステータス 403 |

## 判定の見方

- robots.txt「不許可」または取得「robots.txt により拒否」のサイトは、enabled に関わらず collector が自動的にスキップする。
- 抽出件数が 0 のサイトはページ構造とキーワードの再確認が必要（collector/src/extractCore.ts）。
- 抽出サンプルに誤りが多い場合はそのサイトを enabled:false にして手動運用に切り替える。
