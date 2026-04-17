import { getSupabase, Database } from '../supabase'
import { getAllAgents } from './agents'
import { getAllParties } from './parties'

type Argument = Database['public']['Tables']['arguments']['Row']
type ArgumentInsert = Database['public']['Tables']['arguments']['Insert']

function getClient() {
  return getSupabase()
}

export type ArgumentPosition = 'support' | 'oppose' | 'amend' | 'question'

export async function createArgument(
  electionId: string,
  agentId: string,
  position: ArgumentPosition,
  content: string,
  options?: {
    proposalId?: string
    partyId?: string
    targetAgentId?: string
    targetPartyId?: string
  }
): Promise<Argument> {
  const argumentData: ArgumentInsert = {
    election_id: electionId,
    agent_id: agentId,
    position,
    content,
    proposal_id: options?.proposalId ?? null,
    party_id: options?.partyId ?? null,
    target_agent_id: options?.targetAgentId ?? null,
    target_party_id: options?.targetPartyId ?? null,
  }

  const { data, error } = await getClient()
    .from('arguments')
    .insert(argumentData)
    .select()
    .single()

  if (error) throw new Error(`Failed to create argument: ${error.message}`)
  return data
}

export async function getArgumentsByElection(electionId: string): Promise<Argument[]> {
  const { data, error } = await getClient()
    .from('arguments')
    .select('*')
    .eq('election_id', electionId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Failed to fetch arguments: ${error.message}`)
  return data ?? []
}

export async function getArgumentsByAgent(agentId: string): Promise<Argument[]> {
  const { data, error } = await getClient()
    .from('arguments')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch arguments: ${error.message}`)
  return data ?? []
}

const POSITION_PROMPTS = {
  support: [
    "I support this approach because it directly addresses: {task}",
    "This solution effectively tackles {task} while maintaining our principles.",
    "For {task}, this approach provides the most balanced path forward.",
    "I believe this is the right solution for achieving {task}.",
  ],
  oppose: [
    "I oppose this because it fails to address: {task}",
    "This approach contradicts what {task} really needs.",
    "For {task}, this would lead to unintended consequences.",
    "This doesn't solve {task} - it only addresses symptoms.",
  ],
  amend: [
    "What if we modified this approach for {task} by adding {improvement}?",
    "I'd like to propose an amendment that addresses {task} with {change}.",
    "Consider this alternative for {task}: {alternative}",
    "Can we adapt this to better handle {task}?",
  ],
  question: [
    "How does this address {task} specifically?",
    "What evidence supports this approach for {task}?",
    "Can you clarify how this achieves {task}?",
    "Does this solution scale for {task}?",
  ],
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function extractTaskKeyPhrase(taskDescription: string): string {
  const words = taskDescription.split(' ').slice(0, 12).join(' ')
  return words.length > 60 ? words.slice(0, 60) + '...' : words
}

function generateArgumentContent(
  position: ArgumentPosition,
  party: { name: string; philosophy: string },
  taskDescription: string,
  targetPartyName?: string
): string {
  const prompt = getRandomItem(POSITION_PROMPTS[position])
  const taskKeyPhrase = extractTaskKeyPhrase(taskDescription)
  
  const fillers: Record<string, string> = {
    task: taskKeyPhrase,
    improvement: 'clearer metrics and accountability',
    change: 'stakeholder input',
    alternative: 'a phased implementation',
  }

  return prompt.replace(/\{(\w+)\}/g, (_, key) => fillers[key] || 'the issue')
}

function selectTargetParty(parties: Database['public']['Tables']['parties']['Row'][], excludePartyId?: string): Database['public']['Tables']['parties']['Row'] | null {
  const available = parties.filter(p => p.id !== excludePartyId)
  if (available.length === 0) return null
  return getRandomItem(available)
}

export async function runDebatePhase(electionId: string, taskDescription: string): Promise<Argument[]> {
  const agents = await getAllAgents()
  const parties = await getAllParties()

  const argumentsCreated: Argument[] = []
  const numRounds = 3

  for (let round = 0; round < numRounds; round++) {
    for (const agent of agents) {
      if (!agent.party_id) continue

      const party = parties.find(p => p.id === agent.party_id)
      if (!party) continue

      const targetParty = selectTargetParty(parties, party.id)
      
      const positions: ArgumentPosition[] = ['support', 'oppose', 'question']
      const position = getRandomItem(positions)

      const content = generateArgumentContent(position, party, taskDescription, targetParty?.name)

      const arg = await createArgument(electionId, agent.id, position, content, {
        partyId: party.id,
        targetPartyId: targetParty?.id,
      })

      argumentsCreated.push(arg)
    }
  }

  return argumentsCreated
}

export async function getDebateSummary(electionId: string): Promise<{
  totalArguments: number
  byPosition: Record<ArgumentPosition, number>
  byParty: { partyId: string; partyName: string; count: number }[]
}> {
  const arguments_ = await getArgumentsByElection(electionId)

  const byPosition: Record<ArgumentPosition, number> = {
    support: 0,
    oppose: 0,
    amend: 0,
    question: 0,
  }

  const partyCounts: Record<string, number> = {}

  for (const arg of arguments_) {
    byPosition[arg.position]++
    if (arg.party_id) {
      partyCounts[arg.party_id] = (partyCounts[arg.party_id] || 0) + 1
    }
  }

  const parties = await getAllParties()
  const byParty = Object.entries(partyCounts).map(([partyId, count]) => ({
    partyId,
    partyName: parties.find(p => p.id === partyId)?.name || 'Unknown',
    count,
  }))

  return {
    totalArguments: arguments_.length,
    byPosition,
    byParty,
  }
}