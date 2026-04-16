import { getSupabase, Database } from '../supabase'
import { getAllAgents } from './agents'
import { getAllParties } from './parties'
import { completeTask, updateTaskStatus, TaskStatus } from './tasks'

type Election = Database['public']['Tables']['elections']['Row']
type ElectionInsert = Database['public']['Tables']['elections']['Insert']
type Vote = Database['public']['Tables']['votes']['Row']

export type ElectionStatus = 'pending' | 'announcement' | 'platforms' | 'debate' | 'campaigning' | 'voting' | 'completed'

function getClient() {
  return getSupabase()
}

const PHASE_DURATION_MS = 2000

export async function createElection(taskId: string): Promise<Election> {
  const electionData: ElectionInsert = {
    task_id: taskId,
    status: 'announcement',
    vote_count: 0,
  }

  const { data, error } = await getClient()
    .from('elections')
    .insert(electionData)
    .select()
    .single()

  if (error) throw new Error(`Failed to create election: ${error.message}`)
  return data
}

export async function getElectionById(id: string): Promise<Election | null> {
  const { data, error } = await getClient()
    .from('elections')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(`Failed to fetch election: ${error.message}`)
  return data
}

export async function getElectionByTaskId(taskId: string): Promise<Election | null> {
  const { data, error } = await getClient()
    .from('elections')
    .select('*')
    .eq('task_id', taskId)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(`Failed to fetch election: ${error.message}`)
  return data
}

export async function updateElectionStatus(electionId: string, status: ElectionStatus): Promise<void> {
  const updateData: Partial<Election> = { status }
  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  }

  await getClient()
    .from('elections')
    .update(updateData)
    .eq('id', electionId)
}

export async function castVote(electionId: string, agentId: string, partyId: string): Promise<Vote> {
  const { data: existingVote } = await getClient()
    .from('votes')
    .select('id')
    .eq('election_id', electionId)
    .eq('agent_id', agentId)
    .single()

  if (existingVote) {
    await getClient()
      .from('votes')
      .update({ party_id: partyId })
      .eq('id', existingVote.id)
    
    const { data: updatedVote } = await getClient()
      .from('votes')
      .select('*')
      .eq('id', existingVote.id)
      .single()
    
    return updatedVote!
  }

  const { data: vote, error } = await getClient()
    .from('votes')
    .insert({ election_id: electionId, agent_id: agentId, party_id: partyId })
    .select()
    .single()

  if (error) throw new Error(`Failed to cast vote: ${error.message}`)
  
  const { data: election } = await getClient()
    .from('elections')
    .select('vote_count')
    .eq('id', electionId)
    .single()
  
  if (election) {
    await getClient()
      .from('elections')
      .update({ vote_count: election.vote_count + 1 })
      .eq('id', electionId)
  }

  return vote
}

export async function getVotesByElection(electionId: string): Promise<Vote[]> {
  const { data, error } = await getClient()
    .from('votes')
    .select('*')
    .eq('election_id', electionId)

  if (error) throw new Error(`Failed to fetch votes: ${error.message}`)
  return data ?? []
}

export async function getElectionResults(electionId: string): Promise<{ partyId: string; votes: number }[]> {
  const votes = await getVotesByElection(electionId)
  
  const partyVotes: Record<string, number> = {}
  for (const vote of votes) {
    partyVotes[vote.party_id] = (partyVotes[vote.party_id] ?? 0) + 1
  }

  return Object.entries(partyVotes)
    .map(([partyId, votes]) => ({ partyId, votes }))
    .sort((a, b) => b.votes - a.votes)
}

export async function tallyVotes(electionId: string): Promise<string | null> {
  const results = await getElectionResults(electionId)
  
  if (results.length === 0) return null
  
  const winner = results[0]
  
  await getClient()
    .from('elections')
    .update({ winner_id: winner.partyId, status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', electionId)

  return winner.partyId
}

function simulateVoteCalculation(
  agentIdeology: Record<string, unknown>,
  partyPlatform: Record<string, unknown>
): number {
  const ideologyName = agentIdeology.name as string
  const partyName = partyPlatform.name as string

  const compatibility: Record<string, Record<string, number>> = {
    'Pragmatist': { 'The Pragmatists': 0.9, 'The Radicals': 0.7, 'The Minimalists': 0.6, 'The Technocrats': 0.5, 'The Conservatives': 0.3 },
    'Conservative': { 'The Conservatives': 0.9, 'The Technocrats': 0.6, 'The Pragmatists': 0.4, 'The Minimalists': 0.5, 'The Radicals': 0.2 },
    'Radical': { 'The Radicals': 0.9, 'The Pragmatists': 0.7, 'The Technocrats': 0.5, 'The Minimalists': 0.4, 'The Conservatives': 0.2 },
    'Technocrat': { 'The Technocrats': 0.9, 'The Conservatives': 0.6, 'The Pragmatists': 0.5, 'The Minimalists': 0.5, 'The Radicals': 0.4 },
    'Minimalist': { 'The Minimalists': 0.9, 'The Conservatives': 0.6, 'The Technocrats': 0.5, 'The Pragmatists': 0.4, 'The Radicals': 0.3 },
  }

  const baseScore = compatibility[ideologyName]?.[partyName] ?? 0.5
  const randomFactor = Math.random() * 0.3
  const persuadability = (agentIdeology.persuadability as number) ?? 0.5
  
  return baseScore + (randomFactor * (1 - persuadability))
}

export async function runFullElection(taskId: string): Promise<{ electionId: string; winnerPartyId: string; details?: Record<string, unknown> }> {
  const election = await createElection(taskId)
  const agents = await getAllAgents()
  const parties = await getAllParties()

  if (agents.length === 0) throw new Error('No agents available for election')
  if (parties.length === 0) throw new Error('No parties available for election')

  await updateTaskStatus(taskId, 'announcement')
  await updateElectionStatus(election.id, 'announcement')
  await new Promise(resolve => setTimeout(resolve, PHASE_DURATION_MS))

  await updateTaskStatus(taskId, 'platforms')
  await updateElectionStatus(election.id, 'platforms')
  await new Promise(resolve => setTimeout(resolve, PHASE_DURATION_MS))

  await updateTaskStatus(taskId, 'debate')
  await updateElectionStatus(election.id, 'debate')
  await new Promise(resolve => setTimeout(resolve, PHASE_DURATION_MS))

  await updateTaskStatus(taskId, 'campaigning')
  await updateElectionStatus(election.id, 'campaigning')
  await new Promise(resolve => setTimeout(resolve, PHASE_DURATION_MS))

  await updateTaskStatus(taskId, 'voting')
  await updateElectionStatus(election.id, 'voting')

  const partyPlatforms: Record<string, Record<string, unknown>> = {}
  for (const party of parties) {
    partyPlatforms[party.id] = { name: party.name, philosophy: party.philosophy }
  }

  for (const agent of agents) {
    if (!agent.party_id) continue
    
    const agentIdeology = agent.ideology as Record<string, unknown>
    const partyPlatform = partyPlatforms[agent.party_id] ?? {}
    
    let bestPartyId = agent.party_id
    let bestScore = -1

    for (const party of parties) {
      const platform = partyPlatforms[party.id] ?? {}
      const score = simulateVoteCalculation(agentIdeology, platform)
      
      if (score > bestScore) {
        bestScore = score
        bestPartyId = party.id
      }
    }

    await castVote(election.id, agent.id, bestPartyId)
  }

  await updateTaskStatus(taskId, 'execution')
  await new Promise(resolve => setTimeout(resolve, PHASE_DURATION_MS))

  const results = await getElectionResults(election.id)
  const votes = await getVotesByElection(election.id)
  
  const agentVotes: { agentId: string; agentName: string; ideology: string; votedFor: string }[] = []
  for (const vote of votes) {
    const agent = agents.find(a => a.id === vote.agent_id)
    const party = parties.find(p => p.id === vote.party_id)
    agentVotes.push({
      agentId: vote.agent_id,
      agentName: agent?.name ?? 'Unknown',
      ideology: (agent?.ideology as Record<string, unknown>)?.name as string ?? 'Unknown',
      votedFor: party?.name ?? 'Unknown',
    })
  }

  const winnerPartyId = await tallyVotes(election.id)
  if (!winnerPartyId) throw new Error('No winner determined')

  const winningParty = parties.find(p => p.id === winnerPartyId)
  const winnerName = winningParty?.name ?? 'Unknown'

  const result = {
    winner: winnerPartyId,
    winnerName: winnerName,
    totalVotes: agents.filter(a => a.party_id).length,
    voteBreakdown: results.map(r => {
      const party = parties.find(p => p.id === r.partyId)
      return {
        partyId: r.partyId,
        partyName: party?.name ?? 'Unknown',
        votes: r.votes,
        percentage: Math.round((r.votes / agents.filter(a => a.party_id).length) * 100),
      }
    }),
    agentVotes,
    timestamp: new Date().toISOString(),
  }

  await completeTask(taskId, result, { 
    winner: winnerPartyId,
    voteBreakdown: result.voteBreakdown,
  })
  await updateTaskStatus(taskId, 'completed')

  return { 
    electionId: election.id, 
    winnerPartyId,
    details: result,
  }
}

export async function getActiveElection(): Promise<Election | null> {
  const { data, error } = await getClient()
    .from('elections')
    .select('*')
    .in('status', ['announcement', 'platforms', 'debate', 'campaigning', 'voting'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(`Failed to fetch active election: ${error.message}`)
  return data
}

export async function getElectionHistory(limit = 10): Promise<Election[]> {
  const { data, error } = await getClient()
    .from('elections')
    .select('*')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to fetch election history: ${error.message}`)
  return data ?? []
}