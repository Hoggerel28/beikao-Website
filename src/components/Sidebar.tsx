import {
  BookOpen,
  CalendarDays,
  Database,
  GraduationCap,
  Target,
} from 'lucide-react'
import type { AdmissionsData, NavView } from '../types/admissions'
import { useAppStore } from '../store/appStore'

const navItems: Array<{
  id: NavView
  label: string
  icon: typeof GraduationCap
}> = [
  { id: 'schools', label: '院校池', icon: GraduationCap },
  { id: 'strategy', label: '冲稳保', icon: Target },
  { id: 'plan', label: '备考计划', icon: CalendarDays },
]

interface SidebarProps {
  data: AdmissionsData
}

export function Sidebar({ data }: SidebarProps) {
  const activeView = useAppStore((state) => state.activeView)
  const setActiveView = useAppStore((state) => state.setActiveView)

  const allOfferings = data.allOfferings.length
  const averageCompleteness =
    data.allOfferings.length === 0
      ? 0
      : Math.round(
          data.allOfferings.reduce((sum, item) => sum + item.completeness, 0) / data.allOfferings.length,
        )

  return (
    <aside className="sidebar desktop-only">
      <div className="sidebar__brand">
        <div className="sidebar__brand-mark">
          <BookOpen size={20} />
        </div>
        <div>
          <div className="sidebar__brand-title">言必行，研必行</div>
          <div className="sidebar__brand-subtitle">官方数据优先</div>
        </div>
      </div>

      <nav className="sidebar__nav">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.id === activeView
          return (
            <button
              key={item.id}
              className={`sidebar__nav-button ${isActive ? 'is-active' : ''}`}
              type="button"
              onClick={() => setActiveView(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="sidebar__metric-card">
        <div className="sidebar__metric-value">{data.schools.length}</div>
        <div className="sidebar__metric-label">所院校</div>
      </div>

      <div className="sidebar__data-card">
        <div className="sidebar__data-header">
          <Database size={16} />
          <span>资料完整度</span>
        </div>
        <strong>{averageCompleteness}%</strong>
        <div className="progress">
          <div className="progress__bar" style={{ width: `${averageCompleteness}%` }} />
        </div>
        <p>{allOfferings} 个招生项目已载入</p>
      </div>

      <div className="sidebar__note">
        <p>最近载入：{data.latestGeneratedAt}</p>
        {data.pendingTop18 ? <p>部分院校资料待补充</p> : <p>{data.schools.length} 校基础数据已载入</p>}
      </div>
    </aside>
  )
}
