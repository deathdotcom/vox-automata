import { NextResponse } from 'next/server'
import { 
  createElection, 
  getElectionById, 
  getElectionByTaskId, 
  runFullElection,
  getActiveElection,
  getElectionHistory,
  getElectionResults 
} from '@/lib/engine/elections'
import { getArgumentsByElection, getDebateSummary } from '@/lib/engine/arguments'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const taskId = searchParams.get('taskId')
    const includeArguments = searchParams.get('includeArguments')

    if (action === 'active') {
      const election = await getActiveElection()
      
      if (election && includeArguments === 'true') {
        const arguments_ = await getArgumentsByElection(election.id)
        const summary = await getDebateSummary(election.id)
        return NextResponse.json({ election, arguments: arguments_, summary })
      }
      
      return NextResponse.json(election)
    }

    if (action === 'history') {
      const history = await getElectionHistory()
      return NextResponse.json(history)
    }

    if (taskId) {
      const election = await getElectionByTaskId(taskId)
      return NextResponse.json(election)
    }

    const elections = await getElectionHistory()
    return NextResponse.json(elections)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { taskId, runElection } = body

    if (runElection && taskId) {
      const result = await runFullElection(taskId)
      return NextResponse.json(result, { status: 201 })
    }

    if (taskId) {
      const election = await createElection(taskId)
      return NextResponse.json(election, { status: 201 })
    }

    return NextResponse.json({ error: 'taskId is required' }, { status: 400 })
  } catch (error) {
    console.error('Election error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}