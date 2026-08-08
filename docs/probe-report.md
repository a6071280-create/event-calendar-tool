# 情報源プローブレポート

実行日時: 2026-08-08T23:09:55+09:00 / UA: `saku-event-calendar-collector/1.0 (+https://github.com/a6071280-create/event-calendar-tool)`

DBには書き込まないドライラン。`npm run probe`（GitHub Actions の probe ワークフロー）で再生成される。

| サイト | 有効 | 接続 | robots.txt | 取得 | 取得ブロック数 | イベント件数 | 対象店舗数 | エラー内容 |
|---|---|---|---|---|---|---|---|---|
| maruhan-official-saku | ✅ | 成功 | 許可 | HTTP 200 (40KB) | 102 | 0 | 0 | － |
| dynam-official-nagano-saku | ✅ | 成功 | robots.txt なし (HTTP 404) → 全許可扱い | HTTP 200 (67KB) | 408 | 2 | 1 | － |
| 1geki-shuzai-list | ✅ | 成功 | 許可 | HTTP 200 (18KB) | 54 | 0 | 0 | － |
| slopachi-hall-superarena | － | 成功 | 許可 | HTTP 200 (59KB) | 51 | 0 | 0 | － |

## dynam-official-nagano-saku の抽出サンプル

- 2026-08-05 ダイナム佐久 新台入替 (新台入替)
- 2026-07-24 ダイナム佐久 新台入替 (新台入替)

## 判定の見方

- robots.txt「不許可」または取得「robots.txt により拒否」のサイトは、enabled に関わらず collector が自動的にスキップする。
- 抽出件数が 0 のサイトはページ構造とキーワードの再確認が必要（collector/src/extractCore.ts）。
- 抽出サンプルに誤りが多い場合はそのサイトを enabled:false にして手動運用に切り替える。
