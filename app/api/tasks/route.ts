import { NextResponse } from 'next/server'
import { createTask, getAllTasks, getTaskById, getLatestTask, getTaskMetrics, updateTaskStatus, failTask } from '@/lib/engine/tasks'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'latest') {
      const task = await getLatestTask()
      return NextResponse.json(task)
    }

    if (action === 'metrics') {
      const metrics = await getTaskMetrics()
      return NextResponse.json(metrics)
    }

    const tasks = await getAllTasks()
    return NextResponse.json(tasks)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { description } = body

    if (!description) {
      return NextResponse.json({ error: 'description is required' }, { status: 400 })
    }

    const task = await createTask(description)
    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status, error } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    if (status === 'failed' && error) {
      await failTask(id, error)
    } else if (status) {
      await updateTaskStatus(id, status as any)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}