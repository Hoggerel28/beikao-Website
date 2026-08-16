import type { AssessmentLevel, BucketLabel, Offering, ScoreBreakdownItem, ScoreResult, ScoreWeights } from '../types/admissions'
import { getSchoolMeta } from '../data/schoolMeta'

export const defaultWeights: ScoreWeights = {
  examMatch: 20,
  seatStability: 20,
  scoreReachability: 20,
  retestRisk: 15,
  directionFit: 10,
  regionEmployment: 10,
  personalPreference: 5,
}

const positiveLevelScore: Record<AssessmentLevel, number | null> = {
  veryHigh: 0.95,
  high: 0.84,
  mediumHigh: 0.74,
  medium: 0.62,
  mediumLow: 0.5,
  low: 0.34,
  unknown: null,
}

const riskLevelScore: Record<AssessmentLevel, number | null> = {
  veryHigh: 0.22,
  high: 0.3,
  mediumHigh: 0.42,
  medium: 0.56,
  mediumLow: 0.7,
  low: 0.84,
  unknown: null,
}

function getExamMatchScore(offering: Offering) {
  if (offering.is11408) {
    return {
      value: 0.94,
      reason: '初试科目与 11408 高度匹配。',
    }
  }

  if (offering.examSubjects.some((item) => item.includes('408'))) {
    return {
      value: 0.76,
      reason: '含 408，但科目组合与标准 11408 不完全一致。',
    }
  }

  return {
    value: 0.48,
    reason: '需要按自命题或非 11408 路线额外适配。',
  }
}

function getSeatStabilityScore(offering: Offering) {
  const assessmentValue = positiveLevelScore[offering.assessment.quotaStability ?? 'unknown']
  if (assessmentValue !== null) {
    return {
      value: assessmentValue,
      reason: `统考名额稳定性评估为${offering.assessment.quotaStability}。`,
    }
  }

  if (offering.unifiedExamQuota !== null || offering.plannedEnrollment !== null) {
    return {
      value: 0.62,
      reason: '已有计划名额信息，但推免后统考名额仍待官方复核。',
    }
  }

  return {
    value: null,
    reason: '统考名额与推免后口径尚未公开。',
  }
}

function getScoreReachabilityScore(offering: Offering) {
  const schoolTier = getSchoolMeta(offering.schoolId)?.tier
  let relativeValue =
    schoolTier === 1 ? 0.34 : schoolTier === 2 ? 0.48 : schoolTier === 3 ? 0.56 : null

  if (
    offering.schoolId === 'bupt' &&
    offering.programCode === '085404'
  ) {
    relativeValue = 0.4
  }

  if (relativeValue !== null && /^0854/.test(offering.programCode)) {
    relativeValue += 0.04
  }

  if (relativeValue !== null && offering.unifiedExamQuota !== null) {
    if (offering.unifiedExamQuota >= 30) relativeValue += 0.06
    if (offering.unifiedExamQuota <= 5) relativeValue -= 0.08
  }

  if (relativeValue !== null) {
    return {
      value: Math.max(0.2, Math.min(0.72, relativeValue)),
      reason:
        '在尚未录入个人模考分前，按本院校池相对层级、专业热度与已知统考名额估算；不是录取概率。',
    }
  }

  if (offering.scoreHistory.length > 0) {
    return {
      value: 0.58,
      reason: '已有近年分数记录，但仍需结合今年目录判断。',
    }
  }

  return {
    value: null,
    reason: '缺少近三年复试线与拟录取分数。',
  }
}

function getRetestRiskScore(offering: Offering) {
  const assessmentValue = riskLevelScore[offering.assessment.retestRisk ?? 'unknown']
  if (assessmentValue !== null) {
    return {
      value: assessmentValue,
      reason: `复试风险评估为${offering.assessment.retestRisk}。`,
    }
  }

  if (offering.retest.weight !== null || offering.retest.ratio !== null || offering.retest.codingTest !== null) {
    return {
      value: 0.58,
      reason: '已有部分复试规则，但机试与差额比例未完全确认。',
    }
  }

  return {
    value: null,
    reason: '复试占比、机试与笔试口径缺失。',
  }
}

function getDirectionFitScore(offering: Offering) {
  const assessmentValue = positiveLevelScore[offering.assessment.directionFit ?? 'unknown']
  if (assessmentValue !== null) {
    return {
      value: assessmentValue,
      reason: `专业方向匹配度评估为${offering.assessment.directionFit}。`,
    }
  }

  const directionText = `${offering.programName} ${offering.direction}`
  if (/计算机|软件|人工智能|大数据|网络与信息安全|网络空间安全|密码/.test(directionText)) {
    return {
      value: 0.72,
      reason: '专业或方向名称与计算机相关专硕目标一致。',
    }
  }

  return {
    value: null,
    reason: '方向匹配度需要结合后续 top18 与个人偏好补充。',
  }
}

function getRegionEmploymentScore(offering: Offering) {
  const assessmentValue = positiveLevelScore[offering.assessment.regionEmployment ?? 'unknown']
  if (assessmentValue !== null) {
    return {
      value: assessmentValue,
      reason: `地域就业优势评估为${offering.assessment.regionEmployment}。`,
    }
  }

  if (offering.employment.trim()) {
    return {
      value: 0.64,
      reason: '存在地域就业描述，但缺少统一量化口径。',
    }
  }

  return {
    value: null,
    reason: '缺少地域就业优势描述。',
  }
}

function getPersonalPreferenceScore(offering: Offering, selectedProvince: string) {
  if (selectedProvince !== 'all') {
    return {
      value: offering.schoolProvince === selectedProvince ? 0.9 : 0.48,
      reason:
        offering.schoolProvince === selectedProvince
          ? '当前筛选地区与个人偏好一致。'
          : '当前筛选地区之外的项目按中性偏低处理。',
    }
  }

  return {
    value: 0.6,
    reason: '未单独设定城市偏好，按中性值处理。',
  }
}

function toAttainabilityLabel(value: number | null) {
  if (value === null) return '待核验'
  if (value >= 0.62) return '池内较可达'
  if (value >= 0.48) return '池内中等'
  if (value >= 0.38) return '池内偏难'
  return '池内很难'
}

function toRiskLabel(level: AssessmentLevel | undefined) {
  switch (level) {
    case 'veryHigh':
      return '很高'
    case 'high':
      return '较高'
    case 'mediumHigh':
      return '中等偏高'
    case 'medium':
      return '中等'
    case 'mediumLow':
      return '较低'
    case 'low':
      return '低'
    default:
      return '待核验'
  }
}

function resolveBucket(reachabilityValue: number | null): BucketLabel {
  if (reachabilityValue === null || reachabilityValue < 0.44) return '冲刺'
  if (reachabilityValue < 0.65) return '主攻'
  return '保底'
}

export function scoreOffering(
  offering: Offering,
  weights: ScoreWeights,
  selectedProvince: string,
): ScoreResult {
  const examMatch = getExamMatchScore(offering)
  const seatStability = getSeatStabilityScore(offering)
  const scoreReachability = getScoreReachabilityScore(offering)
  const retestRisk = getRetestRiskScore(offering)
  const directionFit = getDirectionFitScore(offering)
  const regionEmployment = getRegionEmploymentScore(offering)
  const personalPreference = getPersonalPreferenceScore(offering, selectedProvince)

  const breakdown: ScoreBreakdownItem[] = [
    { key: 'examMatch', label: '科目', weight: weights.examMatch, rawValue: examMatch.value, weightedScore: null, reason: examMatch.reason },
    { key: 'seatStability', label: '名额', weight: weights.seatStability, rawValue: seatStability.value, weightedScore: null, reason: seatStability.reason },
    { key: 'scoreReachability', label: '分数', weight: weights.scoreReachability, rawValue: scoreReachability.value, weightedScore: null, reason: scoreReachability.reason },
    { key: 'retestRisk', label: '复试', weight: weights.retestRisk, rawValue: retestRisk.value, weightedScore: null, reason: retestRisk.reason },
    { key: 'directionFit', label: '方向', weight: weights.directionFit, rawValue: directionFit.value, weightedScore: null, reason: directionFit.reason },
    { key: 'regionEmployment', label: '地域', weight: weights.regionEmployment, rawValue: regionEmployment.value, weightedScore: null, reason: regionEmployment.reason },
    { key: 'personalPreference', label: '偏好', weight: weights.personalPreference, rawValue: personalPreference.value, weightedScore: null, reason: personalPreference.reason },
  ]

  const totalWeight = breakdown.reduce((sum, item) => sum + item.weight, 0)
  let coveredWeight = 0
  let weightedScore = 0

  for (const item of breakdown) {
    if (item.rawValue === null) {
      item.weightedScore = null
      continue
    }

    item.weightedScore = item.rawValue * item.weight
    coveredWeight += item.weight
    weightedScore += item.weightedScore
  }

  const scoreDimensionCoverage =
    totalWeight === 0 ? 0 : (coveredWeight / totalWeight) * 100
  const coverage = Number(
    Math.min(scoreDimensionCoverage, offering.completeness).toFixed(1),
  )
  const normalizedScore = coveredWeight === 0 ? null : (weightedScore / coveredWeight) * 100
  // Missing evidence is not scored as zero, but it still reduces ranking confidence.
  const coverageFactor = 0.5 + 0.5 * (coverage / 100)
  const total =
    normalizedScore === null ? null : Number((normalizedScore * coverageFactor).toFixed(1))

  return {
    total,
    coverage,
    bucket: resolveBucket(scoreReachability.value),
    attainabilityLabel: toAttainabilityLabel(scoreReachability.value),
    riskLabel: toRiskLabel(offering.assessment.retestRisk),
    breakdown,
  }
}
