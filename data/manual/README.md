# 手動取込フォルダ

このフォルダに置いた `*.json` は `npm run collect`（GitHub Actions で自動実行）時に
イベントDBへ取り込まれます。アプリの「エクスポート」ボタンで出力したファイルを
そのままここへコミットしてください。

形式（ObservationBatch）:

```json
{
  "observations": [
    {
      "storeId": "maruhan-saku",
      "date": "2026-08-18",
      "name": "○○取材",
      "category": "取材",
      "detail": "任意の詳細",
      "source": { "sourceId": "manual", "sourceName": "DMMぱちタウン(手動確認)", "url": "https://..." },
      "observedAt": "2026-08-08T09:00:00+09:00"
    }
  ],
  "noEvents": [
    {
      "storeId": "maruhan-saku",
      "date": "2026-08-08",
      "source": { "sourceId": "manual", "sourceName": "手動確認" },
      "observedAt": "2026-08-08T09:00:00+09:00"
    }
  ],
  "removals": [
    {
      "storeId": "maruhan-saku",
      "date": "2026-08-18",
      "name": "○○取材",
      "movedToDate": "2026-08-19",
      "source": { "sourceId": "manual", "sourceName": "手動確認" },
      "observedAt": "2026-08-10T09:00:00+09:00"
    }
  ]
}
```

- `storeId` は `data/stores.json` の id
- `category` は 取材/来店/実践来店/メディア/メーカー/店舗独自/新台入替/リニューアル/グランドオープン/周年/特定日/旧イベント日/その他
- `noEvents` は「確認したがイベント掲載がなかった」記録（「情報なし」との区別に使われる）
- `removals` の `movedToDate` は開催日変更のとき（変更後の日付のイベントを observations にも入れる）
- `00-demo-seed.json` はサンプルデータ。実運用開始時に削除して `data/db/` と `public/data/dataset.json` を消してから `npm run collect` を実行する。
