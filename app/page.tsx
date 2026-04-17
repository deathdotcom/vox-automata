'use client'

import { useState, useEffect } from 'react'

interface Agent {
  id: string
  name: string
  ideology: Record<string, unknown>
  conviction: number
  persuadability: number
  party_id: string | null
  trust_score: number
  created_at: string
}

interface Party {
  id: string
  name: string
  tagline: string
  philosophy: string
  core_beliefs: string[]
  member_count: number
  approval_rating: number
}

interface ElectionResult {
  winner: string
  winnerName: string
  totalVotes: number
  voteBreakdown: { partyId: string; partyName: string; votes: number; percentage: number }[]
  agentVotes: { agentId: string; agentName: string; ideology: string; votedFor: string }[]
  debateSummary?: {
    totalArguments: number
    byPosition: { support: number; oppose: number; amend: number; question: number }
    byParty: { partyId: string; partyName: string; count: number }[]
  }
  timestamp: string
}

interface Task {
  id: string
  description: string
  status: string
  result: ElectionResult | null
  created_at: string
}

interface Election {
  id: string
  task_id: string
  status: string
  winner_id: string | null
  created_at: string
}

interface DebateArgument {
  id: string
  election_id: string
  agent_id: string
  party_id: string | null
  position: 'support' | 'oppose' | 'amend' | 'question'
  content: string
  created_at: string
}

interface DashboardData {
  agents: Agent[]
  parties: Party[]
  tasks: Task[]
  activeElection: Election | null
  activeArguments: DebateArgument[]
  debateSummary: { totalArguments: number; byPosition: Record<string, number>; byParty: { partyId: string; partyName: string; count: number }[] } | null
}

const PARTY_COLORS: Record<string, string> = {
  'The Pragmatists': '#4f8cff',
  'The Conservatives': '#22c55e',
  'The Radicals': '#ef4444',
  'The Technocrats': '#a855f7',
  'The Minimalists': '#eab308',
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData>({ agents: [], parties: [], tasks: [], activeElection: null, activeArguments: [], debateSummary: null })
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [spawnCount, setSpawnCount] = useState(1)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [view, setView] = useState<'dashboard' | 'agents' | 'parties' | 'tasks' | 'elections'>('dashboard')

  const fetchData = async () => {
    try {
      const [agentsRes, partiesRes, tasksRes, electionRes] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/parties'),
        fetch('/api/tasks'),
        fetch('/api/elections?action=active&includeArguments=true'),
      ])
      const agents = await agentsRes.json()
      const parties = await partiesRes.json()
      const tasks = await tasksRes.json()
      const electionData = await electionRes.json()
      
      const activeElection = electionData?.election || null
      const activeArguments = electionData?.arguments || []
      const debateSummary = electionData?.summary || null

      setData({ agents, parties, tasks, activeElection, activeArguments, debateSummary })
      setLoading(false)
    } catch (err) {
      setError('Failed to load dashboard data')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [])

  const initializeArena = async () => {
    setError('')
    setSuccess('')
    try {
      await fetch('/api/parties', { method: 'POST', body: JSON.stringify({ initialize: true }) })
      await fetch('/api/agents', { method: 'POST', body: JSON.stringify({ count: 10 }) })
      setSuccess('Arena initialized with 10 agents and 5 parties')
      fetchData()
    } catch (err) {
      setError('Failed to initialize arena')
    }
  }

  const spawnAgents = async () => {
    setError('')
    setSuccess('')
    try {
      await fetch('/api/agents', { method: 'POST', body: JSON.stringify({ count: spawnCount }) })
      setSuccess(`Spawned ${spawnCount} new agents`)
      fetchData()
    } catch (err) {
      setError('Failed to spawn agents')
    }
  }

  const createTask = async () => {
    setError('')
    setSuccess('')
    if (!newTaskDesc.trim()) {
      setError('Please enter a task description')
      return
    }
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ description: newTaskDesc }),
      })
      const task = await res.json()
      setNewTaskDesc('')
      setSuccess(`Created task: ${task.id.slice(0, 8)}...`)
      fetchData()
    } catch (err) {
      setError('Failed to create task')
    }
  }

  const runElection = async () => {
    setError('')
    setSuccess('')
    const pendingTasks = data.tasks.filter(t => t.status === 'pending')
    if (pendingTasks.length === 0) {
      setError('No pending tasks. Create a task first.')
      return
    }
    try {
      const task = pendingTasks[0]
      await fetch('/api/elections', {
        method: 'POST',
        body: JSON.stringify({ taskId: task.id, runElection: true }),
      })
      setSuccess('Election completed')
      fetchData()
    } catch (err) {
      setError('Failed to run election')
    }
  }

  const ELECTION_PHASES = [
    { key: 'announcement', label: '📢 Announcement', icon: '📢' },
    { key: 'platforms', label: '📜 Party Platforms', icon: '📜' },
    { key: 'debate', label: '🎤 Debate', icon: '🎤' },
    { key: 'campaigning', label: '📣 Campaigning', icon: '📣' },
    { key: 'voting', label: '🗳️ Voting', icon: '🗳️' },
    { key: 'execution', label: '⚙️ Execution', icon: '⚙️' },
  ]

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      announcement: 'Announcement',
      platforms: 'Party Platforms',
      debate: 'Debate',
      campaigning: 'Campaigning',
      voting: 'Voting',
      execution: 'Executing',
      completed: 'Completed',
      failed: 'Failed',
    }
    return labels[status] || status
  }

  const getPartyName = (partyId: string | null) => {
    if (!partyId) return 'Independent'
    const party = data.parties.find(p => p.id === partyId)
    return party?.name || 'Unknown'
  }

  const getPartyColor = (partyId: string | null) => {
    if (!partyId) return '#606070'
    const party = data.parties.find(p => p.id === partyId)
    return PARTY_COLORS[party?.name || ''] || '#606070'
  }

  if (loading) {
    return (
      <div className="container">
        <div className="empty-state">Loading Vox Automata...</div>
      </div>
    )
  }

  const agentCount = data.agents.length
  const partyCount = data.parties.length
  const taskCount = data.tasks.length
  const completedTasks = data.tasks.filter(t => t.status === 'completed').length

  return (
    <div className="container">
      <header className="header">
        <div className="logo">
          <div className="logo-icon">⚡</div>
          <div className="logo-text">Vox Automata</div>
        </div>
        <nav className="nav">
          <button className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>Dashboard</button>
          <button className={`nav-btn ${view === 'agents' ? 'active' : ''}`} onClick={() => setView('agents')}>Agents</button>
          <button className={`nav-btn ${view === 'parties' ? 'active' : ''}`} onClick={() => setView('parties')}>Parties</button>
          <button className={`nav-btn ${view === 'tasks' ? 'active' : ''}`} onClick={() => setView('tasks')}>Tasks</button>
          <button className={`nav-btn ${view === 'elections' ? 'active' : ''}`} onClick={() => setView('elections')}>Elections</button>
        </nav>
      </header>

      {error && <div className="error-text">{error}</div>}
      {success && <div className="success-text">{success}</div>}

      {view === 'dashboard' && (
        <>
          <div className="grid">
            <div className="card">
              <div className="card-header">
                <span className="card-title">Agents</span>
              </div>
              <div className="card-value blue">{agentCount}</div>
              <div className="stat-row">
                <span className="stat-label">With Party</span>
                <span className="stat-value">{data.agents.filter(a => a.party_id).length}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Independent</span>
                <span className="stat-value">{data.agents.filter(a => !a.party_id).length}</span>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Parties</span>
              </div>
              <div className="card-value purple">{partyCount}</div>
              <div className="party-list">
                {data.parties.slice(0, 3).map(party => (
                  <div key={party.id} className="party-item">
                    <div className="party-color" style={{ background: PARTY_COLORS[party.name] || '#606070' }} />
                    <div className="party-info">
                      <div className="party-name">{party.name}</div>
                      <div className="party-tagline">{party.member_count} members</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Tasks</span>
              </div>
              <div className="card-value green">{taskCount}</div>
              <div className="stat-row">
                <span className="stat-label">Completed</span>
                <span className="stat-value">{completedTasks}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Pending</span>
                <span className="stat-value">{taskCount - completedTasks}</span>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Election Status</span>
              </div>
              <div className="election-status">
                <div className={`status-indicator ${data.activeElection ? 'active' : 'pending'}`} />
                <span className="status-text">
                  {data.activeElection ? `Phase: ${getStatusLabel(data.activeElection.status)}` : 'No active election'}
                </span>
              </div>
              {data.activeElection && (
                <div className="stat-row">
                  <span className="stat-label">Election ID</span>
                  <span className="stat-value">{data.activeElection.id.slice(0, 8)}</span>
                </div>
              )}
            </div>
          </div>

          {agentCount === 0 && partyCount === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <h3 style={{ marginBottom: '16px' }}>Welcome to Vox Automata</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Initialize your arena to start the democratic agent simulation
              </p>
              <button className="btn btn-primary" onClick={initializeArena}>
                Initialize Arena
              </button>
            </div>
          )}

          {(agentCount > 0 || partyCount > 0) && (
            <div className="section">
              <h3 className="section-title"><span>▸</span> Quick Actions</h3>
              <div className="btn-row">
                <button className="btn btn-primary" onClick={runElection}>
                  Run Election
                </button>
                <button className="btn btn-secondary" onClick={spawnAgents}>
                  Spawn {spawnCount} Agent(s)
                </button>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={spawnCount}
                  onChange={(e) => setSpawnCount(parseInt(e.target.value) || 1)}
                  style={{ width: '60px', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          )}

          {data.activeElection && (
            <div className="section">
              <h3 className="section-title"><span>▸</span> Active Election</h3>
              <div className="card">
                <div className="election-status">
                  <div className="status-indicator active" />
                  <span className="status-text">{getStatusLabel(data.activeElection.status)}</span>
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  {ELECTION_PHASES.map((phase, idx) => {
                    const currentIdx = ELECTION_PHASES.findIndex(p => p.key === data.activeElection?.status)
                    const isActive = idx === currentIdx
                    const isPast = idx < currentIdx
                    return (
                      <div key={phase.key} style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        flex: 1,
                      }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          background: isActive ? 'var(--accent-blue)' : isPast ? 'var(--accent-green)' : 'var(--bg-tertiary)',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '14px',
                          boxShadow: isActive ? '0 0 12px var(--accent-blue)' : 'none',
                          transition: 'all 0.3s ease',
                        }}>
                          {isPast ? '✓' : phase.icon}
                        </div>
                        <div style={{ 
                          fontSize: '10px', 
                          marginTop: '4px', 
                          color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)',
                          fontWeight: isActive ? 600 : 400,
                          textAlign: 'center',
                        }}>
                          {phase.key}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {data.activeElection.status === 'voting' && (
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '16px', 
                    background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>Agents are voting now!</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>🗳️ Cast Your Vote</div>
                  </div>
                )}
                {data.activeElection.status === 'debate' && (
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '16px', 
                    background: 'linear-gradient(135deg, #ef4444, #f97316)',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>Parties are debating!</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px' }}>🎤 Heated Arguments</div>
                  </div>
                )}
                {data.activeElection.status === 'campaigning' && (
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '16px', 
                    background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>Parties campaigning for votes!</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px' }}>📣 Make Your Case</div>
                  </div>
                )}
                {data.activeElection.status === 'announcement' && (
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '16px', 
                    background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>New election announced!</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px' }}>📢 Election Begins</div>
                  </div>
                )}
                {data.activeElection.status === 'platforms' && (
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '16px', 
                    background: 'linear-gradient(135deg, #10b981, #14b8a6)',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>Parties presenting their platforms!</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px' }}>📜 Party Platforms</div>
                  </div>
                )}
                {data.activeElection.status === 'execution' && (
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '16px', 
                    background: 'linear-gradient(135deg, #f59e0b, #eab308)',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>Winner executing task!</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px' }}>⚙️ Task Execution</div>
                  </div>
                )}
              </div>
              {data.activeArguments.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    📢 Live Debate ({data.activeArguments.length} arguments)
                  </div>
                  <div style={{ 
                    maxHeight: '200px', 
                    overflowY: 'auto', 
                    background: 'var(--bg-tertiary)', 
                    borderRadius: '8px',
                    padding: '12px',
                  }}>
                    {data.activeArguments.slice(-10).reverse().map(arg => {
                      const agent = data.agents.find(a => a.id === arg.agent_id)
                      const party = data.parties.find(p => p.id === arg.party_id)
                      const positionIcons: Record<string, string> = {
                        support: '👍',
                        oppose: '👎',
                        question: '❓',
                        amend: '✏️',
                      }
                      return (
                        <div key={arg.id} style={{ 
                          marginBottom: '8px', 
                          padding: '8px', 
                          background: 'var(--bg-secondary)', 
                          borderRadius: '6px',
                          borderLeft: `3px solid ${PARTY_COLORS[party?.name || ''] || 'var(--accent-blue)'}`,
                        }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {positionIcons[arg.position]} <strong>{agent?.name || 'Unknown'}</strong> ({party?.name || 'Unknown'})
                          </div>
                          <div style={{ fontSize: '12px', marginTop: '4px' }}>{arg.content}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {view === 'agents' && (
        <div className="section">
          <h3 className="section-title"><span>▸</span> Agent Citizens ({agentCount})</h3>
          <div className="card">
            {agentCount === 0 ? (
              <div className="empty-state">No agents yet. Initialize the arena first.</div>
            ) : (
              <div className="agent-list">
                {data.agents.map(agent => (
                  <div key={agent.id} className="agent-chip" style={{ borderColor: getPartyColor(agent.party_id) }}>
                    <span style={{ color: getPartyColor(agent.party_id) }}>●</span> {agent.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'parties' && (
        <div className="section">
          <h3 className="section-title"><span>▸</span> Political Parties ({partyCount})</h3>
          <div className="grid">
            {data.parties.map(party => (
              <div key={party.id} className="card">
                <div className="party-item" style={{ marginBottom: '16px' }}>
                  <div className="party-color" style={{ background: PARTY_COLORS[party.name] || '#606070', width: '16px', height: '16px' }} />
                  <div className="party-info">
                    <div className="party-name" style={{ fontSize: '16px' }}>{party.name}</div>
                    <div className="party-tagline">{party.tagline}</div>
                  </div>
                  <div className="party-members">{party.member_count}</div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>{party.philosophy}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {party.core_beliefs.map((belief, i) => (
                    <span key={i} style={{ background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {belief}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'tasks' && (
        <div className="section">
          <h3 className="section-title"><span>▸</span> Tasks ({taskCount})</h3>
          <div className="card" style={{ marginBottom: '24px' }}>
            <textarea
              className="task-input"
              placeholder="Enter task description... (e.g., 'Fix the login bug in the authentication module')"
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
            />
            <div className="btn-row">
              <button className="btn btn-primary" onClick={createTask}>Create Task</button>
            </div>
          </div>
          <div className="party-list">
            {data.tasks.map(task => {
              const isCompleted = task.status === 'completed'
              return (
                <div key={task.id} className="party-item">
                  <div className="party-color" style={{ 
                    background: task.status === 'completed' ? 'var(--accent-green)' : 
                               task.status === 'failed' ? 'var(--accent-red)' : 'var(--accent-yellow)' 
                  }} />
                  <div className="party-info">
                    <div className="party-name">{task.description}</div>
                    <div className="party-tagline">ID: {task.id.slice(0, 8)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '12px', background: 'var(--bg-tertiary)', fontSize: '12px' }}>
                      {getStatusLabel(task.status)}
                    </span>
                    {isCompleted && (
                      <button 
                        onClick={async () => {
                          setError('')
                          setSuccess('')
                          try {
                            await fetch('/api/elections', {
                              method: 'POST',
                              body: JSON.stringify({ taskId: task.id, runElection: true }),
                            })
                            setSuccess(`Re-elected for: ${task.description.slice(0, 30)}...`)
                            fetchData()
                          } catch (err) {
                            setError('Failed to rerun election')
                          }
                        }}
                        style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          background: 'var(--accent-blue)', 
                          color: 'white',
                          fontSize: '11px',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        🔄 Rerun
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {taskCount === 0 && <div className="empty-state">No tasks yet</div>}
          </div>
        </div>
      )}

      {view === 'elections' && (
        <div className="section">
          <h3 className="section-title"><span>▸</span> Election Results</h3>
          
          {data.tasks.filter(t => t.result && t.status === 'completed').length === 0 ? (
            <div className="card">
              <div className="empty-state">No completed elections yet. Run an election to see results.</div>
            </div>
          ) : (
            data.tasks
              .filter(t => t.result && t.status === 'completed')
              .map(task => {
                const result = task.result as ElectionResult
                const hasDetails = result && result.voteBreakdown && result.agentVotes
                return (
                  <div key={task.id} className="card" style={{ marginBottom: '24px' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Task</div>
                      <div style={{ fontSize: '16px', fontWeight: 600 }}>{task.description}</div>
                    </div>
                    
                    {hasDetails ? (
                      <>
                        <div style={{ 
                          background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))', 
                          padding: '16px', 
                          borderRadius: '12px', 
                          marginBottom: '16px' 
                        }}>
                          <div style={{ fontSize: '12px', opacity: 0.8 }}>Winner</div>
                          <div style={{ fontSize: '24px', fontWeight: 700 }}>{result.winnerName || 'Unknown'}</div>
                          <div style={{ fontSize: '14px', opacity: 0.9 }}>{result.totalVotes} votes cast</div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Vote Breakdown</div>
                          {result.voteBreakdown?.map((party: any) => (
                            <div key={party.partyId} style={{ marginBottom: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '14px' }}>{party.partyName}</span>
                                <span style={{ fontSize: '14px', fontWeight: 600 }}>{party.votes} votes ({party.percentage}%)</span>
                              </div>
                              <div style={{ background: 'var(--bg-tertiary)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ 
                                  width: `${party.percentage}%`, 
                                  height: '100%', 
                                  background: PARTY_COLORS[party.partyName] || 'var(--accent-blue)',
                                  borderRadius: '4px',
                                }} />
                              </div>
                            </div>
                          ))}
                        </div>

                        {result.debateSummary && (
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Debate Activity</div>
                            <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}>
                              <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                                <span style={{ color: 'var(--accent-green)' }}>✓</span> {result.debateSummary.totalArguments} arguments made
                              </div>
                              <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                                <span>👍 {result.debateSummary.byPosition?.support || 0}</span>
                                <span>👎 {result.debateSummary.byPosition?.oppose || 0}</span>
                                <span>❓ {result.debateSummary.byPosition?.question || 0}</span>
                                <span>✏️ {result.debateSummary.byPosition?.amend || 0}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div>
                          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Individual Votes</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {result.agentVotes?.map((av: any) => (
                              <div key={av.agentId} style={{ 
                                background: 'var(--bg-tertiary)', 
                                padding: '8px 12px', 
                                borderRadius: '8px',
                                fontSize: '12px',
                              }}>
                                <div style={{ fontWeight: 600 }}>{av.agentName}</div>
                                <div style={{ color: 'var(--text-muted)' }}>Ideology: {av.ideology}</div>
                                <div style={{ color: PARTY_COLORS[av.votedFor] || 'var(--text-secondary)' }}>→ {av.votedFor}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 600 }}>Winner: {result?.winner || 'Unknown'}</div>
                        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Basic result (no vote details)</div>
                      </div>
                    )}
                  </div>
                )
              })
          )}
        </div>
      )}
    </div>
  )
}