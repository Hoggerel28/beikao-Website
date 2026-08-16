import { useDeferredValue } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Database,
  ExternalLink,
  GraduationCap,
  MapPin,
  Search,
} from 'lucide-react'
import { SourceLinkButton } from '../../components/SourceLinkButton'
import { getSchoolMeta } from '../../data/schoolMeta'
import { formatConfidence, formatCurrency, formatNumber, formatQuota, formatYear, getCompletenessLabel, getCompletenessTone, getConfidenceTone } from '../../lib/format'
import { useAppStore } from '../../store/appStore'
import type { AdmissionsData, Offering, SchoolEntry, UnitGroup } from '../../types/admissions'

interface SchoolPoolPageProps {
  data: AdmissionsData
}

function findSource(offering: Offering, preferredTypes: string[]) {
  return (
    preferredTypes
      .map((type) => offering.sources.find((source) => source.type === type))
      .find(Boolean) ?? offering.sources[0]
  )
}

function matchesSchoolFilters(school: SchoolEntry, search: string, province: string, only11408: boolean, completeness: 'all' | 'ready' | 'review' | 'missing') {
  const searchTarget = [
    school.name,
    school.city,
    school.province,
    school.category,
    ...school.units.flatMap((unit) =>
      unit.offerings.flatMap((offering) => [unit.name, offering.programName, offering.direction]),
    ),
  ]
    .join(' ')
    .toLowerCase()

  if (search && !searchTarget.includes(search)) {
    return false
  }

  if (province !== 'all' && school.province !== province) {
    return false
  }

  if (only11408 && !school.units.some((unit) => unit.offerings.some((offering) => offering.is11408))) {
    return false
  }

  const highestCompleteness = Math.max(...school.units.flatMap((unit) => unit.offerings.map((offering) => offering.completeness)))
  if (completeness === 'ready' && highestCompleteness < 75) return false
  if (completeness === 'review' && (highestCompleteness < 50 || highestCompleteness >= 75)) return false
  if (completeness === 'missing' && highestCompleteness >= 50) return false

  return true
}

function sortSchools(schools: SchoolEntry[], sortBy: 'completeness' | 'alphabet' | 'city') {
  return [...schools].sort((left, right) => {
    if (sortBy === 'alphabet') {
      return left.name.localeCompare(right.name, 'zh-CN')
    }

    if (sortBy === 'city') {
      return `${left.province}${left.city}`.localeCompare(`${right.province}${right.city}`, 'zh-CN')
    }

    const leftCompleteness = Math.max(...left.units.flatMap((unit) => unit.offerings.map((offering) => offering.completeness)))
    const rightCompleteness = Math.max(...right.units.flatMap((unit) => unit.offerings.map((offering) => offering.completeness)))
    return rightCompleteness - leftCompleteness
  })
}

function getUnitById(school: SchoolEntry | undefined, unitId: string | null) {
  if (!school) return undefined
  return school.units.find((item) => item.id === unitId) ?? school.units[0]
}

function getOfferingById(unit: UnitGroup | undefined, offeringId: string | null) {
  if (!unit) return undefined
  return unit.offerings.find((item) => item.id === offeringId) ?? unit.offerings[0]
}

function getProgramScopeNote(school: SchoolEntry | undefined, unit: UnitGroup | undefined) {
  if (school?.id === 'seu' && unit?.name === '计算机科学与工程学院') {
    return '官方目录另含 081200、083500、140500 学硕项目；按你的设置未纳入，当前显示 2 个专硕项目。'
  }

  return null
}

function renderScoreHistory(offering: Offering) {
  if (offering.scoreHistory.length === 0) {
    return <div className="empty-inline">暂无近三年分数，待拟录取名单补充。</div>
  }

  const hasSingleSubjectLines = offering.scoreHistory.some((item) =>
    [item.politics, item.english, item.business1, item.business2].some(
      (value) => value !== undefined,
    ),
  )
  const hasScoreDistribution = offering.scoreHistory.some(
    (item) => item.scoreDistribution && item.scoreDistribution.length > 0,
  )
  const hasRetestCount = offering.scoreHistory.some((item) => item.retestCount !== undefined)
  const hasFirstChoiceCount = offering.scoreHistory.some(
    (item) => item.firstChoiceAdmittedCount !== undefined,
  )
  const hasTransferCount = offering.scoreHistory.some(
    (item) => item.transferAdmittedCount !== undefined,
  )
  const hasAdmissionRate = offering.scoreHistory.some((item) => item.admissionRate !== undefined)
  const evidenceItems = offering.scoreHistory.flatMap((item) => {
    const source =
      typeof item.source === 'string' && item.source.trim()
        ? [`逐年来源：${item.source}`]
        : []
    return [...source, ...(item.evidence ?? [])].map((evidence) => ({
      year: item.year,
      evidence,
      official: item.official,
    }))
  })
  const originLabel = (official: boolean | undefined) =>
    official === true ? '官方' : official === false ? '非官方' : '待核验'
  const originTone = (official: boolean | undefined) =>
    official === true ? 'official' : official === false ? 'unofficial' : 'unknown'

  return (
    <>
      <div className="compact-table-wrap">
        <table className="compact-table">
          <thead>
            <tr>
              <th>年份</th>
              <th>数据性质</th>
              <th>复试线（总分）</th>
              <th>原图线</th>
              <th>录取最低</th>
              <th>录取最高</th>
              <th>录取平均</th>
              <th>中位数</th>
              {hasRetestCount ? <th>复试人数</th> : null}
              {hasFirstChoiceCount ? <th>一志愿录取</th> : null}
              {hasTransferCount ? <th>调剂录取</th> : null}
              <th>录取总数</th>
              {hasAdmissionRate ? <th>录取率</th> : null}
            </tr>
          </thead>
          <tbody>
            {offering.scoreHistory.map((item) => (
              <tr key={`${item.year}-${item.type ?? ''}`}>
                <td>{item.year}</td>
                <td>
                  <span className={`data-origin data-origin--${originTone(item.official)}`}>
                    {originLabel(item.official)}
                  </span>
                </td>
                <td className="highlight-cell">{formatNumber(item.total)}</td>
                <td>{item.retestLineRaw ?? '待核验'}</td>
                <td>{formatNumber(item.admittedMinimum)}</td>
                <td>{formatNumber(item.admittedMaximum)}</td>
                <td>{formatNumber(item.average)}</td>
                <td>{formatNumber(item.admittedMedian)}</td>
                {hasRetestCount ? <td>{formatNumber(item.retestCount)}</td> : null}
                {hasFirstChoiceCount ? <td>{formatNumber(item.firstChoiceAdmittedCount)}</td> : null}
                {hasTransferCount ? <td>{formatNumber(item.transferAdmittedCount)}</td> : null}
                <td>{formatNumber(item.admittedCount)}</td>
                {hasAdmissionRate ? <td>{formatNumber(item.admissionRate, '%')}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="score-scope-list">
        {offering.scoreHistory.map((item) => (
          <div key={`${item.year}-${item.type ?? ''}-scope`}>
            <strong>{item.year}：</strong>
            {item.scope ?? '仅展示已核验字段；空值不作推断。'}
          </div>
        ))}
      </div>
      {hasSingleSubjectLines ? (
        <div className="score-subject-stats">
          <div className="score-subject-stats__title">复试单科线（不等同于总分复试线）</div>
          <div className="compact-table-wrap">
            <table className="compact-table">
              <thead>
                <tr>
                  <th>年份</th>
                  <th>政治</th>
                  <th>外语</th>
                  <th>业务课一</th>
                  <th>业务课二</th>
                </tr>
              </thead>
              <tbody>
                {offering.scoreHistory.map((item) => (
                  <tr key={`${item.year}-single-lines`}>
                    <td>{item.year}</td>
                    <td>{formatNumber(item.politics)}</td>
                    <td>{formatNumber(item.english)}</td>
                    <td>{formatNumber(item.business1)}</td>
                    <td>{formatNumber(item.business2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      {offering.scoreHistory.some((item) => item.subjectStats && Object.keys(item.subjectStats).length > 0) ? (
        <div className="score-subject-stats">
          <div className="score-subject-stats__title">录取各科统计（截图/整理数据）</div>
          <div className="compact-table-wrap">
            <table className="compact-table">
            <thead>
              <tr>
                <th>年份</th>
                <th>科目</th>
                <th>最低</th>
                <th>最高</th>
                <th>平均</th>
                <th>中位数</th>
              </tr>
            </thead>
            <tbody>
              {offering.scoreHistory.flatMap((item) =>
                Object.entries(item.subjectStats ?? {}).map(([subject, stat]) => (
                  <tr key={`${item.year}-${subject}`}>
                    <td>{item.year}</td>
                    <td>{subject}</td>
                    <td>{formatNumber(stat.minimum)}</td>
                    <td>{formatNumber(stat.maximum)}</td>
                    <td>{formatNumber(stat.average)}</td>
                    <td>{formatNumber(stat.median)}</td>
                  </tr>
                )),
              )}
            </tbody>
            </table>
          </div>
        </div>
      ) : null}
      {hasScoreDistribution ? (
        <div className="score-subject-stats">
          <div className="score-subject-stats__title">分数段复试与录取统计</div>
          <div className="compact-table-wrap">
            <table className="compact-table">
              <thead>
                <tr>
                  <th>年份</th>
                  <th>分数段</th>
                  <th>复试人数</th>
                  <th>录取人数</th>
                </tr>
              </thead>
              <tbody>
                {offering.scoreHistory.flatMap((item) =>
                  (item.scoreDistribution ?? []).map((segment) => (
                    <tr key={`${item.year}-${segment.range}`}>
                      <td>{item.year}</td>
                      <td>{segment.range}</td>
                      <td>{formatNumber(segment.retestCount)}</td>
                      <td>{formatNumber(segment.admittedCount)}</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      {evidenceItems.length > 0 ? (
        <div className="score-evidence">
          <div className="score-subject-stats__title">本地证据与口径</div>
          {evidenceItems.map((item) => (
            <div className="score-evidence__item" key={`${item.year}-${item.evidence}`}>
              <span className={`data-origin data-origin--${originTone(item.official)}`}>
                {originLabel(item.official)}
              </span>
              <span>{item.year} · {item.evidence}</span>
            </div>
          ))}
        </div>
      ) : null}
    </>
  )
}

export function SchoolPoolPage({ data }: SchoolPoolPageProps) {
  const schoolFilters = useAppStore((state) => state.schoolFilters)
  const selectedSchoolId = useAppStore((state) => state.selectedSchoolId)
  const selectedUnitId = useAppStore((state) => state.selectedUnitId)
  const selectedOfferingId = useAppStore((state) => state.selectedOfferingId)
  const setSchoolFilters = useAppStore((state) => state.setSchoolFilters)
  const setSelectedSchool = useAppStore((state) => state.setSelectedSchool)
  const setSelectedUnit = useAppStore((state) => state.setSelectedUnit)
  const setSelectedOffering = useAppStore((state) => state.setSelectedOffering)

  const deferredSearch = useDeferredValue(schoolFilters.search.trim().toLowerCase())

  const filteredSchools = sortSchools(
    data.schools.filter((school) =>
      matchesSchoolFilters(
        school,
        deferredSearch,
        schoolFilters.province,
        schoolFilters.only11408,
        schoolFilters.completeness,
      ),
    ),
    schoolFilters.sortBy,
  )

  const selectedSchool =
    filteredSchools.find((item) => item.id === selectedSchoolId) ??
    filteredSchools[0] ??
    data.schools.find((item) => item.id === selectedSchoolId) ??
    data.schools[0]
  const selectedUnit = getUnitById(selectedSchool, selectedUnitId)
  const selectedOffering = getOfferingById(selectedUnit, selectedOfferingId)
  const programOptions = selectedUnit
    ? Array.from(
        new Map(selectedUnit.offerings.map((item) => [item.programKey, item])).values(),
      )
    : []
  const selectedProgramKey = selectedOffering?.programKey ?? programOptions[0]?.programKey
  const directionOptions = selectedUnit
    ? selectedUnit.offerings.filter((item) => item.programKey === selectedProgramKey)
    : []

  const selectSchool = (schoolId: string) => {
    const school = data.schools.find((item) => item.id === schoolId)
    const unit = school?.units[0]
    const offering = unit?.offerings[0]
    setSelectedSchool(schoolId)
    if (unit) setSelectedUnit(unit.id)
    if (offering) setSelectedOffering(offering.id)
  }

  const selectUnit = (unitId: string) => {
    const unit = selectedSchool?.units.find((item) => item.id === unitId)
    const offering = unit?.offerings[0]
    setSelectedUnit(unitId)
    if (offering) setSelectedOffering(offering.id)
  }

  const selectProgram = (programKey: string) => {
    const offering = selectedUnit?.offerings.find((item) => item.programKey === programKey)
    if (offering) {
      setSelectedOffering(offering.id)
    }
  }

  const selectDirection = (offeringId: string) => {
    setSelectedOffering(offeringId)
  }

  return (
    <section className="page page--schools">
      <header className="page__header">
        <div>
          <h1 className="page__title">院校池</h1>
          <p className="page__subtitle">
            仅展示计算机相关专硕，按学校、独立招生单位、专业与方向逐级浏览。
          </p>
        </div>
        <div className="page__meta">
          资料核验时间：{data.latestGeneratedAt}
          {data.pendingTop18 ? ' · 部分院校待补充' : ` · ${data.schools.length} 校已载入`}
        </div>
      </header>

      <div className="toolbar">
        <label className="searchbox">
          <Search size={18} />
          <input
            value={schoolFilters.search}
            onChange={(event) => setSchoolFilters({ search: event.target.value })}
            placeholder="搜索学校、学院、专业或方向"
          />
        </label>

        <label className="toolbar__select">
          <MapPin size={16} />
          <select
            value={schoolFilters.province}
            onChange={(event) => setSchoolFilters({ province: event.target.value })}
          >
            <option value="all">全部地区</option>
            {data.provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
          <ChevronDown size={16} />
        </label>

        <label className="toolbar__checkbox">
          <input
            checked={schoolFilters.only11408}
            type="checkbox"
            onChange={(event) => setSchoolFilters({ only11408: event.target.checked })}
          />
          <span>仅看 11408</span>
        </label>

        <label className="toolbar__select">
          <Database size={16} />
          <select
            value={schoolFilters.completeness}
            onChange={(event) =>
              setSchoolFilters({
                completeness: event.target.value as 'all' | 'ready' | 'review' | 'missing',
              })
            }
          >
            <option value="all">全部完整度</option>
            <option value="ready">数据较完整</option>
            <option value="review">待当年复核</option>
            <option value="missing">缺失较多</option>
          </select>
          <ChevronDown size={16} />
        </label>
      </div>

      <div className="school-layout">
        <aside className="school-list-panel">
          <div className="panel-header">
            <strong>院校列表（{filteredSchools.length}）</strong>
            <select
              className="mini-select"
              value={schoolFilters.sortBy}
              onChange={(event) =>
                setSchoolFilters({
                  sortBy: event.target.value as 'completeness' | 'alphabet' | 'city',
                })
              }
            >
              <option value="completeness">按综合排序</option>
              <option value="alphabet">按学校名称</option>
              <option value="city">按地区排序</option>
            </select>
          </div>

          <div className="school-card-list">
            {filteredSchools.map((school) => {
              const meta = getSchoolMeta(school.id)
              const schoolOfferings = school.units.flatMap((unit) => unit.offerings)
              const previewOffering = [...schoolOfferings].sort(
                (left, right) => right.completeness - left.completeness,
              )[0]
              const has11408 = schoolOfferings.some((offering) => offering.is11408)
              const highestCompleteness = Math.max(
                ...schoolOfferings.map((offering) => offering.completeness),
              )
              const confidenceTone = getConfidenceTone(previewOffering?.confidence ?? 'unknown')
              const completenessTone = getCompletenessTone(highestCompleteness)
              return (
                <button
                  key={school.id}
                  type="button"
                  className={`school-card ${selectedSchool?.id === school.id ? 'is-selected' : ''}`}
                  onClick={() => selectSchool(school.id)}
                >
                  <div
                    className="school-card__avatar"
                    title={meta?.logoOfficial ? '校徽来源：学校官方' : '校徽来源：考研搜（非官方）'}
                  >
                    {meta ? (
                      <img className="school-logo" src={meta.logoUrl} alt={`${school.name}校徽`} />
                    ) : null}
                  </div>
                  <div className="school-card__body">
                    <div className="school-card__topline">
                      <strong>{school.name}</strong>
                      {confidenceTone === 'success' ? <CheckCircle2 size={18} className="tone-success" /> : null}
                      {confidenceTone === 'warning' ? <CircleHelp size={18} className="tone-warning" /> : null}
                    </div>
                    <div className="school-card__meta">
                      {school.province} · {school.city}
                    </div>
                    <div className="school-card__tags">
                      {has11408 ? <span className="pill">11408</span> : null}
                      <span className={`pill pill--${completenessTone}`}>{getCompletenessLabel(highestCompleteness)}</span>
                      <span className="school-card__status">{formatConfidence(previewOffering?.confidence ?? 'unknown')}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="detail-panel">
          {selectedSchool && selectedUnit && selectedOffering ? (
            <>
              <div className="detail-hero">
                <div
                  className="detail-hero__avatar"
                  title={
                    getSchoolMeta(selectedSchool.id)?.logoOfficial
                      ? '校徽来源：学校官方'
                      : '校徽来源：考研搜（非官方）'
                  }
                >
                  {getSchoolMeta(selectedSchool.id) ? (
                    <img
                      className="school-logo"
                      src={getSchoolMeta(selectedSchool.id)?.logoUrl}
                      alt={`${selectedSchool.name}校徽`}
                    />
                  ) : null}
                </div>
                <div className="detail-hero__body">
                  <div className="detail-hero__title-row">
                    <h2>{selectedSchool.name}</h2>
                    <span className="pill">985 / 211</span>
                    {selectedOffering.is11408 ? <span className="pill">11408</span> : null}
                  </div>
                  <div className="detail-hero__meta">
                    <MapPin size={15} />
                    <span>
                      {selectedSchool.province} · {selectedSchool.city}
                    </span>
                    <span>{selectedSchool.category}</span>
                  </div>
                </div>
                <div className={`status-chip status-chip--${getConfidenceTone(selectedOffering.confidence)}`}>
                  {getConfidenceTone(selectedOffering.confidence) === 'success' ? <CheckCircle2 size={16} /> : <CircleHelp size={16} />}
                  <span>{formatConfidence(selectedOffering.confidence)}</span>
                </div>
              </div>

              <div className="detail-selects">
                <label className="detail-select">
                  <span>招生单位</span>
                  <select value={selectedUnit.id} onChange={(event) => selectUnit(event.target.value)}>
                    {selectedSchool.units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="detail-select">
                  <span>专业</span>
                  <select value={selectedProgramKey} onChange={(event) => selectProgram(event.target.value)}>
                    {programOptions.map((option) => (
                      <option key={option.programKey} value={option.programKey}>
                        {option.programCode} {option.programName}
                      </option>
                    ))}
                  </select>
                  {getProgramScopeNote(selectedSchool, selectedUnit) ? (
                    <small className="detail-select__note">
                      {getProgramScopeNote(selectedSchool, selectedUnit)}
                    </small>
                  ) : null}
                </label>

                <label className="detail-select">
                  <span>方向</span>
                  <select value={selectedOffering.id} onChange={(event) => selectDirection(event.target.value)}>
                    {directionOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.direction}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="summary-grid">
                <div className="summary-card">
                  <span>初试科目数</span>
                  <strong>{selectedOffering.examSubjects.length || '待核验'}</strong>
                </div>
                <div className="summary-card">
                    <span>{selectedOffering.latestCatalogYear} 统考名额</span>
                  <strong>{formatQuota(selectedOffering)}</strong>
                </div>
                <div className="summary-card">
                  <span>数据完整度</span>
                  <strong>{selectedOffering.completeness}%</strong>
                </div>
              </div>

              <div className="detail-grid">
                <article className="section-card">
                  <div className="section-card__header">
                    <h3>
                      <GraduationCap size={18} />
                      初试科目
                    </h3>
                    <SourceLinkButton
                      source={findSource(selectedOffering, ['catalog'])}
                      label="初试科目官方来源"
                    />
                  </div>
                  <ol className="bullet-list">
                    {selectedOffering.examSubjects.map((subject) => (
                      <li key={subject}>{subject}</li>
                    ))}
                  </ol>
                </article>

                <article className="section-card">
                  <div className="section-card__header">
                    <h3>
                      <Database size={18} />
                      招生名额
                    </h3>
                    <SourceLinkButton
                      source={findSource(selectedOffering, ['catalog', 'admission'])}
                      label="招生名额官方来源"
                    />
                  </div>
                  <dl className="kv-list">
                    <div>
                      <dt>计划招生</dt>
                      <dd>{formatNumber(selectedOffering.plannedEnrollment, ' 名')}</dd>
                    </div>
                    <div>
                      <dt>推免人数</dt>
                      <dd>{formatNumber(selectedOffering.recommendationExempt, ' 名')}</dd>
                    </div>
                    <div>
                      <dt>统考名额</dt>
                      <dd>{formatNumber(selectedOffering.unifiedExamQuota, ' 名')}</dd>
                    </div>
                    <div>
                      <dt>目录年份</dt>
                      <dd>{formatYear(selectedOffering.latestCatalogYear)}</dd>
                    </div>
                  </dl>
                </article>

                <article className="section-card">
                  <div className="section-card__header">
                    <h3>
                      <CircleHelp size={18} />
                      复试规则
                    </h3>
                    <SourceLinkButton
                      source={findSource(selectedOffering, ['retest'])}
                      label="复试规则官方来源"
                    />
                  </div>
                  <dl className="kv-list">
                    <div>
                      <dt>复试占比</dt>
                      <dd>{formatNumber(selectedOffering.retest.weight, '%')}</dd>
                    </div>
                    <div>
                      <dt>差额比例</dt>
                      <dd>{formatNumber(selectedOffering.retest.ratio, '%')}</dd>
                    </div>
                    <div>
                      <dt>机试</dt>
                      <dd>
                        {selectedOffering.retest.codingTest === null
                          ? '待核验'
                          : typeof selectedOffering.retest.codingTest === 'boolean'
                            ? selectedOffering.retest.codingTest
                              ? '有'
                              : '无'
                            : selectedOffering.retest.codingTest}
                      </dd>
                    </div>
                  </dl>
                  <p className="section-card__note">{selectedOffering.retest.content}</p>
                </article>

                <article className="section-card section-card--wide">
                  <div className="section-card__header">
                    <h3>
                      <Database size={18} />
                      近三年分数
                    </h3>
                    <SourceLinkButton
                      source={findSource(selectedOffering, ['score', 'admit', 'retest'])}
                      label="近三年分数官方来源"
                    />
                  </div>
                  {renderScoreHistory(selectedOffering)}
                </article>

                <article className="section-card">
                  <div className="section-card__header">
                    <h3>
                      <ExternalLink size={18} />
                      培养与就业
                    </h3>
                    <SourceLinkButton
                      source={findSource(selectedOffering, ['college', 'admission'])}
                      label="培养与就业官方来源"
                    />
                  </div>
                  <dl className="kv-list">
                    <div>
                      <dt>学费</dt>
                      <dd>{formatCurrency(selectedOffering.tuition)}</dd>
                    </div>
                    <div>
                      <dt>住宿</dt>
                      <dd>{selectedOffering.accommodation ?? '待核验'}</dd>
                    </div>
                  </dl>
                  <p className="section-card__note">{selectedOffering.employment}</p>
                </article>

                <article className="section-card">
                  <div className="section-card__header">
                    <h3>
                      <AlertTriangle size={18} />
                      风险提示
                    </h3>
                    <SourceLinkButton
                      source={findSource(selectedOffering, ['catalog', 'retest', 'admit'])}
                      label="风险判断依据"
                    />
                  </div>
                  <ul className="bullet-list">
                    {selectedOffering.risks.map((risk) => (
                      <li key={risk}>{risk}</li>
                    ))}
                  </ul>
                </article>

                <article className="section-card section-card--wide">
                  <div className="section-card__header">
                    <h3>
                      <ExternalLink size={18} />
                      来源与证据
                    </h3>
                  </div>
                  <div className="source-list">
                    {selectedOffering.sources.map((source) => (
                      <a key={`${source.id}-${source.url}`} className="source-list__item" href={source.url} target="_blank" rel="noreferrer">
                        <span>{source.label}</span>
                        <span className="source-list__meta">
                          {source.official ? '官方' : '非官方'} <ExternalLink size={14} />
                        </span>
                      </a>
                    ))}
                  </div>
                </article>
              </div>
            </>
          ) : (
            <div className="detail-empty">当前没有可展示的学校数据。</div>
          )}
        </section>
      </div>
    </section>
  )
}
