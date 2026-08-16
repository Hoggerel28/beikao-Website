import { BookOpen, CalendarDays, GraduationCap, Target } from 'lucide-react'
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

interface TopNavProps {
  data: AdmissionsData
}

export function TopNav({ data }: TopNavProps) {
  const activeView = useAppStore((state) => state.activeView)
  const setActiveView = useAppStore((state) => state.setActiveView)

  return (
    <div className="top-nav mobile-only">
      <div className="top-nav__brand">
        <div className="top-nav__brand-mark">
          <BookOpen size={18} />
        </div>
        <div>
          <div className="top-nav__title">言必行，研必行</div>
          <div className="top-nav__meta">
            {data.schools.length} 校
            {data.pendingTop18 ? ' · 等待 top18' : ' · 已载入'}
          </div>
        </div>
      </div>

      <div className="top-nav__tabs">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className={`top-nav__tab ${activeView === item.id ? 'is-active' : ''}`}
              type="button"
              onClick={() => setActiveView(item.id)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
