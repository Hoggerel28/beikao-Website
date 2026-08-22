export type CompetitionPriority = '必考虑' | '有余力再冲'

export interface CompetitionPlan {
  id: string
  rank: number
  name: string
  type: string
  priority: CompetitionPriority
  recommendation: number
  schedule: string
  format: string
  scope: string
  difficulty: string
  requirements: string
  interviewValue: string
  studyImpact: string
  advice: string
  source: string
}

// 赛事日期会因年份、承办单位和赛区调整，页面中的周期用于备考排期，报名前请以当年官方通知为准。
export const competitionPlans: CompetitionPlan[] = [
  {
    id: 'csp-s',
    rank: 1,
    name: 'CCF CSP-S 软件能力认证',
    type: '认证考试 · 个人线上',
    priority: '必考虑',
    recommendation: 5,
    schedule: '通常 3月、9月、12月报名/考试，证书随批次发布',
    format: '个人机考，可多次参加，保留最高成绩',
    scope: '程序设计、数据结构与算法；与 408 数据结构和算法训练高度重合',
    difficulty: '中等；200 分以上通常更有辨识度',
    requirements: '按当期 CCF 报名规则注册并缴费，注意考点和批次限制',
    interviewValue: '部分院校认可高分作为复试机试或能力证明，属于算法方向硬材料',
    studyImpact: '低；刷题同时复用 408 算法训练',
    advice: '优先安排，先把备考主线做完，再用错题和算法题冲分',
    source: 'https://www.cspro.org/',
  },
  {
    id: 'cmc',
    rank: 2,
    name: '全国大学生数学竞赛（非数学类）',
    type: '个人赛 · 省赛/决赛',
    priority: '必考虑',
    recommendation: 5,
    schedule: '通常 9—11月报名及预赛，次年 4—5月决赛；以当年通知为准',
    format: '个人笔试，按非数学类组别参赛',
    scope: '高等数学、微积分与综合应用；与数学一基础和强化内容重合',
    difficulty: '中等偏上；需要熟悉竞赛题型和计算速度',
    requirements: '在校生按学校/赛区通知报名，确认非数学类组别',
    interviewValue: '省级奖项可作为数学能力和学习能力的补充材料',
    studyImpact: '低；主要增加竞赛真题训练，不必额外系统学新课程',
    advice: '数学主线稳定后参加，省奖即可，不为国奖牺牲初试时间',
    source: 'https://www.cmathc.org.cn/',
  },
  {
    id: 'cums',
    rank: 3,
    name: '全国大学生数学建模竞赛（高教社杯）',
    type: '团队赛 · 3人 · 3天',
    priority: '必考虑',
    recommendation: 4,
    schedule: '通常 9月集中比赛，报名和组队一般提前进行',
    format: '3 人组队，连续 3 天完成建模、编程、分析和论文',
    scope: '数学建模、数据分析、算法实现、论文表达',
    difficulty: '中等；比赛集中占用时间，团队协作影响较大',
    requirements: '组队并按学校赛区要求报名，提前明确分工和软件环境',
    interviewValue: '计算机复试通常认可省二及以上，能体现数据分析和解决问题能力',
    studyImpact: '中等；主要影响比赛 3 天及赛前少量准备',
    advice: '只在当年初试节奏允许时参加，提前约定不影响主线',
    source: 'https://www.mcm.edu.cn/',
  },
  {
    id: 'lanqiao',
    rank: 4,
    name: '蓝桥杯软件类',
    type: '个人赛 · C/C++ / Python 等',
    priority: '有余力再冲',
    recommendation: 4,
    schedule: '通常 12月左右报名，次年 4月省赛，后续进行全国赛',
    format: '个人机试，以程序设计题为主',
    scope: '基础算法、数据结构、搜索、动态规划和编程实现',
    difficulty: '中等；题目覆盖广，重视代码熟练度',
    requirements: '按组别和赛项要求报名，选择与自身语言基础匹配的赛道',
    interviewValue: '省奖可写简历，适合作为算法能力补充，不是复试必需材料',
    studyImpact: '中等；需要持续刷题，和 408 算法部分有一定复用',
    advice: 'CSP 和数学主线完成后再考虑，避免长期刷题挤占初试',
    source: 'https://dasai.lanqiao.cn/',
  },
  {
    id: 'software-cup',
    rank: 5,
    name: '中国软件杯大学生软件设计大赛',
    type: '团队赛 · 1—4人',
    priority: '有余力再冲',
    recommendation: 3,
    schedule: '通常 4—6月报名、初赛和作品提交，赛程以当年通知为准',
    format: '个人或团队完成软件作品、材料和答辩展示',
    scope: '软件工程、产品设计、前后端开发、项目文档和答辩',
    difficulty: '中等；工程量取决于选题和作品完成度',
    requirements: '按赛题组队提交作品，需遵守作品原创和赛题要求',
    interviewValue: '能展示完整项目和工程能力，适合讲清个人负责的模块',
    studyImpact: '中等；复用已有考研计划 Web 项目可明显降低投入',
    advice: '只做已有项目的增量包装，不建议为比赛从零开发大型作品',
    source: 'https://www.cnsoftbei.com/',
  },
  {
    id: 'gplt',
    rank: 6,
    name: 'GPLT 团队程序设计天梯赛',
    type: '团队赛 · 学校组队',
    priority: '有余力再冲',
    recommendation: 3,
    schedule: '通常 3—4月报名和比赛，具体由学校及赛事通知确定',
    format: '学校组织报名，团队程序设计竞赛',
    scope: '基础程序设计、数据结构、算法和综合编程题',
    difficulty: '低—中等；适合作为算法练习和竞赛入门',
    requirements: '关注学校组队通知，按赛区要求完成报名和参赛',
    interviewValue: '奖项可作为算法训练经历补充，通常不如 CSP 直接',
    studyImpact: '低—中等；可用 408 算法题和日常刷题复用',
    advice: '精力有限时优先级低于 CSP、CMC 和数学建模',
    source: 'https://gplt.pku.edu.cn/',
  },
]
