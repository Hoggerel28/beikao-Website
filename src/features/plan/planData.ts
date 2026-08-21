import type { PlanEntry, SubjectId, SubjectPlan } from './planTypes'

export const PLAN_START = '2026-09-07'
export const PLAN_END = '2027-12-31'

function entry(tone: PlanEntry['tone'], text: string): PlanEntry {
  return { tone, text }
}

export const subjectPlans: SubjectPlan[] = [
  {
    id: 'math',
    label: '数学一',
    shortLabel: '数学',
    accent: 'blue',
    introEntries: [
      entry('blue', '基础 → 强化 → 大观 → 刷题冲刺'),
      entry('green', '没咋了基础：强化讲义'),
      entry('green', '张宇30讲（当字典用）'),
      entry('green', '880、900'),
      entry('green', '套卷（实体书/电子版）'),
      entry('green', '真题（真题网）、李艳芳真题解析'),
      entry('green', '答题卡'),
    ],
    phases: [
      {
        id: 'math-foundation',
        title: '高数基础',
        dateRange: '75天',
        start: '2026-09-07',
        end: '2026-11-21',
        hoursPerDay: 3,
        hoursPerWeek: 20,
        entries: [
          entry('black', '没咋了基础课，视频+讲义'),
          entry('black', '最后一周复习差不多，开启下一阶段'),
          entry('green', '600题高数部分'),
        ],
      },
      {
        id: 'math-linear',
        title: '线代基础‑强化',
        dateRange: '60天',
        start: '2026-11-22',
        end: '2027-01-22',
        hoursPerDay: 3,
        hoursPerWeek: 20,
        entries: [
          entry('cyan', '70% 时间'),
          entry('black', '没咋了基础、强化'),
          entry('green', '600题线代部分，880线代部分（基础→综合）'),
          entry('cyan', '30% 时间'),
          entry('green', '地毯式复习高数基础讲义，600错题二刷'),
        ],
      },
      {
        id: 'math-advanced',
        title: '高数强化',
        dateRange: '60天',
        start: '2027-01-23',
        end: '2027-03-23',
        hoursPerDay: 6,
        hoursPerWeek: 36,
        entries: [
          entry('cyan', '70% 时间'),
          entry('black', '强化课+讲义，补充对应专题靶向补缺'),
          entry('black', '反常积分：阿赞学长，中值定理：ep，无穷级数：张风儿'),
          entry('black', '曲线曲面积分：ep/李艳芳'),
          entry('green', '880高数（基础→强化）'),
          entry('cyan', '30% 时间'),
          entry('green', '复习线代强化讲义（二刷）'),
          entry('green', '880线代部分（二刷复盘，没做完的综合篇可以继续做）'),
        ],
      },
      {
        id: 'math-probability',
        title: '概率论基础‑强化',
        dateRange: '30天',
        start: '2027-03-24',
        end: '2027-04-24',
        hoursPerDay: 4,
        hoursPerWeek: 25,
        entries: [
          entry('cyan', '50%时间'),
          entry('black', '概率论基础过完直接开强化'),
          entry('green', '600概率论部分，880概率（基础→综合）'),
          entry('green', '600（此处全部刷完）'),
          entry('cyan', '50%时间'),
          entry('black', '高数线代复习'),
          entry('green', '高数强化（二刷），线代强化（三刷）'),
          entry('green', '880（以复刷对应部分为主，有余力再接着做）'),
          entry('green', '880（此处至少刷完90%）'),
        ],
      },
      {
        id: 'math-review',
        title: '大观阶段',
        dateRange: '30天',
        start: '2027-04-25',
        end: '2027-05-25',
        hoursPerDay: 4,
        hoursPerWeek: 25,
        entries: [
          entry('purple', '过牢宇大观三部曲，形成自己固定的做题套路'),
          entry('green', '880错题好题（复刷），强化→基础讲义（选择性复刷）'),
        ],
      },
      {
        id: 'math-900',
        title: '900阶段',
        dateRange: '75天',
        start: '2027-05-26',
        end: '2027-08-10',
        hoursPerDay: 4,
        hoursPerWeek: 25,
        entries: [
          entry('green', '刷900 a.b部分（先a后b，c篇丢掉）'),
          entry('black', '针对性复盘讲义，880错题，保持手感，学900题思路'),
        ],
      },
      {
        id: 'math-mock',
        title: '套题阶段（先真题 后模拟卷）',
        dateRange: '约100天',
        start: '2027-08-15',
        end: PLAN_END,
        hoursPerDay: 4,
        hoursPerWeek: 25,
        entries: [
          entry('yellow', '周一‑周四 一天一套，保证整套2.5h完成，当天做完当天复盘总结'),
          entry('black', '周五复习全部的基础、强化部分（速过）'),
          entry('green', '周六、复刷900题 好题思路，880错题好题复刷'),
        ],
      },
    ],
  },
  {
    id: 'english',
    label: '英语一',
    shortLabel: '英语',
    accent: 'red',
    introEntries: [
      entry('blue', '单词 + 真题'),
      entry('green', '红宝书+不背app'),
      entry('green', '真题（真题网）'),
      entry('green', '作文素材（真题网）'),
    ],
    phases: [
      {
        id: 'english-vocab',
        title: '单词',
        dateRange: '全程',
        start: PLAN_START,
        end: PLAN_END,
        hoursPerDay: 0.5,
        entries: [
          entry('purple', '每天都要背，绝不允许断！'),
          entry('yellow', '一天50新词+复习旧词'),
        ],
      },
      {
        id: 'english-reading',
        title: '阅读',
        dateRange: '5月开—做完',
        start: '2027-05-01',
        end: PLAN_END,
        hoursPerDay: 1,
        entries: [
          entry('black', '一天一部精读+精翻（可先做英一再做英二）'),
          entry('black', '后日加入新题型训练'),
          entry('black', '做不动可改成对应语法课帮助精翻'),
        ],
      },
      {
        id: 'english-writing',
        title: '作文',
        dateRange: '10月开始积累',
        start: '2027-10-01',
        end: PLAN_END,
        hoursPerDay: 0.5,
        entries: [
          entry('black', '先小作文后大作文最后一起背'),
        ],
      },
    ],
  },
  {
    id: 'politics',
    label: '政治',
    shortLabel: '政治',
    accent: 'green',
    introEntries: [
      entry('blue', '以刷带学（类似科目一）'),
      entry('green', '小程序(南山)'),
      entry('green', '肖4 肖8'),
    ],
    phases: [
      {
        id: 'politics-start',
        title: '以刷带学',
        dateRange: '9月开始',
        start: '2027-09-01',
        end: PLAN_END,
        hoursPerDay: 0.5,
        entries: [
          entry('black', '9月看徐涛强化课马原部分（当作晚上做不得之后的放松）'),
          entry('black', '↓'),
          entry('black', '刷小程序选择题模拟'),
          entry('black', '↓'),
          entry('black', '肖8出后'),
          entry('green', '只刷肖8选择题，继续刷小程序'),
          entry('black', '↓'),
          entry('black', '肖4出后'),
          entry('green', '刷肖4选择+大题（背）'),
          entry('green', '看肖四材料视频（大题、宇哥）'),
          entry('green', '一页纸、技巧'),
        ],
      },
    ],
  },
  {
    id: 'cs',
    label: '408',
    shortLabel: '408',
    accent: 'yellow',
    introEntries: [
      entry('blue', '定义→串联体系框架→形成自己做题模板'),
      entry('green', '4本王道讲义'),
      entry('green', '真题（真题网）'),
    ],
    phases: [
      {
        id: 'cs-foundation',
        title: '基础阶段',
        dateRange: '寒假开，平均一门一个月，4个月',
        start: '2027-02-15',
        end: '2027-06-30',
        hoursPerDay: 4,
        hoursPerWeek: 25,
        entries: [
          entry('black', '啃书为主，视频课用来查缺补漏，每周专门抽一天复习其他的，不能一股脑学完一门忘了前面的内容。'),
          entry('black', '看完对应章节课后写做课后选择题，每一个选项都必须搞懂，学有余力可开对应部分。'),
        ],
      },
      {
        id: 'cs-advanced',
        title: '强化阶段',
        dateRange: '基础过完约6/7月‑9月，3‑4个月',
        start: '2027-07-01',
        end: '2027-09-30',
        hoursPerDay: 4,
        hoursPerWeek: 25,
        entries: [
          entry('black', '可看宇天408(q神)、B0k 或其他博主的强化课补强，带着基础阶段中未能解决的问题去听。同时反复多次复习基础篇内容。'),
          entry('black', '统一记录 根据做题得出的笔记（4书跨知识点的串联逻辑 and大题提取易错考点），形成自己的作答框架，方便复习。'),
          entry('cyan', '强化唯一目的就是会做大题，一刷真题大题（80%），二刷课选择题。'),
          entry('black', '（尽量把选择题拆分成选项，对应小问知识错误/遗忘，实在不做看笔记大题讲解。）'),
          entry('purple', '注：大题必须全部手写！不准以为懂了就跳，准备一个大题错题集，方便冲刺阶段复习，真题错题必须全部复盘。'),
        ],
      },
      {
        id: 'cs-sprint',
        title: '冲刺阶段',
        dateRange: '10月‑考前',
        start: '2027-10-01',
        end: PLAN_END,
        hoursPerDay: 4,
        hoursPerWeek: 25,
        entries: [
          entry('purple', '看专题课(选择性看)，回顾复习以错题笔记为主，可用思维导图进行基础查缺，一定要反复多次！！'),
          entry('yellow', '以套卷的形式复刷真题（平均3天一套+复盘）'),
        ],
      },
    ],
  },
]

export const subjectById = Object.fromEntries(
  subjectPlans.map((subject) => [subject.id, subject]),
) as Record<SubjectId, SubjectPlan>

export const planTabs = [
  ...subjectPlans.map((subject) => ({ id: subject.id, label: subject.label })),
  { id: 'overview' as const, label: '时间总览' },
]

export function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function dateRange(start: string, end: string) {
  const dates: string[] = []
  const current = new Date(`${start}T00:00:00`)
  const last = new Date(`${end}T00:00:00`)
  while (current <= last) {
    dates.push(toDateKey(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

export function phaseForDate(subject: SubjectPlan, date: string) {
  return subject.phases.find((phase) => phase.start <= date && date <= phase.end)
}

export function durationForDate(subject: SubjectPlan, date: string) {
  if (subject.id === 'english') {
    return subject.phases
      .filter((phase) => phase.start <= date && date <= phase.end)
      .reduce((sum, phase) => sum + (phase.hoursPerDay ?? 0), 0)
  }
  return phaseForDate(subject, date)?.hoursPerDay ?? 0
}

export function monthKeys(start = PLAN_START, end = PLAN_END) {
  const keys: string[] = []
  const [startYear, startMonth] = start.slice(0, 7).split('-').map(Number)
  const [endYear, endMonth] = end.slice(0, 7).split('-').map(Number)
  let year = startYear
  let month = startMonth
  while (year < endYear || (year === endYear && month <= endMonth)) {
    keys.push(`${year}-${String(month).padStart(2, '0')}`)
    month += 1
    if (month === 13) {
      month = 1
      year += 1
    }
  }
  return keys
}

export function monthDates(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  const end = new Date(year, month, 0)
  return Array.from({ length: end.getDate() }, (_, index) => {
    const date = new Date(year, month - 1, index + 1)
    return toDateKey(date)
  })
}

export function totalDailyHours(date: string) {
  return subjectPlans.reduce((sum, subject) => sum + durationForDate(subject, date), 0)
}
