import { useMemo, useState } from 'react'
import type { CompetitorEvent, OwnPromotionDay } from '../types'
import { useActualResults } from '../hooks/useActualResults'
import { useForecastSettings } from '../hooks/useForecastSettings'
import {
  buildFeatureContext,
  MIN_TRAIN_RECORDS,
  modelCoefficients,
  predictDay,
  trainForecastModel,
} from '../utils/forecast'
import type { DayForecast } from '../utils/forecast'
import { downloadCSV, toCSV } from '../utils/csv'
import { addDays, parseISODate, toISODate, WEEKDAY_LABELS } from '../utils/date'

interface ForecastViewProps {
  events: CompetitorEvent[]
  ownPromotions: OwnPromotionDay[]
}

const HORIZONS = [7, 14, 30] as const

const signed = (value: number): string =>
  `${value >= 0 ? '+' : ''}${Math.round(value * 10) / 10}`

const formatReasons = (forecast: DayForecast): string => {
  if (forecast.contributions.length === 0) return `基準${forecast.baseline}人のみ`
  const parts = forecast.contributions.map((c) => `${c.label}${signed(c.value)}`)
  return `基準${forecast.baseline} / ${parts.join(' / ')}`
}

const parseDayList = (text: string): number[] =>
  text
    .split(/[,、\s]+/)
    .map((cell) => Number(cell))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 31)

export function ForecastView({ events, ownPromotions }: ForecastViewProps) {
  const { actualResults, upsertActualResult, deleteActualResult, importActualResultsCSV } =
    useActualResults()
  const { settings, updateSettings } = useForecastSettings()

  const [inputDate, setInputDate] = useState(toISODate(new Date()))
  const [inputVisitors, setInputVisitors] = useState('')
  const [importText, setImportText] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const [horizon, setHorizon] = useState<(typeof HORIZONS)[number]>(14)
  const [paydayText, setPaydayText] = useState(settings.paydayDays.join(','))

  const ctx = useMemo(
    () => buildFeatureContext(events, ownPromotions, settings),
    [events, ownPromotions, settings],
  )

  const model = useMemo(() => trainForecastModel(actualResults, ctx), [actualResults, ctx])

  const forecasts = useMemo(() => {
    if (!model) return []
    const today = new Date()
    const rows: DayForecast[] = []
    for (let i = 0; i < horizon; i++) {
      rows.push(predictDay(model, toISODate(addDays(today, i)), ctx))
    }
    return rows
  }, [model, horizon, ctx])

  const coefficients = useMemo(() => (model ? modelCoefficients(model) : []), [model])

  const recentActuals = useMemo(
    () => [...actualResults].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
    [actualResults],
  )

  const handleAddActual = () => {
    const visitors = Number(inputVisitors)
    if (!inputDate || !Number.isFinite(visitors) || visitors < 0) return
    upsertActualResult({ date: inputDate, visitors })
    setInputVisitors('')
    setInputDate(toISODate(addDays(parseISODate(inputDate), 1)))
  }

  const handleImport = () => {
    const { added, skipped } = importActualResultsCSV(importText)
    setImportMessage(
      added > 0
        ? `${added}件を取り込みました${skipped > 0 ? `（${skipped}行はスキップ）` : ''}`
        : '取り込める行がありませんでした。「日付,来店数」の形式で貼り付けてください',
    )
    if (added > 0) setImportText('')
  }

  const handlePaydayBlur = () => {
    const days = parseDayList(paydayText)
    if (days.length > 0) {
      updateSettings({ paydayDays: days })
      setPaydayText(days.join(','))
    } else {
      setPaydayText(settings.paydayDays.join(','))
    }
  }

  const handleExport = () => {
    const csv = toCSV(
      ['日付', '曜日', '予測来店数', '根拠'],
      forecasts.map((f) => [
        f.date,
        WEEKDAY_LABELS[parseISODate(f.date).getDay()],
        String(f.predicted),
        formatReasons(f),
      ]),
    )
    downloadCSV(`forecast_${toISODate(new Date())}.csv`, csv)
  }

  return (
    <div className="forecast-view">
      <h2>稼働予測</h2>
      <p className="forecast-view__description">
        日々の実績を記録すると、カレンダーに登録済みの自社販促・競合イベントと曜日・祝日・給料日を組み合わせて、今後の来店数を予測します。
      </p>

      <div className="forecast-view__panels">
        <section className="forecast-view__panel">
          <h3>実績の記録（{actualResults.length}件）</h3>
          <div className="forecast-view__input-row">
            <input
              type="date"
              value={inputDate}
              onChange={(e) => setInputDate(e.target.value)}
              aria-label="実績の日付"
            />
            <input
              type="number"
              min={0}
              placeholder="来店数"
              value={inputVisitors}
              onChange={(e) => setInputVisitors(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddActual()}
              aria-label="来店数"
            />
            <button type="button" className="btn btn--primary" onClick={handleAddActual}>
              記録
            </button>
          </div>

          {recentActuals.length > 0 && (
            <table className="forecast-view__table">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>来店数</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentActuals.map((r) => (
                  <tr key={r.date}>
                    <td>
                      {r.date}（{WEEKDAY_LABELS[parseISODate(r.date).getDay()]}）
                    </td>
                    <td>{r.visitors}</td>
                    <td>
                      <button
                        type="button"
                        className="forecast-view__delete"
                        onClick={() => deleteActualResult(r.date)}
                        aria-label={`${r.date}の実績を削除`}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <details className="forecast-view__import">
            <summary>CSVから一括取り込み</summary>
            <textarea
              rows={5}
              placeholder={'2026-06-01,132\n2026-06-02,98'}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <div className="forecast-view__import-actions">
              <button type="button" className="btn" onClick={handleImport}>
                取り込む
              </button>
              {importMessage && <span className="forecast-view__import-message">{importMessage}</span>}
            </div>
          </details>

          <div className="forecast-view__settings">
            <label>
              給料日（日にち、カンマ区切り）
              <input
                type="text"
                value={paydayText}
                onChange={(e) => setPaydayText(e.target.value)}
                onBlur={handlePaydayBlur}
              />
            </label>
            <span className="forecast-view__settings-note">
              年金支給日は偶数月{settings.pensionDays.join(',')}日として扱います
            </span>
          </div>
        </section>

        <section className="forecast-view__panel">
          <h3>モデルの状態</h3>
          {!model ? (
            <p className="forecast-view__empty">
              実績が{MIN_TRAIN_RECORDS}件以上たまると予測できます（現在{actualResults.length}件）。まずは毎日の来店数を記録してください。
            </p>
          ) : (
            <>
              <p className="forecast-view__model-stats">
                学習データ: {model.trainCount}件
                {model.maeCV !== null && (
                  <>
                    ／ 予測誤差の目安（MAE）: ±{Math.round(model.maeCV * 10) / 10}人
                  </>
                )}
              </p>
              <table className="forecast-view__table">
                <thead>
                  <tr>
                    <th>要因</th>
                    <th>効果（月曜・イベントなし基準）</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>基準（月曜・通常日）</td>
                    <td>{Math.round(model.weights[0] * 10) / 10}人</td>
                  </tr>
                  {coefficients.map((c) => (
                    <tr key={c.label}>
                      <td>{c.label}</td>
                      <td className={c.value >= 0 ? 'forecast-view__pos' : 'forecast-view__neg'}>
                        {signed(c.value)}人
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </section>
      </div>

      {model && (
        <section className="forecast-view__panel forecast-view__panel--wide">
          <div className="forecast-view__forecast-toolbar">
            <h3>今後の予測</h3>
            <div className="forecast-view__horizon">
              {HORIZONS.map((h) => (
                <button
                  key={h}
                  type="button"
                  className={horizon === h ? 'active' : ''}
                  onClick={() => setHorizon(h)}
                >
                  {h}日
                </button>
              ))}
            </div>
            <button type="button" className="btn" onClick={handleExport}>
              CSVエクスポート
            </button>
          </div>
          <table className="forecast-view__table">
            <thead>
              <tr>
                <th>日付</th>
                <th>曜日</th>
                <th>予測来店数</th>
                <th>根拠</th>
              </tr>
            </thead>
            <tbody>
              {forecasts.map((f) => {
                const dow = parseISODate(f.date).getDay()
                return (
                  <tr key={f.date}>
                    <td>{f.date}</td>
                    <td className={dow === 0 ? 'forecast-view__neg' : dow === 6 ? 'forecast-view__sat' : ''}>
                      {WEEKDAY_LABELS[dow]}
                    </td>
                    <td className="forecast-view__predicted">{f.predicted}人</td>
                    <td className="forecast-view__reasons">{formatReasons(f)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="forecast-view__note">
            予測したい日の自社販促・競合イベントを先にカレンダーへ登録しておくと、その分が予測へ反映されます。
          </p>
        </section>
      )}
    </div>
  )
}
