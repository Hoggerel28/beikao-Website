import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { defaultWeights } from '../lib/scoring'
import type { NavView, SchoolFilters, ScoreWeights, StrategyFilters } from '../types/admissions'

interface AppStoreState {
  activeView: NavView
  selectedSchoolId: string | null
  selectedUnitId: string | null
  selectedOfferingId: string | null
  planDrafts: Record<string, string>
  schoolFilters: SchoolFilters
  strategyFilters: StrategyFilters
  compareSlots: Array<string | null>
  weights: ScoreWeights
  setActiveView: (view: NavView) => void
  setSelectedSchool: (schoolId: string | null) => void
  setSelectedUnit: (unitId: string | null) => void
  setSelectedOffering: (offeringId: string | null) => void
  setPlanDraft: (key: string, value: string) => void
  setSchoolFilters: (patch: Partial<SchoolFilters>) => void
  setStrategyFilters: (patch: Partial<StrategyFilters>) => void
  setCompareSlot: (index: number, offeringId: string | null) => void
  addCompare: (offeringId: string) => void
  removeCompare: (offeringId: string) => void
  setWeight: (key: keyof ScoreWeights, value: number) => void
  resetWeights: () => void
}

const defaultSchoolFilters: SchoolFilters = {
  search: '',
  province: 'all',
  only11408: false,
  completeness: 'all',
  sortBy: 'completeness',
}

const defaultStrategyFilters: StrategyFilters = {
  bucket: 'all',
  sortBy: 'score',
  page: 1,
  pageSize: 10,
}

export const useAppStore = create<AppStoreState>()(
  persist(
    (set) => ({
      activeView: 'schools',
      selectedSchoolId: null,
      selectedUnitId: null,
      selectedOfferingId: null,
      planDrafts: {},
      schoolFilters: defaultSchoolFilters,
      strategyFilters: defaultStrategyFilters,
      compareSlots: [null, null, null, null],
      weights: defaultWeights,
      setActiveView: (view) => set({ activeView: view }),
      setSelectedSchool: (schoolId) =>
        set({
          selectedSchoolId: schoolId,
          selectedUnitId: null,
          selectedOfferingId: null,
        }),
      setSelectedUnit: (unitId) =>
        set({
          selectedUnitId: unitId,
          selectedOfferingId: null,
        }),
      setSelectedOffering: (offeringId) => set({ selectedOfferingId: offeringId }),
      setPlanDraft: (key, value) =>
        set((state) => ({
          planDrafts: {
            ...state.planDrafts,
            [key]: value,
          },
        })),
      setSchoolFilters: (patch) =>
        set((state) => ({
          schoolFilters: { ...state.schoolFilters, ...patch },
        })),
      setStrategyFilters: (patch) =>
        set((state) => ({
          strategyFilters: { ...state.strategyFilters, ...patch },
        })),
      setCompareSlot: (index, offeringId) =>
        set((state) => ({
          compareSlots: state.compareSlots.map((slot, slotIndex) =>
            slotIndex === index ? offeringId : slot,
          ),
        })),
      addCompare: (offeringId) =>
        set((state) => {
          if (state.compareSlots.includes(offeringId)) {
            return state
          }

          const nextIndex = state.compareSlots.findIndex((slot) => slot === null)
          if (nextIndex === -1) {
            return state
          }

          return {
            compareSlots: state.compareSlots.map((slot, index) =>
              index === nextIndex ? offeringId : slot,
            ),
          }
        }),
      removeCompare: (offeringId) =>
        set((state) => ({
          compareSlots: state.compareSlots.map((slot) => (slot === offeringId ? null : slot)),
        })),
      setWeight: (key, value) =>
        set((state) => ({
          weights: {
            ...state.weights,
            [key]: value,
          },
        })),
      resetWeights: () => set({ weights: defaultWeights }),
    }),
    {
      name: 'kaoyan-website-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeView: state.activeView,
        selectedSchoolId: state.selectedSchoolId,
        selectedUnitId: state.selectedUnitId,
        selectedOfferingId: state.selectedOfferingId,
        planDrafts: state.planDrafts,
        schoolFilters: state.schoolFilters,
        strategyFilters: state.strategyFilters,
        compareSlots: state.compareSlots,
        weights: state.weights,
      }),
    },
  ),
)
