# 情報源プローブレポート

実行日時: 2026-08-08T23:26:02+09:00 / UA: `saku-event-calendar-collector/1.0 (+https://github.com/a6071280-create/event-calendar-tool)`

DBには書き込まないドライラン。`npm run probe`（GitHub Actions の probe ワークフロー）で再生成される。

| サイト | 有効 | 接続 | robots.txt | 取得 | 取得ブロック数 | イベント件数 | 対象店舗数 | エラー内容 |
|---|---|---|---|---|---|---|---|---|
| maruhan-official-saku | ✅ | 成功 | 許可 | HTTP 200 (40KB) | 102 | 0 | 0 | － |
| dynam-official-nagano-saku | ✅ | 成功 | robots.txt なし (HTTP 404) → 全許可扱い | HTTP 200 (67KB) | 408 | 4 | 1 | － |
| maruhan-official-saku-news | ✅ | 成功 | 許可 | HTTP 200 (40KB) | 102 | 0 | 0 | － |
| 1geki-shuzai-list | ✅ | 成功 | 許可 | HTTP 200 (18KB) | 54 | 0 | 0 | － |
| slopachi-hall-superarena | － | 成功 | 許可 | HTTP 200 (59KB) | 51 | 0 | 0 | － |
| 1geki-shuzai-1 | ✅ | 成功 | 許可 | HTTP 200 (183KB) | 515 | 0 | 0 | － |
| 1geki-shuzai-5 | ✅ | 成功 | 許可 | HTTP 200 (49KB) | 146 | 0 | 0 | － |
| 1geki-shuzai-7 | ✅ | 成功 | 許可 | HTTP 200 (42KB) | 127 | 0 | 0 | － |
| 1geki-shuzai-9 | ✅ | 成功 | 許可 | HTTP 200 (34KB) | 112 | 0 | 0 | － |
| 1geki-shuzai-10 | ✅ | 成功 | 許可 | HTTP 200 (16KB) | 55 | 0 | 0 | － |
| 1geki-shuzai-11 | ✅ | 成功 | 許可 | HTTP 200 (27KB) | 88 | 0 | 0 | － |
| 1geki-shuzai-12 | ✅ | 成功 | 許可 | HTTP 200 (20KB) | 75 | 0 | 0 | － |
| 1geki-shuzai-15 | ✅ | 成功 | 許可 | HTTP 200 (35KB) | 116 | 0 | 0 | － |
| 1geki-shuzai-18 | ✅ | 成功 | 許可 | HTTP 200 (22KB) | 72 | 0 | 0 | － |
| 1geki-shuzai-19 | ✅ | 成功 | 許可 | HTTP 200 (15KB) | 52 | 0 | 0 | － |
| 1geki-shuzai-21 | ✅ | 成功 | 許可 | HTTP 200 (19KB) | 65 | 0 | 0 | － |
| 1geki-shuzai-mia | ✅ | 成功 | 許可 | HTTP 200 (50KB) | 143 | 0 | 0 | － |
| 1geki-shuzai-shino | ✅ | 成功 | 許可 | HTTP 200 (39KB) | 111 | 0 | 0 | － |
| slopachi-report-schedule | ✅ | 成功 | 許可 | HTTP 200 (133KB) | 157 | 0 | 0 | － |

## maruhan-official-saku の診断

- 日付のみ（キーワードなし）のブロック: 2
- キーワードのみ（日付なし）のブロック: 0
- 抽出に至らなかった例:
  - [キーワードなし] 8月9 日（日 ）
  - [キーワードなし] 本日10時オープン

## dynam-official-nagano-saku の抽出サンプル

- 2026-08-05 ダイナム佐久 新台入替 (新台入替)
- 2026-07-24 ダイナム佐久 新台入替 (新台入替)
- 2026-08-01 ダイナム佐久 新台入替 (新台入替)
- 2026-07-18 ダイナム佐久 新台入替 (新台入替)

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

## 1geki-shuzai-1 の診断

- 日付のみ（キーワードなし）のブロック: 190
- キーワードのみ（日付なし）のブロック: 12
- 登録店舗名に一致したブロック: 0
- 抽出に至らなかった例:
  - [日付なし] 一撃スロット調査隊のスロット・パチンコ ホール取材情報
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 【一撃】来店・取材
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 来店取材の一覧
- 取材/来店/スケジュール関連リンク:
  - 【一撃】来店取材スロット・パチンコ → https://shuzai.1geki.jp/
  - 新台 スケジュール → https://1geki.jp/newmachinecalender/
  - 来店取材の一覧 → https://shuzai.1geki.jp/shuzai/
  - ジャパンニューアルファ藤沢店 → https://shuzai.1geki.jp/shop/173376/
  - (no text) → https://shuzai.1geki.jp/shuzai/1/
  - アークス本牧（Ｓｕｎｓｕｎアークス） → https://shuzai.1geki.jp/shop/173351/
  - BIG BOSS 1000 → https://shuzai.1geki.jp/shop/171666/
  - ＮＯＡＨ上永谷店 → https://shuzai.1geki.jp/shop/173426/
  - エスパス日拓高田馬場本店 → https://shuzai.1geki.jp/shop/179180/
  - エスパス日拓上野本館 → https://shuzai.1geki.jp/shop/179195/
  - スクランブル田谷店 → https://shuzai.1geki.jp/shop/173365/
  - (no text) → https://shuzai.1geki.jp/shuzai/19/
  - ノアアークス → https://shuzai.1geki.jp/shop/173332/
  - 結果を見る → https://shuzai.1geki.jp/20260801-173332-1/
  - ノア溝口店 → https://shuzai.1geki.jp/shop/173328/

## 1geki-shuzai-5 の診断

- 日付のみ（キーワードなし）のブロック: 44
- キーワードのみ（日付なし）のブロック: 12
- 登録店舗名に一致したブロック: 0
- 抽出に至らなかった例:
  - [日付なし] 姫撃のスロット・パチンコ ホール取材情報
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 【一撃】来店・取材
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 来店取材の一覧
- 取材/来店/スケジュール関連リンク:
  - 【一撃】来店取材スロット・パチンコ → https://shuzai.1geki.jp/
  - 新台 スケジュール → https://1geki.jp/newmachinecalender/
  - 来店取材の一覧 → https://shuzai.1geki.jp/shuzai/
  - SLOT M&amp;M綱島店 → https://shuzai.1geki.jp/shop/173375/
  - (no text) → https://shuzai.1geki.jp/shuzai/5/
  - 結果を見る → https://shuzai.1geki.jp/20260801-173375-5/
  - 結果を見る → https://shuzai.1geki.jp/20260725-173375-5/
  - 結果を見る → https://shuzai.1geki.jp/20260718-173375-5/
  - 結果を見る → https://shuzai.1geki.jp/20260711-173375-5/
  - 結果を見る → https://shuzai.1geki.jp/20260704-173375-5/
  - 結果を見る → https://shuzai.1geki.jp/20260627-173375-5/
  - 結果を見る → https://shuzai.1geki.jp/20260620-173375-5/
  - 結果を見る → https://shuzai.1geki.jp/20260613-173375-5/
  - 結果を見る → https://shuzai.1geki.jp/20260606-173375-5/
  - 結果を見る → https://shuzai.1geki.jp/20260530-173375-5/

## 1geki-shuzai-7 の診断

- 日付のみ（キーワードなし）のブロック: 34
- キーワードのみ（日付なし）のブロック: 12
- 登録店舗名に一致したブロック: 0
- 抽出に至らなかった例:
  - [日付なし] Мトリックのスロット・パチンコ ホール取材情報
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 【一撃】来店・取材
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 来店取材の一覧
- 取材/来店/スケジュール関連リンク:
  - 【一撃】来店取材スロット・パチンコ → https://shuzai.1geki.jp/
  - 新台 スケジュール → https://1geki.jp/newmachinecalender/
  - 来店取材の一覧 → https://shuzai.1geki.jp/shuzai/
  - エムアンドエム溝の口店 → https://shuzai.1geki.jp/shop/173421/
  - (no text) → https://shuzai.1geki.jp/shuzai/7/
  - 結果を見る → https://shuzai.1geki.jp/20260801-173421-7/
  - 結果を見る → https://shuzai.1geki.jp/20260725-173421-7/
  - 結果を見る → https://shuzai.1geki.jp/20260718-173421-7/
  - 結果を見る → https://shuzai.1geki.jp/20260711-173421-7/
  - 結果を見る → https://shuzai.1geki.jp/20260704-173421-7/
  - 結果を見る → https://shuzai.1geki.jp/20260627-173421-7/
  - 結果を見る → https://shuzai.1geki.jp/20260620-173421-7/
  - 結果を見る → https://shuzai.1geki.jp/20260613-173421-7/
  - 結果を見る → https://shuzai.1geki.jp/20260606-173421-7/
  - 結果を見る → https://shuzai.1geki.jp/20260530-173421-7/

## 1geki-shuzai-9 の診断

- 日付のみ（キーワードなし）のブロック: 15
- キーワードのみ（日付なし）のブロック: 12
- 登録店舗名に一致したブロック: 0
- 抽出に至らなかった例:
  - [日付なし] 一撃ランキングのスロット・パチンコ ホール取材情報
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 【一撃】来店・取材
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 来店取材の一覧
- 取材/来店/スケジュール関連リンク:
  - 【一撃】来店取材スロット・パチンコ → https://shuzai.1geki.jp/
  - 新台 スケジュール → https://1geki.jp/newmachinecalender/
  - 来店取材の一覧 → https://shuzai.1geki.jp/shuzai/
  - ザ･ブンカ 合浦店 → https://shuzai.1geki.jp/shop/170501/
  - (no text) → https://shuzai.1geki.jp/shuzai/9/
  - D&#039;STATION仙台東店 → https://shuzai.1geki.jp/shop/170775/
  - パラディソ1000 泉店 → https://shuzai.1geki.jp/shop/170782/
  - パラディソ小鶴新田店 → https://shuzai.1geki.jp/shop/170757/
  - パラディソ沖野店 → https://shuzai.1geki.jp/shop/170743/
  - パラディソ岩切店 → https://shuzai.1geki.jp/shop/170793/
  - パラディソ仙台東インター店 → https://shuzai.1geki.jp/shop/170777/
  - パラディソ古川ドルフィン館 → https://shuzai.1geki.jp/shop/170824/
  - 結果を見る → https://shuzai.1geki.jp/20260721-170501-9/
  - MiA来店・Youtubeライブ → https://shuzai.1geki.jp/shuzai/mia/
  - シノ来店・Youtubeライブ → https://shuzai.1geki.jp/shuzai/shino/

## 1geki-shuzai-10 の診断

- 日付のみ（キーワードなし）のブロック: 4
- キーワードのみ（日付なし）のブロック: 12
- 登録店舗名に一致したブロック: 0
- 抽出に至らなかった例:
  - [日付なし] ユメパチユメスロのスロット・パチンコ ホール取材情報
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 【一撃】来店・取材
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 来店取材の一覧
- 取材/来店/スケジュール関連リンク:
  - 【一撃】来店取材スロット・パチンコ → https://shuzai.1geki.jp/
  - 新台 スケジュール → https://1geki.jp/newmachinecalender/
  - 来店取材の一覧 → https://shuzai.1geki.jp/shuzai/
  - 21SEIKI石巻中里 → https://shuzai.1geki.jp/shop/170795/
  - (no text) → https://shuzai.1geki.jp/shuzai/10/
  - 結果を見る → https://shuzai.1geki.jp/20260725-170795-10/
  - MiA来店・Youtubeライブ → https://shuzai.1geki.jp/shuzai/mia/
  - シノ来店・Youtubeライブ → https://shuzai.1geki.jp/shuzai/shino/
  - HYPER撃アッチ― → https://shuzai.1geki.jp/shuzai/15/
  - MGeki → https://shuzai.1geki.jp/shuzai/21/
  - Мトリック → https://shuzai.1geki.jp/shuzai/7/
  - シノ来店実戦 → https://shuzai.1geki.jp/shuzai/19/
  - ジャムの一撃 → https://shuzai.1geki.jp/shuzai/12/
  - 一喝 → https://shuzai.1geki.jp/shuzai/18/
  - 一撃スロット調査隊 → https://shuzai.1geki.jp/shuzai/1/

## 1geki-shuzai-11 の診断

- 日付のみ（キーワードなし）のブロック: 10
- キーワードのみ（日付なし）のブロック: 12
- 登録店舗名に一致したブロック: 0
- 抽出に至らなかった例:
  - [日付なし] 四店傑集のスロット・パチンコ ホール取材情報
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 【一撃】来店・取材
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 来店取材の一覧
- 取材/来店/スケジュール関連リンク:
  - 【一撃】来店取材スロット・パチンコ → https://shuzai.1geki.jp/
  - 新台 スケジュール → https://1geki.jp/newmachinecalender/
  - 来店取材の一覧 → https://shuzai.1geki.jp/shuzai/
  - スロットキング南浦和 → https://shuzai.1geki.jp/shop/172096/
  - (no text) → https://shuzai.1geki.jp/shuzai/11/
  - SAP草加 → https://shuzai.1geki.jp/shop/172095/
  - SAP蒲生 → https://shuzai.1geki.jp/shop/172094/
  - SAPみずほ台 → https://shuzai.1geki.jp/shop/172052/
  - 結果を見る → https://shuzai.1geki.jp/20260711-172094-11/
  - 結果を見る → https://shuzai.1geki.jp/20260711-172095-11/
  - 結果を見る → https://shuzai.1geki.jp/20260711-172052-11/
  - 結果を見る → https://shuzai.1geki.jp/20260711-172096-11/
  - MiA来店・Youtubeライブ → https://shuzai.1geki.jp/shuzai/mia/
  - シノ来店・Youtubeライブ → https://shuzai.1geki.jp/shuzai/shino/
  - HYPER撃アッチ― → https://shuzai.1geki.jp/shuzai/15/

## 1geki-shuzai-12 の診断

- 日付のみ（キーワードなし）のブロック: 6
- キーワードのみ（日付なし）のブロック: 12
- 登録店舗名に一致したブロック: 0
- 抽出に至らなかった例:
  - [日付なし] ジャムの一撃のスロット・パチンコ ホール取材情報
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 【一撃】来店・取材
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 来店取材の一覧
- 取材/来店/スケジュール関連リンク:
  - 【一撃】来店取材スロット・パチンコ → https://shuzai.1geki.jp/
  - 新台 スケジュール → https://1geki.jp/newmachinecalender/
  - 来店取材の一覧 → https://shuzai.1geki.jp/shuzai/
  - ジャムフレンド上堂 → https://shuzai.1geki.jp/shop/170678/
  - (no text) → https://shuzai.1geki.jp/shuzai/12/
  - ジャムフレンド盛岡 → https://shuzai.1geki.jp/shop/170679/
  - 結果を見る → https://shuzai.1geki.jp/20260711-170679-12/
  - 結果を見る → https://shuzai.1geki.jp/20260711-170678-12/
  - MiA来店・Youtubeライブ → https://shuzai.1geki.jp/shuzai/mia/
  - シノ来店・Youtubeライブ → https://shuzai.1geki.jp/shuzai/shino/
  - HYPER撃アッチ― → https://shuzai.1geki.jp/shuzai/15/
  - MGeki → https://shuzai.1geki.jp/shuzai/21/
  - Мトリック → https://shuzai.1geki.jp/shuzai/7/
  - シノ来店実戦 → https://shuzai.1geki.jp/shuzai/19/
  - ユメパチユメスロ → https://shuzai.1geki.jp/shuzai/10/

## 1geki-shuzai-15 の診断

- 日付のみ（キーワードなし）のブロック: 24
- キーワードのみ（日付なし）のブロック: 12
- 登録店舗名に一致したブロック: 0
- 抽出に至らなかった例:
  - [日付なし] HYPER撃アッチ―のスロット・パチンコ ホール取材情報
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 【一撃】来店・取材
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 来店取材の一覧
- 取材/来店/スケジュール関連リンク:
  - 【一撃】来店取材スロット・パチンコ → https://shuzai.1geki.jp/
  - 新台 スケジュール → https://1geki.jp/newmachinecalender/
  - 来店取材の一覧 → https://shuzai.1geki.jp/shuzai/
  - ハイパージアス立川 → https://shuzai.1geki.jp/shop/173026/
  - (no text) → https://shuzai.1geki.jp/shuzai/15/
  - 結果を見る → https://shuzai.1geki.jp/20260805-173026-15/
  - 結果を見る → https://shuzai.1geki.jp/20260725-173026-15/
  - 結果を見る → https://shuzai.1geki.jp/20260722-173026-15/
  - 結果を見る → https://shuzai.1geki.jp/20260715-173026-15/
  - 結果を見る → https://shuzai.1geki.jp/20260711-173026-15/
  - 結果を見る → https://shuzai.1geki.jp/20260708-173026-15/
  - 結果を見る → https://shuzai.1geki.jp/20260705-173026-15/
  - MiA来店・Youtubeライブ → https://shuzai.1geki.jp/shuzai/mia/
  - シノ来店・Youtubeライブ → https://shuzai.1geki.jp/shuzai/shino/
  - MGeki → https://shuzai.1geki.jp/shuzai/21/

## 1geki-shuzai-18 の診断

- 日付のみ（キーワードなし）のブロック: 10
- キーワードのみ（日付なし）のブロック: 12
- 登録店舗名に一致したブロック: 0
- 抽出に至らなかった例:
  - [日付なし] 一喝のスロット・パチンコ ホール取材情報
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 【一撃】来店・取材
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 来店取材の一覧
- 取材/来店/スケジュール関連リンク:
  - 【一撃】来店取材スロット・パチンコ → https://shuzai.1geki.jp/
  - 新台 スケジュール → https://1geki.jp/newmachinecalender/
  - 来店取材の一覧 → https://shuzai.1geki.jp/shuzai/
  - ハイパージアス立川 → https://shuzai.1geki.jp/shop/173026/
  - (no text) → https://shuzai.1geki.jp/shuzai/18/
  - 結果を見る → https://shuzai.1geki.jp/20260807-173026-18/
  - 結果を見る → https://shuzai.1geki.jp/20260727-173026-18/
  - 結果を見る → https://shuzai.1geki.jp/20260717-173026-18/
  - MiA来店・Youtubeライブ → https://shuzai.1geki.jp/shuzai/mia/
  - シノ来店・Youtubeライブ → https://shuzai.1geki.jp/shuzai/shino/
  - HYPER撃アッチ― → https://shuzai.1geki.jp/shuzai/15/
  - MGeki → https://shuzai.1geki.jp/shuzai/21/
  - Мトリック → https://shuzai.1geki.jp/shuzai/7/
  - シノ来店実戦 → https://shuzai.1geki.jp/shuzai/19/
  - ジャムの一撃 → https://shuzai.1geki.jp/shuzai/12/

## 1geki-shuzai-19 の診断

- 日付のみ（キーワードなし）のブロック: 2
- キーワードのみ（日付なし）のブロック: 14
- 登録店舗名に一致したブロック: 0
- 抽出に至らなかった例:
  - [日付なし] シノ来店実戦のスロット・パチンコ ホール取材情報
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 【一撃】来店・取材
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 来店取材の一覧
- 取材/来店/スケジュール関連リンク:
  - 【一撃】来店取材スロット・パチンコ → https://shuzai.1geki.jp/
  - 新台 スケジュール → https://1geki.jp/newmachinecalender/
  - 来店取材の一覧 → https://shuzai.1geki.jp/shuzai/
  - スクランブル田谷店 → https://shuzai.1geki.jp/shop/173365/
  - (no text) → https://shuzai.1geki.jp/shuzai/19/
  - (no text) → https://shuzai.1geki.jp/shuzai/1/
  - MiA来店・Youtubeライブ → https://shuzai.1geki.jp/shuzai/mia/
  - シノ来店・Youtubeライブ → https://shuzai.1geki.jp/shuzai/shino/
  - HYPER撃アッチ― → https://shuzai.1geki.jp/shuzai/15/
  - MGeki → https://shuzai.1geki.jp/shuzai/21/
  - Мトリック → https://shuzai.1geki.jp/shuzai/7/
  - ジャムの一撃 → https://shuzai.1geki.jp/shuzai/12/
  - ユメパチユメスロ → https://shuzai.1geki.jp/shuzai/10/
  - 一喝 → https://shuzai.1geki.jp/shuzai/18/
  - 一撃ランキング → https://shuzai.1geki.jp/shuzai/9/

## 1geki-shuzai-21 の診断

- 日付のみ（キーワードなし）のブロック: 6
- キーワードのみ（日付なし）のブロック: 12
- 登録店舗名に一致したブロック: 0
- 抽出に至らなかった例:
  - [日付なし] MGekiのスロット・パチンコ ホール取材情報
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 【一撃】来店・取材
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 来店取材の一覧
- 取材/来店/スケジュール関連リンク:
  - 【一撃】来店取材スロット・パチンコ → https://shuzai.1geki.jp/
  - 新台 スケジュール → https://1geki.jp/newmachinecalender/
  - 来店取材の一覧 → https://shuzai.1geki.jp/shuzai/
  - MGM国領店 → https://shuzai.1geki.jp/shop/17868762/
  - (no text) → https://shuzai.1geki.jp/shuzai/21/
  - 結果を見る → https://shuzai.1geki.jp/20260801-17868762-21/
  - MiA来店・Youtubeライブ → https://shuzai.1geki.jp/shuzai/mia/
  - シノ来店・Youtubeライブ → https://shuzai.1geki.jp/shuzai/shino/
  - HYPER撃アッチ― → https://shuzai.1geki.jp/shuzai/15/
  - Мトリック → https://shuzai.1geki.jp/shuzai/7/
  - シノ来店実戦 → https://shuzai.1geki.jp/shuzai/19/
  - ジャムの一撃 → https://shuzai.1geki.jp/shuzai/12/
  - ユメパチユメスロ → https://shuzai.1geki.jp/shuzai/10/
  - 一喝 → https://shuzai.1geki.jp/shuzai/18/
  - 一撃スロット調査隊 → https://shuzai.1geki.jp/shuzai/1/

## 1geki-shuzai-mia の診断

- 日付のみ（キーワードなし）のブロック: 40
- キーワードのみ（日付なし）のブロック: 13
- 登録店舗名に一致したブロック: 0
- 抽出に至らなかった例:
  - [日付なし] MiA来店・Youtubeライブのスロット・パチンコ ホール取材情報
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 【一撃】来店・取材
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 来店取材の一覧
- 取材/来店/スケジュール関連リンク:
  - 【一撃】来店取材スロット・パチンコ → https://shuzai.1geki.jp/
  - 新台 スケジュール → https://1geki.jp/newmachinecalender/
  - 来店取材の一覧 → https://shuzai.1geki.jp/shuzai/
  - ミカド五反野店 → https://shuzai.1geki.jp/shop/172902/
  - (no text) → https://shuzai.1geki.jp/shuzai/mia/
  - プラザ上大岡アンドミラージュ → https://shuzai.1geki.jp/shop/173369/
  - 結果を見る → https://shuzai.1geki.jp/20260802-172902-mia/
  - 結果を見る → https://shuzai.1geki.jp/20260725-172902-mia/
  - (no text) → https://shuzai.1geki.jp/shuzai/3/
  - 結果を見る → https://shuzai.1geki.jp/20260721-173369-mia/
  - 結果を見る → https://shuzai.1geki.jp/20260718-172902-mia/
  - 結果を見る → https://shuzai.1geki.jp/20260711-173369-mia/
  - 川崎大師 セントラル → https://shuzai.1geki.jp/shop/173632/
  - (no text) → https://shuzai.1geki.jp/shuzai/4/
  - 結果を見る → https://shuzai.1geki.jp/20260628-173632-mia/

## 1geki-shuzai-shino の診断

- 日付のみ（キーワードなし）のブロック: 28
- キーワードのみ（日付なし）のブロック: 13
- 登録店舗名に一致したブロック: 0
- 抽出に至らなかった例:
  - [日付なし] シノ来店・Youtubeライブのスロット・パチンコ ホール取材情報
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 【一撃】来店・取材
  - [日付なし] 【一撃】来店取材スロット・パチンコ
  - [日付なし] 来店取材の一覧
- 取材/来店/スケジュール関連リンク:
  - 【一撃】来店取材スロット・パチンコ → https://shuzai.1geki.jp/
  - 新台 スケジュール → https://1geki.jp/newmachinecalender/
  - 来店取材の一覧 → https://shuzai.1geki.jp/shuzai/
  - プラザ上大岡アンドミラージュ → https://shuzai.1geki.jp/shop/173369/
  - (no text) → https://shuzai.1geki.jp/shuzai/shino/
  - ミカド五反野店 → https://shuzai.1geki.jp/shop/172902/
  - (no text) → https://shuzai.1geki.jp/shuzai/3/
  - 結果を見る → https://shuzai.1geki.jp/20260801-173369-shino/
  - ジャンプ → https://shuzai.1geki.jp/shop/172162/
  - 結果を見る → https://shuzai.1geki.jp/20260726-172162-shino/
  - 結果を見る → https://shuzai.1geki.jp/20260701-173369-shino/
  - 結果を見る → https://shuzai.1geki.jp/20260627-172162-shino/
  - 結果を見る → https://shuzai.1geki.jp/20260611-173369-shino/
  - 結果を見る → https://shuzai.1geki.jp/20260511-173369-shino/
  - 結果を見る → https://shuzai.1geki.jp/20260421-173369-shino/

## slopachi-report-schedule の診断

- 日付のみ（キーワードなし）のブロック: 40
- キーワードのみ（日付なし）のブロック: 47
- 抽出に至らなかった例:
  - [日付なし] 取材・来店スケジュール(予定) | スロパチステーション パチンコ・パチスロホールサイト
  - [日付なし] いそまる実践来店
  - [日付なし] よしき実践来店
  - [日付なし] じゃんじゃん実践来店
  - [日付なし] れんじろう実践来店
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
