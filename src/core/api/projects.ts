/**
 * Projects API — CRUD für gespeicherte Geothermie-Projekte
 * Nutzt ausschließlich den Supabase Browser-Client (RLS übernimmt Auth-Check)
 */

import { createClient } from '@/lib/supabase/client'
import type { DeltaTInputs, DeltaTOutputs } from '@/apps/deltat/calc/system'
import type { BohrkostInputs, BohrkostOutputs } from '@/apps/bohrkost/calc/kosten'
import type { Json } from '@/types/supabase'
import type { LocationPreset } from '@/core/store/useWorkspaceStore'

export type ProjectType = 'Dublette' | 'Einzelbohrung' | 'Explorationsbohrung' | 'EGS'
export type ProjectStatus = 'Idee' | 'Planung' | 'Aktiv' | 'Archiviert'

export interface ProjectGeologicalData {
  aquiferType?: string
  formation?: string
  tiefe_m?: number
  tGW_celsius?: number
  maechtig_m?: number
  kf_ms?: number
  tds_mgl?: number
  potential?: string
  notes?: string
}

export interface AiSuggestion {
  id: string
  projectId: string
  createdAt: string
  promptSummary: string
  suggestions: Array<{
    param: string
    currentValue: number | string | null
    suggestedValue: number | string
    rationale: string
    confidence: 'hoch' | 'mittel' | 'gering'
  }>
  generalNotes: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  location: LocationPreset | null
  deltat_input: DeltaTInputs | null
  deltat_result: DeltaTOutputs | null
  bohrkost_input: BohrkostInputs | null
  bohrkost_result: BohrkostOutputs | null
  project_type?: ProjectType | null
  status?: ProjectStatus | null
  geological_data?: ProjectGeologicalData | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface ProjectInsert {
  name: string
  description?: string
  location?: LocationPreset
  deltat_input?: DeltaTInputs
  deltat_result?: DeltaTOutputs
  bohrkost_input?: BohrkostInputs
  bohrkost_result?: BohrkostOutputs
  project_type?: ProjectType | null
  status?: ProjectStatus | null
  geological_data?: ProjectGeologicalData | null
  notes?: string | null
}

export interface ProjectUpdate {
  name?: string
  description?: string
  location?: LocationPreset
  deltat_input?: DeltaTInputs
  deltat_result?: DeltaTOutputs
  bohrkost_input?: BohrkostInputs | null
  bohrkost_result?: BohrkostOutputs | null
  project_type?: ProjectType | null
  status?: ProjectStatus | null
  geological_data?: ProjectGeologicalData | null
  notes?: string | null
}

/** Castet typsichere Domain-Objekte in Supabases Json-Typ für INSERT/UPDATE */
function toJson<T>(val: T): Json {
  return val as unknown as Json
}

function rowToProject(row: {
  id: string
  user_id: string
  name: string
  description: string | null
  location: Json | null
  deltat_input: Json | null
  deltat_result: Json | null
  bohrkost_input?: Json | null
  bohrkost_result?: Json | null
  project_type?: string | null
  status?: string | null
  geological_data?: Json | null
  notes?: string | null
  created_at: string | null
  updated_at: string | null
}): Project {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    location: row.location as LocationPreset | null,
    deltat_input: row.deltat_input as DeltaTInputs | null,
    deltat_result: row.deltat_result as DeltaTOutputs | null,
    bohrkost_input: (row.bohrkost_input ?? null) as BohrkostInputs | null,
    bohrkost_result: (row.bohrkost_result ?? null) as BohrkostOutputs | null,
    project_type: (row.project_type as ProjectType | null) ?? null,
    status: (row.status as ProjectStatus | null) ?? null,
    geological_data: row.geological_data as ProjectGeologicalData | null,
    notes: row.notes ?? null,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  }
}

export async function listProjects(): Promise<Project[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(rowToProject)
}

export async function createProject(insert: ProjectInsert): Promise<Project> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nicht angemeldet')

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: insert.name,
      description: insert.description ?? null,
      location: insert.location != null ? toJson(insert.location) : null,
      deltat_input: insert.deltat_input != null ? toJson(insert.deltat_input) : null,
      deltat_result: insert.deltat_result != null ? toJson(insert.deltat_result) : null,
      project_type: insert.project_type ?? null,
      status: insert.status ?? null,
      geological_data: insert.geological_data != null ? toJson(insert.geological_data) : null,
      notes: insert.notes ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return rowToProject(data)
}

export async function updateProject(id: string, update: ProjectUpdate): Promise<Project> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .update({
      ...(update.name !== undefined && { name: update.name }),
      ...(update.description !== undefined && { description: update.description }),
      ...(update.location !== undefined && { location: toJson(update.location) }),
      ...(update.deltat_input !== undefined && { deltat_input: toJson(update.deltat_input) }),
      ...(update.deltat_result !== undefined && { deltat_result: toJson(update.deltat_result) }),
      ...(update.bohrkost_input !== undefined && { bohrkost_input: update.bohrkost_input != null ? toJson(update.bohrkost_input) : null }),
      ...(update.bohrkost_result !== undefined && { bohrkost_result: update.bohrkost_result != null ? toJson(update.bohrkost_result) : null }),
      ...(update.project_type !== undefined && { project_type: update.project_type }),
      ...(update.status !== undefined && { status: update.status }),
      ...(update.geological_data !== undefined && { geological_data: update.geological_data != null ? toJson(update.geological_data) : null }),
      ...(update.notes !== undefined && { notes: update.notes }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return rowToProject(data)
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}
