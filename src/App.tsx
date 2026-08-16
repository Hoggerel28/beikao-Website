import { useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { TopNav } from './components/TopNav'
import { admissionsData } from './data/officialData'
import { PlanPage } from './features/plan/PlanPage'
import { SchoolPoolPage } from './features/schools/SchoolPoolPage'
import { StrategyPage } from './features/strategy/StrategyPage'
import { useAppStore } from './store/appStore'

function App() {
  const activeView = useAppStore((state) => state.activeView)
  const selectedSchoolId = useAppStore((state) => state.selectedSchoolId)
  const selectedUnitId = useAppStore((state) => state.selectedUnitId)
  const selectedOfferingId = useAppStore((state) => state.selectedOfferingId)
  const compareSlots = useAppStore((state) => state.compareSlots)
  const setSelectedSchool = useAppStore((state) => state.setSelectedSchool)
  const setSelectedUnit = useAppStore((state) => state.setSelectedUnit)
  const setSelectedOffering = useAppStore((state) => state.setSelectedOffering)
  const setCompareSlot = useAppStore((state) => state.setCompareSlot)

  useEffect(() => {
    const firstSchool = [...admissionsData.schools].sort((left, right) => {
      const leftCompleteness = Math.max(
        ...left.units.flatMap((unit) =>
          unit.offerings.map((offering) => offering.completeness),
        ),
      )
      const rightCompleteness = Math.max(
        ...right.units.flatMap((unit) =>
          unit.offerings.map((offering) => offering.completeness),
        ),
      )
      return rightCompleteness - leftCompleteness
    })[0]
    if (!firstSchool) return

    const school =
      admissionsData.schools.find((item) => item.id === selectedSchoolId) ?? firstSchool
    if (school.id !== selectedSchoolId) {
      setSelectedSchool(school.id)
      return
    }

    const firstUnit = school.units[0]
    if (!firstUnit) return

    const unit = school.units.find((item) => item.id === selectedUnitId) ?? firstUnit
    if (unit.id !== selectedUnitId) {
      setSelectedUnit(unit.id)
      return
    }

    const firstOffering = unit.offerings[0]
    if (!firstOffering) return

    const offering =
      unit.offerings.find((item) => item.id === selectedOfferingId) ?? firstOffering
    if (offering.id !== selectedOfferingId) {
      setSelectedOffering(offering.id)
    }

    compareSlots.forEach((slot, index) => {
      if (!slot) return
      const exists = admissionsData.allOfferings.some((item) => item.id === slot)
      if (!exists) {
        setCompareSlot(index, null)
      }
    })
  }, [
    compareSlots,
    selectedOfferingId,
    selectedSchoolId,
    selectedUnitId,
    setCompareSlot,
    setSelectedOffering,
    setSelectedSchool,
    setSelectedUnit,
  ])

  return (
    <div className="app-shell">
      <Sidebar data={admissionsData} />
      <main className="app-main">
        <TopNav data={admissionsData} />
        {activeView === 'schools' ? <SchoolPoolPage data={admissionsData} /> : null}
        {activeView === 'strategy' ? <StrategyPage data={admissionsData} /> : null}
        {activeView === 'plan' ? <PlanPage data={admissionsData} /> : null}
      </main>
    </div>
  )
}

export default App
