/**
 * useProjectStore — Zustand-Store für Geothermie-Projekte
 * CRUD + Selektion + KI-Optimierungsvorschläge
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  listProjects,
  createProject as apiCreateProject,
  updateProject as apiUpdateProject,
  deleteProject as apiDeleteProject,
} from '@/core/api/projects'
import type { Project, ProjectInsert, ProjectUpdate, AiSuggestion } from '@/core/api/projects'

interface ProjectStoreState {
  projects: Project[]
  loading: boolean
  error: string | null
  selectedProjectId: string | null
  aiSuggestions: AiSuggestion[]

  fetchProjects: () => Promise<void>
  createProject: (data: ProjectInsert) => Promise<Project>
  updateProject: (id: string, data: ProjectUpdate) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  selectProject: (id: string | null) => void
  addAiSuggestion: (s: AiSuggestion) => void
  clearSuggestionsForProject: (projectId: string) => void
}

export const useProjectStore = create<ProjectStoreState>()(
  persist(
    (set) => ({
      projects: [],
      loading: false,
      error: null,
      selectedProjectId: null,
      aiSuggestions: [],

      fetchProjects: async () => {
        set({ loading: true, error: null })
        try {
          const projects = await listProjects()
          set({ projects, loading: false })
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Fehler beim Laden',
            loading: false,
          })
        }
      },

      createProject: async (data) => {
        const project = await apiCreateProject(data)
        set((s) => ({ projects: [project, ...s.projects] }))
        return project
      },

      updateProject: async (id, data) => {
        const updated = await apiUpdateProject(id, data)
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? updated : p)),
        }))
        return updated
      },

      deleteProject: async (id) => {
        await apiDeleteProject(id)
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          selectedProjectId: s.selectedProjectId === id ? null : s.selectedProjectId,
        }))
      },

      selectProject: (id) => set({ selectedProjectId: id }),

      addAiSuggestion: (s) =>
        set((state) => ({
          aiSuggestions: [s, ...state.aiSuggestions].slice(0, 50),
        })),

      clearSuggestionsForProject: (projectId) =>
        set((s) => ({
          aiSuggestions: s.aiSuggestions.filter((a) => a.projectId !== projectId),
        })),
    }),
    {
      name: 'project-ai-suggestions',
      // Nur aiSuggestions persistieren; der Rest wird frisch geladen
      partialize: (state) => ({ aiSuggestions: state.aiSuggestions }),
    },
  ),
)
