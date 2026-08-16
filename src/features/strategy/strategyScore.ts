import { scoreOffering } from '../../lib/scoring'
import type { AdmissionsData, BucketLabel, Offering, ScoreResult, ScoreWeights } from '../../types/admissions'

export const DEFAULT_ESTIMATED_TOTAL = 385
export const MIN_ESTIMATED_TOTAL = 250
export const MAX_ESTIMATED_TOTAL = 450

interface PoolScoreStats {
  lowerQuartile: number
  median: number
  upperQuartile: number
  spread: number
}

interface ReachabilityEstimate {
  value: number
  reason: string
}

function average(values: number[]) {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function percentile(sortedValues: number[], ratio: number) {
  if (sortedValues.length === 0) return DEFAULT_ESTIMATED_TOTAL
  const index = Math.round((sortedValues.length - 1) * ratio)
  return sortedValues[index]
}

function clampReachability(value: number) {
  return Math.max(0.18, Math.min(0.92, Number(value.toFixed(3))))
}

function resolveBucket(value: number): BucketLabel {
  if (value < 0.44) return '冲刺'
  if (value < 0.65) return '主攻'
  return '保底'
}

function toAttainabilityLabel(value: number) {
  if (value >= 0.74) return '高于近年参考'
  if (value >= 0.62) return '接近保底'
  if (value >= 0.48) return '主攻可冲'
  if (value >= 0.38) return '需要冲刺'
  return '明显偏难'
}

function getLatestScoreReferences(offering: Offering) {
  const totals = offering.scoreHistory
    .map((item) => item.total)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    .slice(0, 2)
  const averages = offering.scoreHistory
    .map((item) => item.average)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    .slice(0, 2)

  const totalReference = average(totals)
  const averageReference = average(averages)

  if (totalReference !== null && averageReference !== null) {
    return {
      value: Math.max(totalReference + 8, totalReference * 0.6 + averageReference * 0.4),
      label: '近两年复试线与拟录取均分',
    }
  }

  if (averageReference !== null) {
    return {
      value: averageReference,
      label: '近两年拟录取均分',
    }
  }

  if (totalReference !== null) {
    return {
      value: totalReference + 12,
      label: '近两年复试线',
    }
  }

  return null
}

function buildReachabilityEstimate(
  offering: Offering,
  estimatedTotal: number,
  poolScoreStats: PoolScoreStats,
  legacyReachabilityValue: number | null,
): ReachabilityEstimate {
  const historyReference = getLatestScoreReferences(offering)

  if (historyReference) {
    const gap = estimatedTotal - historyReference.value
    const reachability = clampReachability(0.5 + gap / 120)
    const gapLabel =
      gap === 0
        ? '基本持平'
        : gap > 0
          ? `高出约 ${Math.round(gap)} 分`
          : `低约 ${Math.abs(Math.round(gap))} 分`

    return {
      value: reachability,
      reason: `${historyReference.label}参考约 ${Math.round(historyReference.value)} 分，当前自估 ${estimatedTotal} 分，${gapLabel}。`,
    }
  }

  const legacyReference =
    legacyReachabilityValue === null
      ? poolScoreStats.median
      : poolScoreStats.median + (0.72 - legacyReachabilityValue) * 120
  const fallbackReference = Math.max(
    poolScoreStats.lowerQuartile - 8,
    Math.min(poolScoreStats.upperQuartile + 46, legacyReference),
  )

  return {
    value: clampReachability(0.5 + (estimatedTotal - fallbackReference) / 120),
    reason: `缺少项目历史分，按院校池已知分数中位数 ${Math.round(poolScoreStats.median)} 分和该项目原始难度换算；当前自估 ${estimatedTotal} 分。`,
  }
}

export function clampEstimatedTotal(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_ESTIMATED_TOTAL
  return Math.max(MIN_ESTIMATED_TOTAL, Math.min(MAX_ESTIMATED_TOTAL, Math.round(value)))
}

export function collectStrategyPoolScoreStats(data: AdmissionsData): PoolScoreStats {
  const totals = data.allOfferings
    .flatMap((offering) =>
      offering.scoreHistory
        .map((item) => item.total)
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value)),
    )
    .sort((left, right) => left - right)

  if (totals.length === 0) {
    return {
      lowerQuartile: DEFAULT_ESTIMATED_TOTAL - 18,
      median: DEFAULT_ESTIMATED_TOTAL,
      upperQuartile: DEFAULT_ESTIMATED_TOTAL + 18,
      spread: 24,
    }
  }

  const lowerQuartile = percentile(totals, 0.25)
  const median = percentile(totals, 0.5)
  const upperQuartile = percentile(totals, 0.75)

  return {
    lowerQuartile,
    median,
    upperQuartile,
    spread: Math.max(18, upperQuartile - lowerQuartile),
  }
}

export function scoreStrategyOffering(
  offering: Offering,
  weights: ScoreWeights,
  selectedProvince: string,
  estimatedTotal: number,
  poolScoreStats: PoolScoreStats,
): ScoreResult {
  const baseScore = scoreOffering(offering, weights, selectedProvince)
  const legacyReachability = baseScore.breakdown.find((item) => item.key === 'scoreReachability')?.rawValue ?? null
  const dynamicReachability = buildReachabilityEstimate(
    offering,
    estimatedTotal,
    poolScoreStats,
    legacyReachability,
  )

  const breakdown = baseScore.breakdown.map((item) =>
    item.key === 'scoreReachability'
      ? {
          ...item,
          rawValue: dynamicReachability.value,
          weightedScore: dynamicReachability.value * item.weight,
          reason: dynamicReachability.reason,
        }
      : {
          ...item,
          weightedScore: item.rawValue === null ? null : item.rawValue * item.weight,
        },
  )

  const coveredWeight = breakdown.reduce(
    (sum, item) => (item.rawValue === null ? sum : sum + item.weight),
    0,
  )
  const weightedScore = breakdown.reduce(
    (sum, item) => (item.weightedScore === null ? sum : sum + item.weightedScore),
    0,
  )
  const normalizedScore = coveredWeight === 0 ? null : (weightedScore / coveredWeight) * 100
  const coverageFactor = 0.5 + 0.5 * (baseScore.coverage / 100)
  const total =
    normalizedScore === null ? null : Number((normalizedScore * coverageFactor).toFixed(1))

  return {
    ...baseScore,
    total,
    bucket: resolveBucket(dynamicReachability.value),
    attainabilityLabel: toAttainabilityLabel(dynamicReachability.value),
    breakdown,
  }
}
