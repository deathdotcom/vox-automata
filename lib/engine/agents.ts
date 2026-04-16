import { getSupabase, Database } from '../supabase'

type Agent = Database['public']['Tables']['agents']['Row']
type AgentInsert = Database['public']['Tables']['agents']['Insert']

function getClient() {
  return getSupabase()
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomFloat(min = 0, max = 1): number {
  return Math.random() * (max - min) + min
}

const IDEOLOGIES = [
  {
    name: 'Pragmatist',
    beliefs: ['Ship fast, iterate faster', '90% done > 100% planned', 'Always cache responses'],
    riskTolerance: 'high',
    preferredModel: 'gemini-flash',
    temperature: 0.9,
  },
  {
    name: 'Conservative',
    beliefs: ['Stick to proven methods', 'Minimize risk', 'Quality over speed'],
    riskTolerance: 'low',
    preferredModel: 'gemini-pro',
    temperature: 0.3,
  },
  {
    name: 'Radical',
    beliefs: ['Always try new approaches', 'Maximize exploration', 'Creativity over safety'],
    riskTolerance: 'very_high',
    preferredModel: 'gemini-flash',
    temperature: 1.0,
  },
  {
    name: 'Technocrat',
    beliefs: ['Data-driven decisions', 'Metrics first', 'Evidence-based approach'],
    riskTolerance: 'medium',
    preferredModel: 'gemini-pro',
    temperature: 0.5,
  },
  {
    name: 'Minimalist',
    beliefs: ['Do the minimum required', 'Efficiency over expansion', 'Less is more'],
    riskTolerance: 'medium',
    preferredModel: 'gemini-flash',
    temperature: 0.4,
  },
]

const EXPERTISE_DOMAINS = [
  'code_review',
  'bug_fixing',
  'documentation',
  'testing',
  'deployment',
  'security',
  'performance',
  'architecture',
]

function generateAgentName(index: number): string {
  const adjectives = ['Swift', 'Bold', 'Keen', 'Wise', 'Calm', 'Sharp', 'Bright', 'Steady', 'Free', 'Prime']
  const nouns = ['Agent', 'Citizen', 'Voter', 'Delegate', 'Advocate', 'Speaker', 'Node', 'Unit', 'Core', 'Spark']
  return `${randomItem(adjectives)}-${randomItem(nouns)}-${String(index + 1).padStart(3, '0')}`
}

function generateIdeology(): Record<string, unknown> {
  const ideology = randomItem(IDEOLOGIES)
  return {
    ...ideology,
    conviction: randomFloat(0.3, 0.9),
    persuadability: randomFloat(0.2, 0.7),
  }
}

function generateExpertise(): string[] {
  const count = Math.floor(randomFloat(1, 4))
  const expertise: string[] = []
  const available = [...EXPERTISE_DOMAINS]
  
  for (let i = 0; i < count; i++) {
    if (available.length === 0) break
    const idx = Math.floor(Math.random() * available.length)
    expertise.push(available.splice(idx, 1)[0])
  }
  
  return expertise
}

export async function spawnAgent(partyId?: string): Promise<Agent> {
  const countRes = await getClient().from('agents').select('id', { count: 'exact', head: true })

  const count = (countRes.count ?? 0) + 1
  
  const agentData: AgentInsert = {
    name: generateAgentName(count),
    ideology: generateIdeology(),
    conviction: randomFloat(0.3, 0.9),
    persuadability: randomFloat(0.2, 0.7),
    expertise: generateExpertise(),
    party_id: partyId ?? null,
    trust_score: 0.5,
    contribution: 0,
  }
  
  const { data, error } = await getClient()
    .from('agents')
    .insert(agentData)
    .select()
    .single()
  
  if (error) throw new Error(`Failed to spawn agent: ${error.message}`)
  
  if (partyId) {
    await getClient().rpc('increment_party_member_count', { party_id: partyId })
  }
  
  return data
}

export async function spawnMultipleAgents(count: number, partyId?: string): Promise<Agent[]> {
  const agents: Agent[] = []
  
  for (let i = 0; i < count; i++) {
    const agent = await spawnAgent(partyId)
    agents.push(agent)
  }
  
  return agents
}

export async function getAllAgents(): Promise<Agent[]> {
  const { data, error } = await getClient()
    .from('agents')
    .select('*')
    .order('created_at', { ascending: true })
  
  if (error) throw new Error(`Failed to fetch agents: ${error.message}`)
  return data ?? []
}

export async function getAgentById(id: string): Promise<Agent | null> {
  const { data, error } = await getClient()
    .from('agents')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error && error.code !== 'PGRST116') throw new Error(`Failed to fetch agent: ${error.message}`)
  return data
}

export async function updateAgentParty(agentId: string, partyId: string | null): Promise<void> {
  const { data: agent } = await getClient()
    .from('agents')
    .select('party_id')
    .eq('id', agentId)
    .single()
  
  if (agent?.party_id) {
    await getClient().rpc('decrement_party_member_count', { party_id: agent.party_id })
  }
  
  await getClient()
    .from('agents')
    .update({ party_id: partyId })
    .eq('id', agentId)
  
  if (partyId) {
    await getClient().rpc('increment_party_member_count', { party_id: partyId })
  }
}

export async function updateAgentTrustScore(agentId: string, delta: number): Promise<void> {
  const { data: agent } = await getClient()
    .from('agents')
    .select('trust_score')
    .eq('id', agentId)
    .single()
  
  if (agent) {
    const newScore = Math.max(0, Math.min(1, agent.trust_score + delta))
    await getClient()
      .from('agents')
      .update({ trust_score: newScore })
      .eq('id', agentId)
  }
}

export { IDEOLOGIES }