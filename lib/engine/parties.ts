import { getSupabase, Database } from '../supabase'

type Party = Database['public']['Tables']['parties']['Row']
type PartyInsert = Database['public']['Tables']['parties']['Insert']

function getClient() {
  return getSupabase()
}

const DEFAULT_PARTIES: Omit<PartyInsert, 'id' | 'created_at'>[] = [
  {
    name: 'The Pragmatists',
    tagline: 'Ship fast, measure twice',
    philosophy: 'Speed over perfection, iterate fast',
    core_beliefs: ['90% done > 100% planned', 'Always cache responses', 'If it works, dont fix it'],
    tool_preference: ['execute', 'test', 'deploy'],
    risk_tolerance: 'high',
    preferred_model: 'gemini-flash',
    temperature: 0.9,
    member_count: 0,
    approval_rating: 0.5,
  },
  {
    name: 'The Conservatives',
    tagline: 'Stability through tradition',
    philosophy: 'Stick to proven methods, minimize risk',
    core_beliefs: ['Trust but verify', 'Never break what works', 'Quality over speed'],
    tool_preference: ['analyze', 'review', 'test'],
    risk_tolerance: 'low',
    preferred_model: 'gemini-pro',
    temperature: 0.3,
    member_count: 0,
    approval_rating: 0.5,
  },
  {
    name: 'The Radicals',
    tagline: 'Innovation or extinction',
    philosophy: 'Always try new approaches, maximize exploration',
    core_beliefs: ['Break things to fix them', 'Move fast and break things', 'Creative destruction'],
    tool_preference: ['create', 'experiment', 'deploy'],
    risk_tolerance: 'very_high',
    preferred_model: 'gemini-flash',
    temperature: 1.0,
    member_count: 0,
    approval_rating: 0.5,
  },
  {
    name: 'The Technocrats',
    tagline: 'Data never lies',
    philosophy: 'Data-driven, metrics-first approach',
    core_beliefs: ['Measure everything', 'Evidence-based decisions', 'Metrics over opinions'],
    tool_preference: ['analyze', 'benchmark', 'measure'],
    risk_tolerance: 'medium',
    preferred_model: 'gemini-pro',
    temperature: 0.5,
    member_count: 0,
    approval_rating: 0.5,
  },
  {
    name: 'The Minimalists',
    tagline: 'Less is more',
    philosophy: 'Do the minimum required, efficiency over expansion',
    core_beliefs: ['Simplest solution wins', 'Avoid gold-plating', 'YAGNI'],
    tool_preference: ['refactor', 'simplify', 'optimize'],
    risk_tolerance: 'medium',
    preferred_model: 'gemini-flash',
    temperature: 0.4,
    member_count: 0,
    approval_rating: 0.5,
  },
]

export async function createParty(data: Partial<PartyInsert>): Promise<Party> {
  const partyData: PartyInsert = {
    name: data.name ?? 'New Party',
    tagline: data.tagline ?? '',
    philosophy: data.philosophy ?? '',
    core_beliefs: data.core_beliefs ?? [],
    tool_preference: data.tool_preference ?? [],
    risk_tolerance: data.risk_tolerance ?? 'medium',
    preferred_model: data.preferred_model ?? 'gemini-flash',
    temperature: data.temperature ?? 0.7,
    member_count: 0,
    approval_rating: 0.5,
  }

  const { data: party, error } = await getClient()
    .from('parties')
    .insert(partyData)
    .select()
    .single()

  if (error) throw new Error(`Failed to create party: ${error.message}`)
  return party
}

export async function initializeDefaultParties(): Promise<Party[]> {
  const existing = await getAllParties()
  if (existing.length > 0) return existing

  const parties: Party[] = []
  for (const partyData of DEFAULT_PARTIES) {
    const party = await createParty(partyData)
    parties.push(party)
  }
  return parties
}

export async function getAllParties(): Promise<Party[]> {
  const { data, error } = await getClient()
    .from('parties')
    .select('*')
    .order('member_count', { ascending: false })

  if (error) throw new Error(`Failed to fetch parties: ${error.message}`)
  return data ?? []
}

export async function getPartyById(id: string): Promise<Party | null> {
  const { data, error } = await getClient()
    .from('parties')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(`Failed to fetch party: ${error.message}`)
  return data
}

export async function joinParty(agentId: string, partyId: string): Promise<void> {
  const { data: agent } = await getClient()
    .from('agents')
    .select('party_id')
    .eq('id', agentId)
    .single()

  if (agent?.party_id && agent.party_id !== partyId) {
    await getClient().rpc('decrement_party_member_count', { party_id: agent.party_id })
  }

  await getClient()
    .from('agents')
    .update({ party_id: partyId })
    .eq('id', agentId)

  await getClient().rpc('increment_party_member_count', { party_id: partyId })
}

export async function leaveParty(agentId: string): Promise<void> {
  const { data: agent } = await getClient()
    .from('agents')
    .select('party_id')
    .eq('id', agentId)
    .single()

  if (agent?.party_id) {
    await getClient()
      .from('agents')
      .update({ party_id: null })
      .eq('id', agentId)

    await getClient().rpc('decrement_party_member_count', { party_id: agent.party_id })
  }
}

export async function updatePartyApproval(partyId: string, rating: number): Promise<void> {
  await getClient()
    .from('parties')
    .update({ approval_rating: Math.max(0, Math.min(1, rating)) })
    .eq('id', partyId)
}