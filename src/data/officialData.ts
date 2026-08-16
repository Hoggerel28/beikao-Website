import type {
  AdmissionsData,
  ConfidenceLevel,
  Offering,
  RawDataset,
  RawRetest,
  RawScoreHistoryItem,
  RawSchool,
  ScoreHistoryItem,
  SchoolEntry,
  UnitGroup,
} from '../types/admissions'
import { getTargetSchoolOrder, targetSchoolIds } from './schoolMeta'

type DatasetModule = {
  default: RawDataset
}

const datasetModules = import.meta.glob<DatasetModule>(
  './round2-merged-official-data.json',
  { eager: true },
)

function getDatasetKey(modulePath: string) {
  const fileName = modulePath.split('/').pop() ?? 'dataset.json'
  return fileName.replace('-official-data.json', '')
}

function normalizeScoreHistory(
  items: RawScoreHistoryItem[],
): ScoreHistoryItem[] {
  const toFiniteNumber = (value: unknown) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return undefined
    }

    return value
  }

  return items
    .map((item) => {
      const nestedValue = item.value ?? {}
      const foreignLanguage =
        toFiniteNumber(nestedValue.foreignLanguage) ?? toFiniteNumber(item.foreignLanguage)
      const business1 =
        toFiniteNumber(nestedValue.business1) ?? toFiniteNumber(item.business1)
      const business2 =
        toFiniteNumber(nestedValue.business2) ?? toFiniteNumber(item.business2)

      return {
        year: Number(item.year),
        type: item.type,
        scope: item.scope,
        source: item.source,
        total: toFiniteNumber(nestedValue.total) ?? toFiniteNumber(item.total),
        retestLineRaw: item.retestLineRaw,
        average: toFiniteNumber(item.average),
        admittedCount: toFiniteNumber(item.admittedCount),
        retestCount: toFiniteNumber(item.retestCount),
        firstChoiceAdmittedCount: toFiniteNumber(item.firstChoiceAdmittedCount),
        transferAdmittedCount: toFiniteNumber(item.transferAdmittedCount),
        admissionRate: toFiniteNumber(item.admissionRate),
        politics: toFiniteNumber(nestedValue.politics) ?? toFiniteNumber(item.politics),
        english: toFiniteNumber(item.english) ?? foreignLanguage,
        foreignLanguage,
        major:
          toFiniteNumber(item.major) ??
          business2 ??
          business1,
        business1,
        business2,
        admittedMinimum: toFiniteNumber(item.admittedMinimum),
        admittedMaximum: toFiniteNumber(item.admittedMaximum),
        admittedMedian: toFiniteNumber(item.admittedMedian),
        subjectStats: item.subjectStats,
        scoreDistribution: item.scoreDistribution,
        official: item.official,
        evidence: item.evidence,
      }
    })
    .filter((item) => Number.isFinite(item.year))
    .sort((left, right) => {
      if (right.year !== left.year) {
        return right.year - left.year
      }

      return (left.type ?? '').localeCompare(right.type ?? '', 'zh-CN')
    })
}

function normalizeConfidence(value: unknown): ConfidenceLevel {
  switch (value) {
    case 'complete':
    case 'high':
      return 'complete'
    case 'partial':
    case 'medium':
      return 'partial'
    case 'limited':
    case 'entryOnly':
      return 'limited'
    default:
      return 'unknown'
  }
}

function normalizeRetest(value: RawRetest): RawRetest {
  const normalizeWeight = (weight: unknown) => {
    if (typeof weight !== 'number' || !Number.isFinite(weight)) return null
    if (weight > 0 && weight <= 1) return weight * 100
    if (weight > 1 && weight <= 100) return weight
    return null
  }

  const normalizeRatio = (ratio: unknown) => {
    if (typeof ratio !== 'number' || !Number.isFinite(ratio)) return null
    if (ratio >= 1 && ratio <= 2) return ratio * 100
    if (ratio >= 100 && ratio <= 300) return ratio
    return null
  }

  return {
    weight: normalizeWeight(value.weight),
    ratio: normalizeRatio(value.ratio),
    codingTest:
      typeof value.codingTest === 'boolean' || typeof value.codingTest === 'string'
        ? value.codingTest
        : null,
    content: value.content,
  }
}

function isStrict11408(examSubjects: string[], fallback: unknown) {
  if (examSubjects.length === 0) return fallback === true

  const subjectText = examSubjects.join(' ')
  return (
    /\b201\b/.test(subjectText) &&
    /\b301\b/.test(subjectText) &&
    /\b408\b/.test(subjectText)
  )
}

function normalizeDirection(value: string) {
  if (!value.trim()) return '方向待核验'

  if (
    /复试细则|拟录取|当前稳定|查询页|需回.*目录|公共课由|摘要已给出/.test(
      value,
    )
  ) {
    return '方向待按官方目录拆分'
  }

  return value
}

function calculateCompleteness(rawUnit: RawSchool['units'][number]) {
  let score = 0
  const direction = normalizeDirection(rawUnit.direction)
  const retest = normalizeRetest(rawUnit.retest)
  const sourceTypes = new Set(rawUnit.sources.map((source) => source.type))
  const hasScoreHistory = rawUnit.scoreHistory.some((item) => {
    const values = [
      item.total,
      item.average,
      item.admittedCount,
      item.value?.total,
    ]
    return values.some((value) => typeof value === 'number' && Number.isFinite(value))
  })

  if (rawUnit.examSubjects.length >= 4) score += 20
  if (rawUnit.latestCatalogYear) score += 5
  if (rawUnit.degreeType.trim()) score += 5
  if (!direction.includes('待')) score += 5

  if (rawUnit.plannedEnrollment !== null) score += 5
  if (rawUnit.recommendationExempt !== null) score += 5
  if (rawUnit.unifiedExamQuota !== null) score += 10
  if (hasScoreHistory) score += 20

  if (retest.weight !== null) score += 5
  if (retest.ratio !== null) score += 5
  if (retest.codingTest !== null) score += 5

  if (rawUnit.tuition !== null) score += 3
  if (
    rawUnit.accommodation &&
    !/待.*核验|待.*复核/.test(rawUnit.accommodation)
  ) {
    score += 2
  }

  if (sourceTypes.has('catalog')) score += 2
  if (sourceTypes.has('retest')) score += 1
  if (sourceTypes.has('admit') || sourceTypes.has('score')) score += 2

  return Math.min(100, score)
}

function createOffering(rawSchool: RawSchool, rawUnit: RawSchool['units'][number], datasetKey: string) {
  const unitId = `${rawSchool.id}::${rawUnit.name}`

  return {
    id: rawUnit.id,
    schoolId: rawSchool.id,
    schoolName: rawSchool.name,
    schoolCity: rawSchool.city,
    schoolProvince: rawSchool.province,
    schoolCategory: rawSchool.category,
    unitId,
    unitName: rawUnit.name,
    unitType: rawUnit.type,
    programCode: rawUnit.programCode,
    programName: rawUnit.programName,
    programKey: `${rawUnit.programCode}-${rawUnit.programName}`,
    degreeType: rawUnit.degreeType,
    direction: normalizeDirection(rawUnit.direction),
    latestCatalogYear: rawUnit.latestCatalogYear,
    examSubjects: rawUnit.examSubjects,
    is11408: isStrict11408(rawUnit.examSubjects, rawUnit.is11408),
    plannedEnrollment: rawUnit.plannedEnrollment,
    recommendationExempt: rawUnit.recommendationExempt,
    unifiedExamQuota: rawUnit.unifiedExamQuota,
    scoreHistory: normalizeScoreHistory(rawUnit.scoreHistory),
    retest: normalizeRetest(rawUnit.retest),
    tuition: rawUnit.tuition,
    accommodation: rawUnit.accommodation,
    employment: rawUnit.employment,
    risks: rawUnit.risks,
    confidence: normalizeConfidence(rawUnit.confidence),
    completeness: calculateCompleteness(rawUnit),
    assessment: rawUnit.assessment,
    sources: rawUnit.sources.map((source) => ({ ...source, datasetKey })),
    datasetKey,
  } satisfies Offering
}

function sortOfferings(offerings: Offering[]) {
  return offerings.sort((left, right) => {
    if (left.programCode !== right.programCode) {
      return left.programCode.localeCompare(right.programCode, 'zh-CN')
    }

    if (left.programName !== right.programName) {
      return left.programName.localeCompare(right.programName, 'zh-CN')
    }

    return left.direction.localeCompare(right.direction, 'zh-CN')
  })
}

function isProfessionalMaster(rawUnit: RawSchool['units'][number]) {
  const programCode = rawUnit.programCode.trim()
  return /^(0854|1452)\d{0,2}$/.test(programCode)
}

function offeringIdentity(offering: Offering) {
  const normalize = (value: string) =>
    value
      .toLocaleLowerCase('zh-CN')
      .replace(/[（）()、，,：:\s]/g, '')

  return [
    normalize(offering.unitName),
    offering.programCode,
    normalize(offering.direction),
  ].join('::')
}

function isRound2Offering(offering: Offering) {
  return offering.datasetKey.startsWith('round2-merged')
}

function mergeScoreHistory(primary: Offering, fallback: Offering) {
  const items = [...primary.scoreHistory]
  const seen = new Set(items.map((item) => `${item.year}::${item.type ?? ''}`))

  for (const item of fallback.scoreHistory) {
    const key = `${item.year}::${item.type ?? ''}`
    if (!seen.has(key)) {
      items.push(item)
      seen.add(key)
    }
  }

  return items.sort((left, right) => right.year - left.year)
}

function mergeOfferings(left: Offering, right: Offering): Offering {
  const primary =
    isRound2Offering(right) && !isRound2Offering(left)
      ? right
      : left
  const fallback = primary === left ? right : left
  const pick = <T,>(value: T, fallbackValue: T) => {
    if (value === null || value === undefined || value === '') return fallbackValue
    if (Array.isArray(value) && value.length === 0) return fallbackValue
    return value
  }
  const sourceMap = new Map(
    [...primary.sources, ...fallback.sources].map((source) => [
      `${source.url}::${source.type}`,
      source,
    ]),
  )

  return {
    ...fallback,
    ...primary,
    examSubjects: pick(primary.examSubjects, fallback.examSubjects),
    plannedEnrollment: pick(primary.plannedEnrollment, fallback.plannedEnrollment),
    recommendationExempt: pick(primary.recommendationExempt, fallback.recommendationExempt),
    unifiedExamQuota: pick(primary.unifiedExamQuota, fallback.unifiedExamQuota),
    scoreHistory: mergeScoreHistory(primary, fallback),
    retest: {
      weight: pick(primary.retest.weight, fallback.retest.weight),
      ratio: pick(primary.retest.ratio, fallback.retest.ratio),
      codingTest: pick(primary.retest.codingTest, fallback.retest.codingTest),
      content: pick(primary.retest.content, fallback.retest.content),
    },
    tuition: pick(primary.tuition, fallback.tuition),
    accommodation: pick(primary.accommodation, fallback.accommodation),
    employment: pick(primary.employment, fallback.employment),
    risks: Array.from(new Set([...primary.risks, ...fallback.risks])),
    sources: Array.from(sourceMap.values()),
    completeness: Math.max(primary.completeness, fallback.completeness),
  }
}

function normalizeSchool(rawSchool: RawSchool, datasetKey: string) {
  const unitMap = new Map<string, UnitGroup>()

  for (const rawUnit of rawSchool.units.filter(isProfessionalMaster)) {
    const offering = createOffering(rawSchool, rawUnit, datasetKey)
    const existing = unitMap.get(offering.unitId)

    if (existing) {
      const duplicate = existing.offerings.some((item) => item.id === offering.id)
      if (!duplicate) {
        existing.offerings.push(offering)
      }
      continue
    }

    unitMap.set(offering.unitId, {
      id: offering.unitId,
      name: offering.unitName,
      type: offering.unitType,
      offerings: [offering],
    })
  }

  const units = Array.from(unitMap.values()).map((unit) => ({
    ...unit,
    offerings: sortOfferings(unit.offerings),
  }))

  units.sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))

  return {
    id: rawSchool.id,
    name: rawSchool.name,
    city: rawSchool.city,
    province: rawSchool.province,
    category: rawSchool.category,
    units,
  } satisfies SchoolEntry
}

function isLegacyPlaceholder(rawUnit: RawSchool['units'][number], datasetKey: string) {
  if (datasetKey.startsWith('round2-merged')) return false

  const text = `${rawUnit.name} ${rawUnit.direction}`
  return /目录查询页中的|另可见.*查询页|复试细则摘要已给出|学院拟录取说明明确|按当年目录与学院复试细则复核|2027推免预报名摘要|复试名单可见/.test(
    text,
  )
}

function loadAdmissionsData(): AdmissionsData {
  const targetSchoolIdSet = new Set<string>(targetSchoolIds)
  const datasetEntries = Object.entries(datasetModules)
    .map(([modulePath, moduleValue]) => ({
      datasetKey: getDatasetKey(modulePath),
      ...moduleValue.default,
    }))
    .sort((left, right) => left.datasetKey.localeCompare(right.datasetKey, 'zh-CN'))

  const schoolMap = new Map<string, SchoolEntry>()
  const allOfferings: Offering[] = []

  for (const dataset of datasetEntries) {
    for (const rawSchool of dataset.schools) {
      if (!targetSchoolIdSet.has(rawSchool.id)) {
        continue
      }
      const normalizedSchool = normalizeSchool(
        {
          ...rawSchool,
          units: rawSchool.units.filter(
            (rawUnit) => !isLegacyPlaceholder(rawUnit, dataset.datasetKey),
          ),
        },
        dataset.datasetKey,
      )
      if (normalizedSchool.units.length === 0) {
        continue
      }
      const existingSchool = schoolMap.get(normalizedSchool.id)

      if (!existingSchool) {
        schoolMap.set(normalizedSchool.id, normalizedSchool)
      } else {
        for (const incomingUnit of normalizedSchool.units) {
          const existingUnit = existingSchool.units.find((unit) => unit.id === incomingUnit.id)
          if (!existingUnit) {
            existingSchool.units.push(incomingUnit)
            continue
          }

          for (const incomingOffering of incomingUnit.offerings) {
            const duplicateIndex = existingUnit.offerings.findIndex(
              (item) =>
                item.id === incomingOffering.id ||
                offeringIdentity(item) === offeringIdentity(incomingOffering),
            )
            if (duplicateIndex === -1) {
              existingUnit.offerings.push(incomingOffering)
            } else {
              existingUnit.offerings[duplicateIndex] = mergeOfferings(
                existingUnit.offerings[duplicateIndex],
                incomingOffering,
              )
            }
          }

          sortOfferings(existingUnit.offerings)
        }

        existingSchool.units.sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))
      }

    }
  }

  const schools = Array.from(schoolMap.values()).sort(
    (left, right) =>
      getTargetSchoolOrder(left.id) - getTargetSchoolOrder(right.id),
  )

  const provinces = Array.from(new Set(schools.map((school) => school.province))).sort((left, right) =>
    left.localeCompare(right, 'zh-CN'),
  )

  for (const school of schools) {
    for (const unit of school.units) {
      allOfferings.push(...unit.offerings)
    }
  }

  const latestGeneratedAt = datasetEntries
    .map((dataset) => dataset.generatedAt)
    .sort((left, right) => right.localeCompare(left))[0] ?? '未知'

  return {
    datasets: datasetEntries.map((dataset) => ({
      datasetKey: dataset.datasetKey,
      generatedAt: dataset.generatedAt,
      scope: dataset.scope,
      dataPolicy: dataset.dataPolicy,
    })),
    schools,
    allOfferings: allOfferings.sort((left, right) => left.schoolName.localeCompare(right.schoolName, 'zh-CN')),
    provinces,
    latestGeneratedAt,
    pendingTop18: targetSchoolIds.some((schoolId) => !schoolMap.has(schoolId)),
  }
}

export const admissionsData = loadAdmissionsData()
