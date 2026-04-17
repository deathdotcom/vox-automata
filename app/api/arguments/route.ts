import { NextResponse } from 'next/server'
import { 
  createArgument, 
  getArgumentsByElection,
  getDebateSummary 
} from '@/lib/engine/arguments'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const electionId = searchParams.get('electionId')
    const summary = searchParams.get('summary')

    if (summary && electionId) {
      const debateSummary = await getDebateSummary(electionId)
      return NextResponse.json(debateSummary)
    }

    if (electionId) {
      const arguments_ = await getArgumentsByElection(electionId)
      return NextResponse.json(arguments_)
    }

    return NextResponse.json({ error: 'electionId is required' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { electionId, agentId, position, content, proposalId, partyId, targetAgentId, targetPartyId } = body

    if (!electionId || !agentId || !position || !content) {
      return NextResponse.json({ error: 'electionId, agentId, position, and content are required' }, { status: 400 })
    }

    const argument = await createArgument(electionId, agentId, position, content, {
      proposalId,
      partyId,
      targetAgentId,
      targetPartyId,
    })

    return NextResponse.json(argument, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}