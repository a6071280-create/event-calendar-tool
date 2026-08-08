/**
 * X(旧Twitter)の投稿本文からイベント情報を機械的に抽出する。
 * 抽出コアは extractCore.ts（Webページ収集と共通）。
 */
import type { EventObservation } from '../../src/saku/lib/types'
import { extractDates as coreExtractDates, extractFromText } from './extractCore'

export const extractDates = coreExtractDates

export interface XPost {
  id: string
  text: string
  createdAt: string
  url: string
}

/**
 * 1投稿から観測を抽出する。日付とイベント種別キーワードの両方が
 * 見つからない投稿は取り込まない（誤検知より取りこぼしを許容する）。
 */
export const extractEventObservations = (
  post: XPost,
  storeId: string,
  sourceName: string,
  maxPastDays = 45,
  maxFutureDays = 90,
): EventObservation[] =>
  extractFromText(
    post.text,
    post.createdAt,
    storeId,
    { sourceId: 'official_sns', sourceName, url: post.url },
    post.createdAt,
    { maxPastDays, maxFutureDays },
  )
