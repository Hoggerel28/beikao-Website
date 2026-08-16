import { useRef, useState } from 'react'
import { BookOpen, CalendarRange, Clock3, NotebookPen, ScrollText } from 'lucide-react'
import type { AdmissionsData } from '../../types/admissions'
import { useAppStore } from '../../store/appStore'
import {
  PLAN_START,
  durationForDate,
  monthDates,
  monthKeys,
  subjectPlans,
  totalDailyHours,
} from './planData'
import type { PlanEntry, PlanPhase, PlanTab, SubjectId, SubjectPlan } from './planTypes'

interface PlanPageProps {
  data: AdmissionsData
}

const tabMeta: Array<{ id: PlanTab; label: string; icon: typeof BookOpen }> = [
  { id: 'math', label: '数学一规划', icon: BookOpen },
  { id: 'english', label: '英语一规划', icon: ScrollText },
  { id: 'politics', label: '政治规划', icon: NotebookPen },
  { id: 'cs', label: '408 规划', icon: BookOpen },
  { id: 'overview', label: '月度总览', icon: CalendarRange },
]

const today = new Date().toISOString().slice(0, 10)
const todayMonth = today.slice(0, 7)
const planMonths = monthKeys()
const months = planMonths.includes(todayMonth)
  ? planMonths
  : todayMonth < planMonths[0]
    ? [todayMonth, ...planMonths]
    : [...planMonths, todayMonth]

function formatHours(value?: number) {
  if (value === undefined) return '未注明'
  return Number.isInteger(value) ? `${value}h` : `${value.toFixed(1)}h`
}

function formatDate(date: string) {
  return date.replaceAll('-', '.')
}

function getStageKey(stageId: string) {
  return `stage:${stageId}`
}

function getDailyKey(date: string, subjectId: SubjectId) {
  return `day:${date}:${subjectId}`
}

function parseEnteredHours(value?: string) {
  if (!value?.trim()) return undefined

  const ranges = [
    ...value.matchAll(
      /(\d{1,2})[:：](\d{2})\s*(?:-|—|–|~|～|至)\s*(\d{1,2})[:：](\d{2})/g,
    ),
  ]
  if (ranges.length) {
    const minutes = ranges.reduce((sum, match) => {
      const start = Number(match[1]) * 60 + Number(match[2])
      let end = Number(match[3]) * 60 + Number(match[4])
      if (end <= start) end += 24 * 60
      return sum + end - start
    }, 0)
    return minutes > 0 ? minutes / 60 : undefined
  }

  const hours = [...value.matchAll(/(\d+(?:\.\d+)?)\s*(?:h|小时)/gi)].reduce(
    (sum, match) => sum + Number(match[1]),
    0,
  )
  const minutes = [...value.matchAll(/(\d+(?:\.\d+)?)\s*(?:min|分钟)/gi)].reduce(
    (sum, match) => sum + Number(match[1]),
    0,
  )
  const total = hours + minutes / 60
  return total > 0 ? total : undefined
}

function enteredHoursForSubject(
  drafts: Record<string, string>,
  date: string,
  subjectId: SubjectId,
) {
  return parseEnteredHours(drafts[getDailyKey(date, subjectId)])
}

function enteredHoursForDate(drafts: Record<string, string>, date: string) {
  const values = subjectPlans
    .map((subject) => enteredHoursForSubject(drafts, date, subject.id))
    .filter((value): value is number => value !== undefined)
  return values.length ? values.reduce((sum, value) => sum + value, 0) : undefined
}

function hasEnteredPlan(drafts: Record<string, string>, date: string, subjectId?: SubjectId) {
  if (subjectId) return Boolean(drafts[getDailyKey(date, subjectId)]?.trim())
  return subjectPlans.some((subject) =>
    Boolean(drafts[getDailyKey(date, subject.id)]?.trim()),
  )
}

function phaseLabelForDate(subject: SubjectPlan, date: string) {
  const titles = subject.phases
    .filter((phase) => phase.start <= date && date <= phase.end)
    .map((phase) => phase.title)
  return titles.length ? titles.join(' + ') : '自由安排'
}

function Ink({ tone, children }: { tone: string; children: string }) {
  return <span className={`plan-ink plan-ink--${tone}`}>{children}</span>
}

function PlanEntryLine({ item }: { item: PlanEntry }) {
  return <p className={`plan-entry plan-entry--${item.tone}`}>{item.text}</p>
}

function StageCard({
  stage,
  index,
  drafts,
  setDraft,
}: {
  stage: PlanPhase
  index: number
  drafts: Record<string, string>
  setDraft: (key: string, value: string) => void
}) {
  const stageKey = getStageKey(stage.id)
  const fieldId = `plan-stage-${stage.id}`
  return (
    <article className="plan-stage-card">
      <div className="plan-stage-card__topline">
        <span className="plan-stage-card__index">阶段 {index + 1}</span>
        <span className="plan-stage-card__range">
          {formatDate(stage.start)} → {formatDate(stage.end)}
        </span>
      </div>
      <div className="plan-stage-card__header">
        <div>
          <h3>{stage.title}</h3>
          {stage.hoursPerDay ? (
            <p className="plan-stage-card__time">
              每天 {formatHours(stage.hoursPerDay)} · 每周{' '}
              {stage.hoursPerWeek ? `${stage.hoursPerWeek}h` : '未注明'}
            </p>
          ) : null}
        </div>
        <div className="plan-stage-card__cadence">
          <Clock3 size={16} />
          <span>{stage.dateRange}</span>
        </div>
      </div>
      <div className="plan-stage-card__entries">
        {stage.entries.map((item, entryIndex) => (
          <PlanEntryLine key={`${stage.id}-${entryIndex}-${item.tone}-${item.text}`} item={item} />
        ))}
      </div>
      <label className="plan-field" htmlFor={fieldId}>
        <span>把这段学习放到什么时间？</span>
        <textarea
          id={fieldId}
          rows={2}
          placeholder="例如：06:40 - 08:10 讲义 + 20:00 - 22:00 刷题 / 复盘"
          value={drafts[stageKey] ?? ''}
          onChange={(event) => setDraft(stageKey, event.target.value)}
        />
      </label>
    </article>
  )
}

function SubjectView({
  plan,
  drafts,
  setDraft,
}: {
  plan: SubjectPlan
  drafts: Record<string, string>
  setDraft: (key: string, value: string) => void
}) {
  return (
    <div className="plan-detail">
      <section className="plan-hero">
        <div className="plan-hero__body">
          <div className="plan-entry-stack">
            {plan.introEntries.map((item, entryIndex) => (
              <PlanEntryLine key={`${plan.id}-intro-${entryIndex}-${item.tone}-${item.text}`} item={item} />
            ))}
          </div>
          {plan.dailyRuleEntries?.length ? (
            <div className="plan-entry-stack plan-entry-stack--rule">
              {plan.dailyRuleEntries.map((item, entryIndex) => (
                <PlanEntryLine key={`${plan.id}-rule-${entryIndex}-${item.tone}-${item.text}`} item={item} />
              ))}
            </div>
          ) : null}
        </div>
        <div className="plan-hero__meta">
          <div className="plan-hero__metric">
            <span>阶段数量</span>
            <strong>{plan.phases.length}</strong>
          </div>
          <div className="plan-hero__metric plan-hero__metric--date">
            <span>计划范围</span>
            <strong>{formatDate(plan.phases[0]?.start ?? PLAN_START)} 起</strong>
          </div>
        </div>
      </section>
      <section className="plan-stage-grid" aria-label={`${plan.label}阶段安排`}>
        {plan.phases.map((stage, index) => (
          <StageCard
            key={stage.id}
            stage={stage}
            index={index}
            drafts={drafts}
            setDraft={setDraft}
          />
        ))}
      </section>
    </div>
  )
}

function DayAgenda({
  date,
  drafts,
  setDraft,
}: {
  date: string
  drafts: Record<string, string>
  setDraft: (key: string, value: string) => void
}) {
  const plannedTotalHours = totalDailyHours(date)
  const enteredTotalHours = enteredHoursForDate(drafts, date)
  const weekday = new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(
    new Date(`${date}T00:00:00`),
  )
  return (
    <section className="plan-day-agenda" aria-label={`${date}时间安排`}>
      <div className="plan-day-agenda__header">
        <div>
          <span>当前选择</span>
          <h3>{weekday}</h3>
        </div>
        <div className="plan-day-agenda__total">
          <span>计划总时长</span>
          {plannedTotalHours > 0 ? (
            <strong>{formatHours(plannedTotalHours)} / 天</strong>
          ) : null}
          {enteredTotalHours === undefined ? null : (
            <small>已填写 {formatHours(enteredTotalHours)}</small>
          )}
        </div>
      </div>
      <div className="plan-day-agenda__grid">
        {subjectPlans.map((subject) => {
          const plannedHours = durationForDate(subject, date)
          const enteredHours = enteredHoursForSubject(drafts, date, subject.id)
          const inputId = `plan-${date}-${subject.id}`
          return (
            <article key={subject.id} className={`plan-agenda-subject plan-agenda-subject--${subject.id}`}>
              <div className="plan-agenda-subject__header">
                <div>
                  <span>{subject.label}</span>
                  <h4>{phaseLabelForDate(subject, date)}</h4>
                </div>
                <div className="plan-agenda-subject__hours">
                  {plannedHours > 0 ? (
                    <strong>计划 {formatHours(plannedHours)} / 天</strong>
                  ) : null}
                  {enteredHours === undefined ? null : (
                    <small>已填写 {formatHours(enteredHours)}</small>
                  )}
                </div>
              </div>
              <label className="plan-agenda-subject__field" htmlFor={inputId}>
                <span>我的学习时段与内容</span>
                <input
                  id={inputId}
                  type="text"
                  aria-label={`${date} ${subject.label} 计划时段`}
                  placeholder="如 07:00 - 09:00"
                  value={drafts[getDailyKey(date, subject.id)] ?? ''}
                  onChange={(event) => setDraft(getDailyKey(date, subject.id), event.target.value)}
                />
              </label>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function monthDefaultDate(month: string, drafts: Record<string, string>) {
  const dates = monthDates(month)
  return (
    dates.find((date) => hasEnteredPlan(drafts, date) || totalDailyHours(date) > 0) ??
    dates[0]
  )
}

function MonthCalendar({
  month,
  selectedDate,
  drafts,
  onSelect,
}: {
  month: string
  selectedDate: string
  drafts: Record<string, string>
  onSelect: (date: string) => void
}) {
  const dates = monthDates(month)
  const firstWeekday = (new Date(`${dates[0]}T00:00:00`).getDay() + 6) % 7
  const cells: Array<string | null> = [...Array.from({ length: firstWeekday }, () => null), ...dates]
  const weekLabels = ['一', '二', '三', '四', '五', '六', '日']

  return (
    <div className="plan-calendar">
      <div className="plan-calendar__weekdays" aria-hidden="true">
        {weekLabels.map((label) => (
          <span key={label}>周{label}</span>
        ))}
      </div>
      <div className="plan-calendar__grid">
        {cells.map((date, index) =>
          date ? (
            <button
              key={date}
              type="button"
              className={`plan-calendar-day ${date === today ? 'is-today' : ''} ${
                selectedDate === date ? 'is-selected' : ''
              }`}
              aria-pressed={selectedDate === date}
              aria-current={date === today ? 'date' : undefined}
              aria-label={`${formatDate(date)}，${
                totalDailyHours(date) > 0
                  ? `计划合计 ${formatHours(totalDailyHours(date))}`
                  : '暂无明确计划时长'
              }，${
                hasEnteredPlan(drafts, date) ? '已填写安排' : '暂无填写'
              }`}
              onClick={() => onSelect(date)}
            >
              <span className="plan-calendar-day__number">{Number(date.slice(-2))}</span>
              <span className="plan-calendar-day__hours">
                {totalDailyHours(date) > 0 ? formatHours(totalDailyHours(date)) : ''}
              </span>
              <span className="plan-calendar-day__dots" aria-hidden="true">
                {subjectPlans.map((subject) =>
                  durationForDate(subject, date) > 0 ? (
                    <i key={subject.id} className={`plan-calendar-dot plan-calendar-dot--${subject.id}`} />
                  ) : null,
                )}
              </span>
            </button>
          ) : (
            <span key={`empty-${index}`} className="plan-calendar-day plan-calendar-day--empty" />
          ),
        )}
      </div>
    </div>
  )
}

function OverviewView({
  drafts,
  setDraft,
}: {
  drafts: Record<string, string>
  setDraft: (key: string, value: string) => void
}) {
  const agendaAnchorRef = useRef<HTMLDivElement>(null)
  const [activeMonth, setActiveMonth] = useState(todayMonth)
  const [selectedDate, setSelectedDate] = useState(today)

  const selectMonth = (month: string) => {
    setActiveMonth(month)
    setSelectedDate(monthDefaultDate(month, drafts))
  }

  const selectToday = () => {
    setActiveMonth(todayMonth)
    setSelectedDate(today)
    window.setTimeout(() => {
      agendaAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  return (
    <div className="plan-detail">
      <section className="plan-card">
        <div className="plan-card__header">
          <h3>月份切换</h3>
          <button type="button" className="plan-today-button" onClick={selectToday}>
            <CalendarRange size={15} />
            今天安排
          </button>
        </div>
        <div className="plan-option-list" role="tablist" aria-label="月度总览月份">
          {months.map((month) => (
            <button
              key={month}
              type="button"
              className={`plan-option-button ${month === activeMonth ? 'is-active' : ''}`}
              aria-pressed={month === activeMonth}
              onClick={() => selectMonth(month)}
            >
              {month}
            </button>
          ))}
        </div>
      </section>
      <section className="plan-calendar-card" aria-label={`${activeMonth}日历`}>
        <div className="plan-card__header">
          <h3>{activeMonth} 月历</h3>
          <Ink tone="red">红色日期为当前选中日</Ink>
        </div>
        <MonthCalendar
          month={activeMonth}
          selectedDate={selectedDate}
          drafts={drafts}
          onSelect={setSelectedDate}
        />
        <div ref={agendaAnchorRef} className="plan-day-agenda-anchor">
          <DayAgenda date={selectedDate} drafts={drafts} setDraft={setDraft} />
        </div>
      </section>
    </div>
  )
}

export function PlanPage(_props: PlanPageProps) {
  const [activeTab, setActiveTab] = useState<PlanTab>('math')
  const drafts = useAppStore((state) => state.planDrafts)
  const setDraft = useAppStore((state) => state.setPlanDraft)
  const activePlan = subjectPlans.find((subject) => subject.id === activeTab)

  return (
    <section className="page page--plan">
      <header className="page__header">
        <h1 className="page__title">备考计划</h1>
      </header>

      <section className="plan-card">
        <div className="plan-card__header">
          <h2>计划切换</h2>
        </div>
        <div className="plan-option-list plan-option-list--primary" role="tablist" aria-label="备考计划选项">
          {tabMeta.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`plan-option-button plan-option-button--primary ${activeTab === id ? 'is-active' : ''}`}
              aria-pressed={activeTab === id}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="plan-card plan-card--legend">
        <div className="plan-card__header">
          <h2>颜色说明</h2>
        </div>
        <div className="plan-ink-list">
          <Ink tone="red">红色：日期</Ink>
          <Ink tone="black">黑色：正文</Ink>
          <Ink tone="blue">蓝色：阶段任务</Ink>
          <Ink tone="green">绿色：配套资料及进度要求</Ink>
          <Ink tone="yellow">黄色：每天/每周时长要求</Ink>
          <Ink tone="cyan">青色：阶段内时间分配</Ink>
          <Ink tone="purple">紫色：正文强调</Ink>
        </div>
      </section>

      {activeTab === 'overview' ? (
        <OverviewView drafts={drafts} setDraft={setDraft} />
      ) : activePlan ? (
        <SubjectView plan={activePlan} drafts={drafts} setDraft={setDraft} />
      ) : null}
    </section>
  )
}
