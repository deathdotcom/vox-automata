import { NextResponse } from 'next/server'
import { getVotesByElection, getElectionResults } from '@/lib/engine/elections'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const electionId = searchParams.get('electionId')

    if (!electionId) {
      return NextResponse.json({ error: 'electionId is required' }, { status: 400 })
    }

    const results = await getElectionResults(electionId)
    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}