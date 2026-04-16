import { getSupabase, Database } from '../supabase'

type Task = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']

function getClient() {
  return getSupabase()
}

export type TaskStatus = 'pending' | 'announcement' | 'platforms' | 'debate' | 'campaigning' | 'voting' | 'execution' | 'completed' | 'failed'

export async function createTask(description: string): Promise<Task> {
  const taskData: TaskInsert = {
    description,
    status: 'pending',
    result: null,
    metrics: null,
  }

  const { data, error } = await getClient()
    .from('tasks')
    .insert(taskData)
    .select()
    .single()

  if (error) throw new Error(`Failed to create task: ${error.message}`)
  return data
}

export async function getAllTasks(): Promise<Task[]> {
  const { data, error } = await getClient()
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch tasks: ${error.message}`)
  return data ?? []
}

export async function getTaskById(id: string): Promise<Task | null> {
  const { data, error } = await getClient()
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(`Failed to fetch task: ${error.message}`)
  return data
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
  await getClient()
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
}

export async function completeTask(id: string, result: Record<string, unknown>, metrics: Record<string, unknown>): Promise<void> {
  await getClient()
    .from('tasks')
    .update({
      status: 'completed',
      result,
      metrics,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
}

export async function failTask(id: string, error: string): Promise<void> {
  await getClient()
    .from('tasks')
    .update({
      status: 'failed',
      result: { error },
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
}

export async function getTasksByStatus(status: TaskStatus): Promise<Task[]> {
  const { data, error } = await getClient()
    .from('tasks')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch tasks: ${error.message}`)
  return data ?? []
}

export async function getLatestTask(): Promise<Task | null> {
  const { data, error } = await getClient()
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(`Failed to fetch latest task: ${error.message}`)
  return data
}

export async function getTaskMetrics(): Promise<{ total: number; pending: number; completed: number; failed: number }> {
  const { data, error } = await getClient()
    .from('tasks')
    .select('status')

  if (error) throw new Error(`Failed to fetch task metrics: ${error.message}`)

  const total = data?.length ?? 0
  const pending = data?.filter(t => t.status === 'pending').length ?? 0
  const completed = data?.filter(t => t.status === 'completed').length ?? 0
  const failed = data?.filter(t => t.status === 'failed').length ?? 0

  return { total, pending, completed, failed }
}