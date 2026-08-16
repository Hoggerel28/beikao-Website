import type { AssessmentLevel, ConfidenceLevel, Offering } from '../types/admissions'

export function formatNumber(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '待核验'
  }

  return `${value}${suffix}`
}

export function formatCurrency(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '待核验'
  }

  if (typeof value === 'number') {
    return `${value} 元 / 年`
  }

  return value
}

export function formatQuota(offering: Offering) {
  if (offering.unifiedExamQuota !== null) {
    return `${offering.unifiedExamQuota} 名`
  }

  if (offering.plannedEnrollment !== null) {
    return `待核验（计划 ${offering.plannedEnrollment}）`
  }

  return '待核验'
}

export function formatConfidence(confidence: ConfidenceLevel) {
  switch (confidence) {
    case 'complete':
      return '官方口径已核验'
    case 'partial':
      return '部分字段待复核'
    case 'limited':
      return '仅官方入口'
    default:
      return '待补充'
  }
}

export function getConfidenceTone(confidence: ConfidenceLevel) {
  switch (confidence) {
    case 'complete':
      return 'success'
    case 'partial':
      return 'warning'
    case 'limited':
      return 'danger'
    default:
      return 'muted'
  }
}

export function getCompletenessLabel(completeness: number) {
  if (completeness >= 75) return '数据较完整'
  if (completeness >= 50) return '待当年复核'
  return '缺失较多'
}

export function getCompletenessTone(completeness: number) {
  if (completeness >= 75) return 'success'
  if (completeness >= 50) return 'warning'
  return 'muted'
}

export function getAssessmentLabel(level: AssessmentLevel | undefined) {
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
      return '中等偏低'
    case 'low':
      return '较低'
    default:
      return '待核验'
  }
}

export function formatYear(value: number | undefined) {
  return value ? String(value) : '待核验'
}

export function createSchoolMonogram(name: string) {
  return name.slice(0, 2)
}
