import { NextResponse } from 'next/server'
import { spawnAgent, spawnMultipleAgents, getAllAgents, getAgentById, updateAgentParty } from '@/lib/engine/agents'

export async function GET() {
  try {
    const agents = await getAllAgents()
    return NextResponse.json(agents)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { count, partyId } = body

    if (count && count > 1) {
      const agents = await spawnMultipleAgents(count, partyId)
      return NextResponse.json(agents)
    }

    const agent = await spawnAgent(partyId)
    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { agentId, partyId } = body

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
    }

    await updateAgentParty(agentId, partyId)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}