# 情報源プローブレポート

実行日時: 2026-08-08T23:22:31+09:00 / UA: `saku-event-calendar-collector/1.0 (+https://github.com/a6071280-create/event-calendar-tool)`

DBには書き込まないドライラン。`npm run probe`（GitHub Actions の probe ワークフロー）で再生成される。

| サイト | 有効 | 接続 | robots.txt | 取得 | 取得ブロック数 | イベント件数 | 対象店舗数 | エラー内容 |
|---|---|---|---|---|---|---|---|---|
| maruhan-official-saku | ✅ | 成功 | 許可 | HTTP 200 (40KB) | 102 | 0 | 0 | － |
| dynam-official-nagano-saku | ✅ | 成功 | robots.txt なし (HTTP 404) → 全許可扱い | HTTP 200 (67KB) | 408 | 2 | 1 | － |
| maruhan-official-saku-news | ✅ | 成功 | 許可 | HTTP 200 (40KB) | 102 | 0 | 0 | － |
| 1geki-shuzai-list | ✅ | 成功 | 許可 | HTTP 200 (18KB) | 54 | 0 | 0 | － |
| slopachi-hall-superarena | － | 成功 | 許可 | HTTP 200 (59KB) | 51 | 0 | 0 | － |

## maruhan-official-saku の診断

- 日付のみ（キーワードなし）のブロック: 2
- キーワードのみ（日付なし）のブロック: 0
- 抽出に至らなかった例:
  - [キーワードなし] 8月9 日（日 ）
  - [キーワードなし] 本日10時オープン

## dynam-official-nagano-saku の抽出サンプル

- 2026-08-05 ダイナム佐久 新台入替 (新台入替)
- 2026-07-24 ダイナム佐久 新台入替 (新台入替)

## dynam-official-nagano-saku の診断

- 日付のみ（キーワードなし）のブロック: 6
- キーワードのみ（日付なし）のブロック: 3
- 抽出に至らなかった例:
  - [キーワードなし] 2026/08/01
  - [キーワードなし] 8月5日(水)
  - [日付なし] ★新台入替★
  - [キーワードなし] 2026/07/18
  - [キーワードなし] 7月24日(金)

## maruhan-official-saku-news の診断

- 日付のみ（キーワードなし）のブロック: 2
- キーワードのみ（日付なし）のブロック: 0
- 抽出に至らなかった例:
  - [キーワードなし] 8月9 日（日 ）
  - [キーワードなし] 本日10時オープン

## 1geki-shuzai-list の診断

- 日付のみ（キーワードなし）のブロック: 1
- キーワードのみ（日付なし）のブロック: 15
- 登録店舗名に一致したブロック: 0
- 抽出に至らなかった例:
  - [日付なし] ホール取材の一覧
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 【一撃】来店・取材
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 来店取材の一覧
- 取材/来店/スケジュール関連リンク:
  - 【一撃】来店取材スロット・パチンコ → https://shuzai.1geki.jp/
  - 新台 スケジュール → https://1geki.jp/newmachinecalender/
  - HYPER撃アッチ― → https://shuzai.1geki.jp/shuzai/15/
  - MGeki → https://shuzai.1geki.jp/shuzai/21/
  - MiA来店・Youtubeライブ → https://shuzai.1geki.jp/shuzai/mia/
  - Мトリック → https://shuzai.1geki.jp/shuzai/7/
  - シノ来店・Youtubeライブ → https://shuzai.1geki.jp/shuzai/shino/
  - シノ来店実戦 → https://shuzai.1geki.jp/shuzai/19/
  - ジャムの一撃 → https://shuzai.1geki.jp/shuzai/12/
  - ユメパチユメスロ → https://shuzai.1geki.jp/shuzai/10/
  - 一喝 → https://shuzai.1geki.jp/shuzai/18/
  - 一撃スロット調査隊 → https://shuzai.1geki.jp/shuzai/1/
  - 一撃ランキング → https://shuzai.1geki.jp/shuzai/9/
  - 四店傑集 → https://shuzai.1geki.jp/shuzai/11/
  - 姫撃 → https://shuzai.1geki.jp/shuzai/5/

## slopachi-hall-superarena の診断

- 日付のみ（キーワードなし）のブロック: 0
- キーワードのみ（日付なし）のブロック: 14
- 抽出に至らなかった例:
  - [日付なし] いそまる実践来店
  - [日付なし] よしき実践来店
  - [日付なし] じゃんじゃん実践来店
  - [日付なし] れんじろう実践来店
  - [日付なし] じゅりそん実践来店
- 取材/来店/スケジュール関連リンク:
  - スケジュール → https://777.slopachi-station.com/report_schedule/
  - いそまる実践来店 → https://777.slopachi-station.com/isomaru_schedule/
  - よしき実践来店 → https://777.slopachi-station.com/yoshiki_schedule/
  - じゃんじゃん実践来店 → https://777.slopachi-station.com/janjan_schedule/
  - れんじろう実践来店 → https://777.slopachi-station.com/renjiro_schedule/
  - じゅりそん実践来店 → https://777.slopachi-station.com/jyurison_schedule/
  - るいべえ実践来店 → https://777.slopachi-station.com/ruibee_schedule/
  - スロパチステーション来店取材 → https://777.slopachi-station.com/raiten_syuzai001_schedule/
  - スロパチステーション来店取材 → https://777.slopachi-station.com/raiten_syuzai002_schedule/
  - スロパチステーション来店取材 → https://777.slopachi-station.com/raiten_syuzai003_schedule/
  - スロパチステーション来店取材 → https://777.slopachi-station.com/raiten_syuzai004_schedule/
  - スロパチステーション来店取材 → https://777.slopachi-station.com/raiten_syuzai005_schedule/
  - スロパチステーション来店取材 → https://777.slopachi-station.com/raiten_syuzai006_schedule/
  - スロパチステーション来店取材“匠” → https://777.slopachi-station.com/raiten_syuzai_takumi_schedule/
  - スロパチガール → https://777.slopachi-station.com/slopachi_girl_schedule/

## 判定の見方

- robots.txt「不許可」または取得「robots.txt により拒否」のサイトは、enabled に関わらず collector が自動的にスキップする。
- 抽出件数が 0 のサイトはページ構造とキーワードの再確認が必要（collector/src/extractCore.ts）。
- 抽出サンプルに誤りが多い場合はそのサイトを enabled:false にして手動運用に切り替える。
