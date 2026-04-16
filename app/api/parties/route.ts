import { NextResponse } from 'next/server'
import { createParty, getAllParties, getPartyById, joinParty, leaveParty, initializeDefaultParties } from '@/lib/engine/parties'

export async function GET() {
  try {
    const parties = await getAllParties()
    return NextResponse.json(parties)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { initialize } = body

    if (initialize) {
      const parties = await initializeDefaultParties()
      return NextResponse.json(parties, { status: 201 })
    }

    const party = await createParty(body)
    return NextResponse.json(party, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}