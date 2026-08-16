export type PlanTone = 'red' | 'black' | 'blue' | 'green' | 'yellow' | 'cyan' | 'purple'

export type SubjectId = 'math' | 'english' | 'politics' | 'cs'

export interface PlanEntry {
  tone: PlanTone
  text: string
}

export interface PlanPhase {
  id: string
  title: string
  dateRange: string
  start: string
  end: string
  hoursPerDay?: number
  hoursPerWeek?: number
  entries: PlanEntry[]
}

export interface SubjectPlan {
  id: SubjectId
  label: string
  shortLabel: string
  accent: PlanTone
  introEntries: PlanEntry[]
  phases: PlanPhase[]
  dailyRuleEntries?: PlanEntry[]
}

export type PlanTab = SubjectId | 'overview'
