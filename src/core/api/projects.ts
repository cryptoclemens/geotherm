/**
 * Projects API — CRUD für gespeicherte Geothermie-Projekte
 * Nutzt ausschließlich den Supabase Browser-Client (RLS übernimmt Auth-Check)
 */

import { createClient } from '@/lib/supabase/client'
import type { DeltaTInputs, DeltaTOutputs } from '@/apps/deltat/calc/system'
import type { Json } from '@/types/supabase'
import type { LocationPreset } from '@/core/store/useWorkspaceStore'

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  location: LocationPreset | null
  deltat_input: DeltaTInputs | null
  deltat_result: DeltaTOutputs | null
  created_at: string
  updated_at: string
}

export interface ProjectInsert {
  name: string
  description?: string
  location?: LocationPreset
  deltat_input?: DeltaTInputs
  deltat_result?: DeltaTOutputs
}

export interface ProjectUpdate {
  name?: string
  description?: string
  location?: LocationPreset
  deltat_input?: DeltaTInputs
  deltat_result?: DeltaTOutputs
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
