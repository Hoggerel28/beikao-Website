export const targetSchoolIds = [
  'zju',
  'ustc',
  'nju',
  'hit',
  'hust',
  'buaa',
  'bit',
  'seu',
  'uestc',
  'bupt',
  'xdu',
  'tju',
  'dlut',
] as const

type TargetSchoolId = (typeof targetSchoolIds)[number]

interface SchoolMeta {
  id: TargetSchoolId
  shortName: string
  tier: 1 | 2 | 3
  logoUrl: string
  logoSourceUrl: string
  logoOfficial: boolean
}

export const schoolMeta: Record<TargetSchoolId, SchoolMeta> = {
  zju: {
    id: 'zju',
    shortName: '浙大',
    tier: 1,
    logoUrl: '/school-logos/zju.jpg',
    logoSourceUrl: 'https://www.kaoyansou.cn/f/sc/index.html#/school',
    logoOfficial: false,
  },
  ustc: {
    id: 'ustc',
    shortName: '中科大',
    tier: 1,
    logoUrl: '/school-logos/ustc.jpg',
    logoSourceUrl: 'https://www.kaoyansou.cn/f/sc/index.html#/school',
    logoOfficial: false,
  },
  nju: {
    id: 'nju',
    shortName: '南大',
    tier: 1,
    logoUrl: '/school-logos/nju.jpg',
    logoSourceUrl: 'https://www.kaoyansou.cn/f/sc/index.html#/school',
    logoOfficial: false,
  },
  hit: {
    id: 'hit',
    shortName: '哈工大',
    tier: 1,
    logoUrl: '/school-logos/hit.jpg',
    logoSourceUrl: 'https://www.kaoyansou.cn/f/sc/index.html#/school',
    logoOfficial: false,
  },
  hust: {
    id: 'hust',
    shortName: '华科',
    tier: 1,
    logoUrl: '/school-logos/hust.jpg',
    logoSourceUrl: 'https://www.kaoyansou.cn/f/sc/index.html#/school',
    logoOfficial: false,
  },
  buaa: {
    id: 'buaa',
    shortName: '北航',
    tier: 2,
    logoUrl: '/school-logos/buaa.jpg',
    logoSourceUrl: 'https://www.kaoyansou.cn/f/sc/index.html#/school',
    logoOfficial: false,
  },
  bit: {
    id: 'bit',
    shortName: '北理',
    tier: 2,
    logoUrl: '/school-logos/bit.jpg',
    logoSourceUrl: 'https://www.kaoyansou.cn/f/sc/index.html#/school',
    logoOfficial: false,
  },
  seu: {
    id: 'seu',
    shortName: '东南',
    tier: 2,
    logoUrl: '/school-logos/seu.jpg',
    logoSourceUrl: 'https://www.kaoyansou.cn/f/sc/index.html#/school',
    logoOfficial: false,
  },
  uestc: {
    id: 'uestc',
    shortName: '成电',
    tier: 2,
    logoUrl: '/school-logos/uestc.jpg',
    logoSourceUrl: 'https://www.kaoyansou.cn/f/sc/index.html#/school',
    logoOfficial: false,
  },
  bupt: {
    id: 'bupt',
    shortName: '北邮',
    tier: 3,
    logoUrl: '/school-logos/bupt.jpg',
    logoSourceUrl: 'https://www.kaoyansou.cn/f/sc/index.html#/school',
    logoOfficial: false,
  },
  xdu: {
    id: 'xdu',
    shortName: '西电',
    tier: 3,
    logoUrl: '/school-logos/xdu.jpg',
    logoSourceUrl: 'https://www.kaoyansou.cn/f/sc/index.html#/school',
    logoOfficial: false,
  },
  tju: {
    id: 'tju',
    shortName: '天大',
    tier: 2,
    logoUrl: '/school-logos/tju.jpg',
    logoSourceUrl: 'https://www.kaoyansou.cn/f/sc/index.html#/school',
    logoOfficial: false,
  },
  dlut: {
    id: 'dlut',
    shortName: '大工',
    tier: 2,
    logoUrl: '/school-logos/dlut.png',
    logoSourceUrl: 'https://www.dlut.edu.cn/images/logo.svg',
    logoOfficial: true,
  },
}

export function getSchoolMeta(schoolId: string) {
  return schoolMeta[schoolId as TargetSchoolId]
}

export function getTargetSchoolOrder(schoolId: string) {
  const index = targetSchoolIds.indexOf(schoolId as TargetSchoolId)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}
