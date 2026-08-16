export type NavView = 'schools' | 'strategy' | 'plan'

export type AssessmentLevel =
  | 'veryHigh'
  | 'high'
  | 'mediumHigh'
  | 'medium'
  | 'mediumLow'
  | 'low'
  | 'unknown'

export type ConfidenceLevel = 'complete' | 'partial' | 'limited' | 'unknown'

export type SourceType = 'admission' | 'college' | 'catalog' | 'official' | string

export type BucketLabel = '冲刺' | '主攻' | '保底'

export interface RawSource {
  id: string
  label: string
  type: SourceType
  url: string
  official: boolean
}

export interface RawRetest {
  weight: number | null
  ratio: number | null
  codingTest: string | boolean | null
  content: string
}

export interface RawAssessment {
  competitiveness?: AssessmentLevel
  quotaStability?: AssessmentLevel
  scoreAttainability?: AssessmentLevel
  retestRisk?: AssessmentLevel
  directionFit?: AssessmentLevel
  regionEmployment?: AssessmentLevel
}

export interface RawScoreHistoryValue {
  total?: number
  politics?: number
  foreignLanguage?: number
  business1?: number
  business2?: number
}

export interface ScoreStatistic {
  minimum?: number
  maximum?: number
  average?: number
  median?: number
}

export interface ScoreDistributionItem {
  range: string
  retestCount?: number
  admittedCount?: number
}

export interface RawScoreHistoryItem {
  year: number | string
  type?: string
  scope?: string
  source?: string | Record<string, unknown>
  official?: boolean
  evidence?: string[]
  value?: RawScoreHistoryValue
  total?: number
  retestLineRaw?: string
  average?: number
  admittedCount?: number
  retestCount?: number
  firstChoiceAdmittedCount?: number
  transferAdmittedCount?: number
  admissionRate?: number
  politics?: number
  english?: number
  foreignLanguage?: number
  major?: number
  business1?: number
  business2?: number
  admittedMinimum?: number
  admittedMaximum?: number
  admittedMedian?: number
  subjectStats?: Record<string, ScoreStatistic>
  scoreDistribution?: ScoreDistributionItem[]
}

export interface RawUnit {
  id: string
  name: string
  type: string
  programCode: string
  programName: string
  degreeType: string
  direction: string
  latestCatalogYear: number
  examSubjects: string[]
  is11408: boolean
  plannedEnrollment: number | null
  recommendationExempt: number | null
  unifiedExamQuota: number | null
  scoreHistory: RawScoreHistoryItem[]
  retest: RawRetest
  tuition: number | string | null
  accommodation: string | null
  employment: string
  risks: string[]
  confidence: ConfidenceLevel
  completeness: number
  assessment: RawAssessment
  sources: RawSource[]
}

export interface RawSchool {
  id: string
  name: string
  city: string
  province: string
  category: string
  units: RawUnit[]
}

export interface RawDataset {
  generatedAt: string
  scope: string
  dataPolicy: string
  schools: RawSchool[]
}

export interface SourceLink extends RawSource {
  datasetKey: string
}

export interface ScoreHistoryItem {
  year: number
  type?: string
  scope?: string
  source?: string | Record<string, unknown>
  official?: boolean
  evidence?: string[]
  total?: number
  retestLineRaw?: string
  average?: number
  admittedCount?: number
  retestCount?: number
  firstChoiceAdmittedCount?: number
  transferAdmittedCount?: number
  admissionRate?: number
  politics?: number
  english?: number
  foreignLanguage?: number
  major?: number
  business1?: number
  business2?: number
  admittedMinimum?: number
  admittedMaximum?: number
  admittedMedian?: number
  subjectStats?: Record<string, ScoreStatistic>
  scoreDistribution?: ScoreDistributionItem[]
}

export interface Offering {
  id: string
  schoolId: string
  schoolName: string
  schoolCity: string
  schoolProvince: string
  schoolCategory: string
  unitId: string
  unitName: string
  unitType: string
  programCode: string
  programName: string
  programKey: string
  degreeType: string
  direction: string
  latestCatalogYear: number
  examSubjects: string[]
  is11408: boolean
  plannedEnrollment: number | null
  recommendationExempt: number | null
  unifiedExamQuota: number | null
  scoreHistory: ScoreHistoryItem[]
  retest: RawRetest
  tuition: number | string | null
  accommodation: string | null
  employment: string
  risks: string[]
  confidence: ConfidenceLevel
  completeness: number
  assessment: RawAssessment
  sources: SourceLink[]
  datasetKey: string
}

export interface UnitGroup {
  id: string
  name: string
  type: string
  offerings: Offering[]
}

export interface SchoolEntry {
  id: string
  name: string
  city: string
  province: string
  category: string
  units: UnitGroup[]
}

export interface AdmissionsData {
  datasets: Array<{
    datasetKey: string
    generatedAt: string
    scope: string
    dataPolicy: string
  }>
  schools: SchoolEntry[]
  allOfferings: Offering[]
  provinces: string[]
  latestGeneratedAt: string
  pendingTop18: boolean
}

export interface ScoreWeights {
  examMatch: number
  seatStability: number
  scoreReachability: number
  retestRisk: number
  directionFit: number
  regionEmployment: number
  personalPreference: number
}

export interface ScoreBreakdownItem {
  key: keyof ScoreWeights
  label: string
  weight: number
  rawValue: number | null
  weightedScore: number | null
  reason: string
}

export interface ScoreResult {
  total: number | null
  coverage: number
  bucket: BucketLabel
  attainabilityLabel: string
  riskLabel: string
  breakdown: ScoreBreakdownItem[]
}

export interface SchoolFilters {
  search: string
  province: string
  only11408: boolean
  completeness: 'all' | 'ready' | 'review' | 'missing'
  sortBy: 'completeness' | 'alphabet' | 'city'
}

export interface StrategyFilters {
  bucket: 'all' | BucketLabel
  sortBy: 'score' | 'coverage' | 'alphabet'
  page: number
  pageSize: number
}
