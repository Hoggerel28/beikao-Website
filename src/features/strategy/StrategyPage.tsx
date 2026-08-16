import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Settings2,
  Trash2,
} from 'lucide-react'
import { SourceLinkButton } from '../../components/SourceLinkButton'
import { formatCurrency, formatQuota } from '../../lib/format'
import { defaultWeights } from '../../lib/scoring'
import { useAppStore } from '../../store/appStore'
import type { AdmissionsData, Offering, ScoreResult, ScoreWeights } from '../../types/admissions'
import {
  clampEstimatedTotal,
  collectStrategyPoolScoreStats,
  DEFAULT_ESTIMATED_TOTAL,
  MAX_ESTIMATED_TOTAL,
  MIN_ESTIMATED_TOTAL,
  scoreStrategyOffering,
} from './strategyScore'

interface StrategyPageProps {
  data: AdmissionsData
}

interface RankedOffering {
  offering: Offering
  score: ScoreResult
}

const estimatedTotalStorageKey = 'strategy-estimated-total'

const weightLabels: Record<keyof ScoreWeights, string> = {
  examMatch: '科目匹配',
  seatStability: '名额稳定',
  scoreReachability: '分数可达',
  retestRisk: '复试风险',
  directionFit: '方向匹配',
  regionEmployment: '地域就业',
  personalPreference: '个人偏好',
}

function findSource(offering: Offering | undefined, preferredTypes: string[]) {
  if (!offering) return undefined
  return (
    preferredTypes
      .map((type) => offering.sources.find((source) => source.type === type))
      .find(Boolean) ?? offering.sources[0]
  )
}

function sourceTypesForCompareRow(label: string) {
  switch (label) {
    case '初试科目':
    case '统考名额':
      return ['catalog', 'admission']
    case '近三年复试线':
      return ['score', 'retest', 'admit']
    case '拟录取分数':
      return ['admit', 'score']
    case '复试占比':
    case '机试':
      return ['retest']
    case '学费与住宿':
      return ['admission', 'catalog']
    case '地域就业':
      return ['college', 'admission']
    default:
      return ['catalog', 'retest', 'admit']
  }
}

function sortRankedOfferings(items: RankedOffering[], sortBy: 'score' | 'coverage' | 'alphabet') {
  return [...items].sort((left, right) => {
    if (sortBy === 'coverage') {
      return right.score.coverage - left.score.coverage
    }

    if (sortBy === 'alphabet') {
      return `${left.offering.schoolName}${left.offering.programName}`.localeCompare(
        `${right.offering.schoolName}${right.offering.programName}`,
        'zh-CN',
      )
    }

    const leftScore = left.score.total ?? 0
    const rightScore = right.score.total ?? 0
    return rightScore - leftScore
  })
}

function clampWeight(value: string) {
  const nextValue = Number(value)
  if (Number.isNaN(nextValue)) return 0
  return Math.max(0, Math.min(40, nextValue))
}

function readStoredEstimatedTotal() {
  if (typeof window === 'undefined') return DEFAULT_ESTIMATED_TOTAL

  const storedValue = window.localStorage.getItem(estimatedTotalStorageKey)
  if (storedValue === null) return DEFAULT_ESTIMATED_TOTAL

  return clampEstimatedTotal(Number(storedValue))
}

function formatSubjects(offering: Offering) {
  return offering.examSubjects.length ? offering.examSubjects.join(' / ') : '待核验'
}

function formatRetest(offering: Offering) {
  const sections: string[] = []
  if (offering.retest.weight !== null) sections.push(`复试占比 ${offering.retest.weight}%`)
  if (offering.retest.ratio !== null) sections.push(`差额 ${offering.retest.ratio}%`)
  if (offering.retest.codingTest !== null) {
    const codingTest =
      typeof offering.retest.codingTest === 'boolean'
        ? offering.retest.codingTest
          ? '有'
          : '无'
        : offering.retest.codingTest
    sections.push(`机试 ${codingTest}`)
  }
  return sections.length ? sections.join(' · ') : '待核验'
}

function compareCell(label: string, offering: Offering | undefined) {
  if (!offering) {
    return <span className="compare-empty-cell">待选择</span>
  }

  switch (label) {
    case '初试科目':
      return <span>{formatSubjects(offering)}</span>
    case '统考名额':
      return <span>{formatQuota(offering)}</span>
    case '近三年复试线':
      return (
        <span>
          {offering.scoreHistory.length
            ? offering.scoreHistory.map((item) => `${item.year}:${item.total ?? '待核验'}`).join(' / ')
            : '待核验'}
        </span>
      )
    case '拟录取分数':
      return (
        <span>
          {offering.scoreHistory.length
            ? offering.scoreHistory.map((item) => `${item.year}:${item.average ?? '待核验'}`).join(' / ')
            : '待核验'}
        </span>
      )
    case '复试占比':
      return <span>{formatRetest(offering)}</span>
    case '机试':
      return (
        <span>
          {offering.retest.codingTest === null
            ? '待核验'
            : typeof offering.retest.codingTest === 'boolean'
              ? offering.retest.codingTest
                ? '有'
                : '无'
              : offering.retest.codingTest}
        </span>
      )
    case '学费与住宿':
      return (
        <span>
          {formatCurrency(offering.tuition)} / {offering.accommodation ?? '待核验'}
        </span>
      )
    case '地域就业':
      return <span>{offering.employment}</span>
    case '风险点':
      return <span>{offering.risks[0] ?? '待补充'}</span>
    default:
      return <span>待核验</span>
  }
}

export function StrategyPage({ data }: StrategyPageProps) {
  const schoolFilters = useAppStore((state) => state.schoolFilters)
  const strategyFilters = useAppStore((state) => state.strategyFilters)
  const compareSlots = useAppStore((state) => state.compareSlots)
  const weights = useAppStore((state) => state.weights)
  const addCompare = useAppStore((state) => state.addCompare)
  const removeCompare = useAppStore((state) => state.removeCompare)
  const setCompareSlot = useAppStore((state) => state.setCompareSlot)
  const setStrategyFilters = useAppStore((state) => state.setStrategyFilters)
  const setWeight = useAppStore((state) => state.setWeight)
  const resetWeights = useAppStore((state) => state.resetWeights)

  const [showWeightEditor, setShowWeightEditor] = useState(false)
  const [estimatedTotal, setEstimatedTotal] = useState(readStoredEstimatedTotal)
  const [estimatedTotalInput, setEstimatedTotalInput] = useState(() => String(readStoredEstimatedTotal()))
  const weightTotal = Object.values(weights).reduce((sum, value) => sum + value, 0)

  const poolScoreStats = useMemo(() => collectStrategyPoolScoreStats(data), [data])

  const commitEstimatedTotal = (nextValue: number) => {
    const clampedValue = clampEstimatedTotal(nextValue)
    setEstimatedTotal(clampedValue)
    setEstimatedTotalInput(String(clampedValue))

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(estimatedTotalStorageKey, String(clampedValue))
    }
  }

  const scoredOfferings = useMemo(
    () =>
      data.allOfferings.map((offering) => ({
        offering,
        score: scoreStrategyOffering(
          offering,
          weights,
          schoolFilters.province,
          estimatedTotal,
          poolScoreStats,
        ),
      })),
    [data, estimatedTotal, poolScoreStats, schoolFilters.province, weights],
  )
  const bucketCounts = useMemo(
    () =>
      scoredOfferings.reduce(
        (counts, item) => {
          counts[item.score.bucket] += 1
          return counts
        },
        { 冲刺: 0, 主攻: 0, 保底: 0 } as Record<'冲刺' | '主攻' | '保底', number>,
      ),
    [scoredOfferings],
  )
  const rankedOfferings = useMemo(
    () =>
      sortRankedOfferings(
        scoredOfferings.filter((item) =>
          strategyFilters.bucket === 'all' ? true : item.score.bucket === strategyFilters.bucket,
        ),
        strategyFilters.sortBy,
      ),
    [scoredOfferings, strategyFilters.bucket, strategyFilters.sortBy],
  )

  const totalPages = Math.max(1, Math.ceil(rankedOfferings.length / strategyFilters.pageSize))
  const currentPage = Math.min(strategyFilters.page, totalPages)
  const pageStart = (currentPage - 1) * strategyFilters.pageSize
  const pagedRankings = rankedOfferings.slice(pageStart, pageStart + strategyFilters.pageSize)
  const selectedCompareOfferings = useMemo(
    () =>
      compareSlots.map((slot) => data.allOfferings.find((offering) => offering.id === slot)),
    [compareSlots, data.allOfferings],
  )

  return (
    <section className="page page--strategy">
      <header className="page__header">
        <div>
          <h1 className="page__title">冲稳保</h1>
          <p className="page__subtitle">
            仅比较计算机相关专硕。当前画像：211 计算机科班 · 11408 · 目标 985；“保底”不等于稳录。
          </p>
        </div>
        <div className="page__actions">
          <button className="ghost-button" type="button" onClick={() => setShowWeightEditor((value) => !value)}>
            <Settings2 size={16} />
            设置权重
          </button>
        </div>
      </header>

      {showWeightEditor ? (
        <div className="weight-editor">
          {(
            Object.entries(weights) as Array<[keyof ScoreWeights, number]>
          ).map(([key, value]) => (
            <label key={key} className="weight-editor__item">
              <span>
                {weightLabels[key]}
                {defaultWeights[key] === value ? '' : ' *'}
              </span>
              <input
                type="number"
                min={0}
                max={40}
                value={value}
                onChange={(event) => setWeight(key, clampWeight(event.target.value))}
              />
            </label>
          ))}
          <button className="text-button" type="button" onClick={() => resetWeights()}>
            恢复默认权重
          </button>
          <div className={`weight-total ${weightTotal === 100 ? '' : 'is-warning'}`}>
            权重合计 {weightTotal}
          </div>
        </div>
      ) : null}

      <section className="strategy-estimator" aria-labelledby="strategy-estimator-title">
        <div className="strategy-estimator__summary">
          <div>
            <h2 id="strategy-estimator-title">自估总分</h2>
            <p>分数可达性、冲稳保分档和综合排名都按当前估分实时重算。</p>
          </div>
          <div className="strategy-estimator__value" aria-live="polite">
            <strong>{estimatedTotal}</strong>
            <span>当前分数</span>
          </div>
        </div>

        <div className="strategy-estimator__controls">
          <label className="strategy-estimator__slider">
            <span>拖动调节</span>
            <input
              type="range"
              min={MIN_ESTIMATED_TOTAL}
              max={MAX_ESTIMATED_TOTAL}
              value={estimatedTotal}
              onChange={(event) => commitEstimatedTotal(Number(event.target.value))}
              aria-label="自估总分滑块"
            />
            <div className="strategy-estimator__range">
              <span>{MIN_ESTIMATED_TOTAL}</span>
              <span>{MAX_ESTIMATED_TOTAL}</span>
            </div>
          </label>

          <label className="strategy-estimator__number">
            <span>手动输入</span>
            <input
              type="number"
              min={MIN_ESTIMATED_TOTAL}
              max={MAX_ESTIMATED_TOTAL}
              step={1}
              value={estimatedTotalInput}
              onChange={(event) => {
                const nextValue = event.target.value
                setEstimatedTotalInput(nextValue)

                if (nextValue.trim() === '') return

                const parsedValue = Number(nextValue)
                if (!Number.isFinite(parsedValue)) return

                const clampedValue = clampEstimatedTotal(parsedValue)
                setEstimatedTotal(clampedValue)

                if (typeof window !== 'undefined') {
                  window.localStorage.setItem(estimatedTotalStorageKey, String(clampedValue))
                }
              }}
              onBlur={() =>
                commitEstimatedTotal(
                  estimatedTotalInput.trim() === '' ? estimatedTotal : Number(estimatedTotalInput),
                )
              }
              aria-label="自估总分输入框"
            />
          </label>

          <div className="strategy-estimator__buckets">
            <span>冲刺 {bucketCounts.冲刺}</span>
            <span>主攻 {bucketCounts.主攻}</span>
            <span>保底 {bucketCounts.保底}</span>
          </div>
        </div>
      </section>

      <div className="strategy-toolbar">
        <div className="strategy-toolbar__tabs">
          {(['all', '冲刺', '主攻', '保底'] as const).map((bucket) => (
            <button
              key={bucket}
              type="button"
              className={`chip-button ${strategyFilters.bucket === bucket ? 'is-active' : ''}`}
              onClick={() => setStrategyFilters({ bucket, page: 1 })}
            >
              {bucket === 'all' ? '全部' : bucket}
            </button>
          ))}
        </div>

        <label className="toolbar__select">
          <Filter size={16} />
          <select
            value={strategyFilters.sortBy}
            onChange={(event) =>
              setStrategyFilters({
                sortBy: event.target.value as 'score' | 'coverage' | 'alphabet',
                page: 1,
              })
            }
          >
            <option value="score">综合评分</option>
            <option value="coverage">覆盖率</option>
            <option value="alphabet">学校名称</option>
          </select>
        </label>

        <div className="weights-summary">
          <span>估分 {estimatedTotal}</span>
          <span>科目 {weights.examMatch}</span>
          <span>名额 {weights.seatStability}</span>
          <span>分数 {weights.scoreReachability}</span>
          <span>复试 {weights.retestRisk}</span>
          <span>方向 {weights.directionFit}</span>
          <span>地域 {weights.regionEmployment}</span>
          <span>偏好 {weights.personalPreference}</span>
        </div>
      </div>

      <div className="table-card">
        <table className="rank-table">
          <thead>
            <tr>
              <th>排名</th>
              <th>学校 / 招生单位</th>
              <th>专业 / 方向</th>
              <th>覆盖率</th>
              <th>统考名额</th>
              <th>分数可达性</th>
              <th>复试风险</th>
              <th>综合评分</th>
              <th>定位</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {pagedRankings.map((item, index) => {
              const globalRank = pageStart + index + 1
              const inCompare = compareSlots.includes(item.offering.id)
              const compareFull = !inCompare && compareSlots.every((slot) => slot !== null)
              return (
                <tr key={item.offering.id}>
                  <td className="rank-index">{globalRank}</td>
                  <td>
                    <strong>{item.offering.schoolName}</strong>
                    <div className="row-subtext">{item.offering.unitName}</div>
                  </td>
                  <td>
                    <div>{item.offering.programName}</div>
                    <div className="row-subtext rank-direction" title={item.offering.direction}>
                      {item.offering.direction}
                    </div>
                  </td>
                  <td>
                    <div className="inline-progress">
                      <span>{item.score.coverage}%</span>
                      <div className="progress progress--thin">
                        <div className="progress__bar" style={{ width: `${item.score.coverage}%` }} />
                      </div>
                    </div>
                  </td>
                  <td>{formatQuota(item.offering)}</td>
                  <td className="tone-warning">{item.score.attainabilityLabel}</td>
                  <td className="tone-warning">{item.score.riskLabel}</td>
                  <td>
                    <div className="inline-progress">
                      <strong>{item.score.total ?? '待核验'}</strong>
                      <div className="progress progress--thin">
                        <div className="progress__bar" style={{ width: `${item.score.total ?? 0}%` }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`bucket bucket--${item.score.bucket}`}>{item.score.bucket}</span>
                  </td>
                  <td>
                    <button
                      className="text-button"
                      type="button"
                      disabled={compareFull}
                      onClick={() => (inCompare ? removeCompare(item.offering.id) : addCompare(item.offering.id))}
                    >
                      {inCompare ? <Trash2 size={15} /> : <Plus size={15} />}
                      {inCompare ? '移出对比' : compareFull ? '4 项已满' : '加入对比'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="table-footer">
          <div>共 {rankedOfferings.length} 条，当前按自估 {estimatedTotal} 分重排</div>
          <div className="pagination">
            <button
              className="icon-button"
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setStrategyFilters({ page: currentPage - 1 })}
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              {currentPage} / {totalPages}
            </span>
            <button
              className="icon-button"
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setStrategyFilters({ page: currentPage + 1 })}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <section className="compare-card">
        <div className="compare-card__header">
          <h2>招生项目对比</h2>
          <p>最多 4 项。空槽默认保留，便于后续直接补选。</p>
        </div>

        <div className="compare-grid">
          <div className="compare-grid__head compare-grid__head--label">字段</div>
          {selectedCompareOfferings.map((offering, index) => (
            <div key={`compare-head-${index}`} className="compare-grid__head">
              <div className="compare-slot__badge">{index + 1}</div>
              <div className="compare-slot__controls">
                <select
                  value={offering?.id ?? ''}
                  onChange={(event) => setCompareSlot(index, event.target.value || null)}
                >
                  <option value="">选择一个招生项目</option>
                  {data.allOfferings.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.schoolName} / {option.unitName} / {option.programName} / {option.direction}
                    </option>
                  ))}
                </select>
                {offering ? (
                  <button className="icon-button" type="button" onClick={() => setCompareSlot(index, null)}>
                    <Trash2 size={15} />
                  </button>
                ) : null}
              </div>
              {offering ? (
                <div className="compare-slot__title">
                  <strong>{offering.schoolName}</strong>
                  <span>
                    {offering.unitName} / {offering.programName}
                  </span>
                </div>
              ) : (
                <div className="compare-slot__empty">选择一个招生项目</div>
              )}
            </div>
          ))}

          {[
            '初试科目',
            '统考名额',
            '近三年复试线',
            '拟录取分数',
            '复试占比',
            '机试',
            '学费与住宿',
            '地域就业',
            '风险点',
          ].map((label) => (
            <div className="compare-grid__row" key={label}>
              <div className="compare-grid__label">{label}</div>
              {selectedCompareOfferings.map((offering, index) => (
                <div key={`${label}-${index}`} className="compare-grid__cell">
                  <div className="compare-grid__cell-content">
                    {compareCell(label, offering)}
                    <SourceLinkButton
                      source={findSource(offering, sourceTypesForCompareRow(label))}
                      label={`${label} 官方来源`}
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="compare-card__footer">
          <span>注：第三方字段均标“非官方”；目录、推免后名额和录取结果仍以学校当年文件为准。</span>
          <span>覆盖率高：≥80% · 中：50%-79% · 低：&lt;50%</span>
        </div>
      </section>
    </section>
  )
}
