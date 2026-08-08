/**
 * 店舗公式X(旧Twitter)アダプタ — 公式 X API v2 経由でのみ動作する。
 *
 * 【有効化の手順】
 * 1. X API の読み取り可能なプラン（Basic以上）を契約し Bearer Token を取得
 * 2. GitHub リポジトリの Secrets に X_BEARER_TOKEN を登録
 *    （.github/workflows/collect.yml が env として渡す）
 * 3. data/sources.json の official_sns.enabled を true にする
 * 4. data/stores.json の各店舗 urls.sns に https://x.com/<handle> を登録
 *
 * トークン未設定・enabled=false の間は何もしない。
 * 画面スクレイピングや非公式APIによる取得は規約違反のため実装しない。
 */
import type { ObservationBatch } from '../../../src/saku/lib/types'
import { EMPTY_BATCH } from '../../../src/saku/lib/types'
import { readJson, writeJson } from '../io'
import { X_STATE_FILE } from '../paths'
import { extractEventObservations, type XPost } from '../xExtract'
import type { Adapter, AdapterContext } from './types'

const API = 'https://api.x.com/2'

interface XAccountState {
  userId?: string
  sinceId?: string
  lastCheckedAt?: string
}

interface XState {
  accounts: Record<string, XAccountState>
}

const handleFromUrl = (url: string): string | null => {
  const m = url.match(/^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})(?:[/?].*)?$/)
  return m ? m[1] : null
}

const apiGet = async (path: string, token: string): Promise<unknown | null> => {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 429) {
    console.warn(`[official_x] レート制限に到達。今回はスキップ: ${path}`)
    return null
  }
  if (!res.ok) {
    console.warn(`[official_x] HTTP ${res.status}: ${path}`)
    return null
  }
  return res.json()
}

export const officialXAdapter: Adapter = {
  sourceId: 'official_sns',
  async collect(ctx: AdapterContext): Promise<ObservationBatch> {
    const token = process.env.X_BEARER_TOKEN
    if (!token) {
      console.log('[official_x] X_BEARER_TOKEN 未設定のためスキップ（X API契約後に設定してください）')
      return EMPTY_BATCH
    }

    const state = readJson<XState>(X_STATE_FILE, { accounts: {} })
    const batch: ObservationBatch = { observations: [], noEvents: [], removals: [] }

    for (const store of ctx.stores) {
      for (const snsUrl of store.urls.sns ?? []) {
        const handle = handleFromUrl(snsUrl)
        if (!handle) continue
        const acct: XAccountState = state.accounts[handle] ?? {}

        // ハンドル → ユーザーID（初回のみ）
        if (!acct.userId) {
          const data = (await apiGet(`/users/by/username/${handle}`, token)) as
            | { data?: { id: string } }
            | null
          if (!data?.data?.id) continue
          acct.userId = data.data.id
        }

        // 前回以降の新規投稿を取得（リポスト・リプライ除外）
        const params = new URLSearchParams({
          max_results: '50',
          exclude: 'retweets,replies',
          'tweet.fields': 'created_at',
        })
        if (acct.sinceId) params.set('since_id', acct.sinceId)
        const timeline = (await apiGet(`/users/${acct.userId}/tweets?${params}`, token)) as
          | { data?: { id: string; text: string; created_at: string }[]; meta?: { newest_id?: string } }
          | null
        if (!timeline) {
          state.accounts[handle] = acct
          continue
        }

        for (const tweet of timeline.data ?? []) {
          const post: XPost = {
            id: tweet.id,
            text: tweet.text,
            createdAt: tweet.created_at,
            url: `https://x.com/${handle}/status/${tweet.id}`,
          }
          batch.observations.push(
            ...extractEventObservations(post, store.id, `公式X(@${handle})`),
          )
        }

        if (timeline.meta?.newest_id) acct.sinceId = timeline.meta.newest_id
        acct.lastCheckedAt = ctx.nowIso
        state.accounts[handle] = acct
      }
    }

    writeJson(X_STATE_FILE, state)
    return batch
  },
}
