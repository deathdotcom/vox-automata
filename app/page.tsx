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

interface Task {
  id: string
  description: string
  status: string
  result: Record<string, unknown> | null
  created_at: string
}

interface Election {
  id: string
  task_id: string
  status: string
  winner_id: string | null
  created_at: string
}

interface DashboardData {
  agents: Agent[]
  parties: Party[]
  tasks: Task[]
  activeElection: Election | null
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
  const [data, setData] = useState<DashboardData>({ agents: [], parties: [], tasks: [], activeElection: null })
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
        fetch('/api/elections?action=active'),
      ])
      const agents = await agentsRes.json()
      const parties = await partiesRes.json()
      const tasks = await tasksRes.json()
      const activeElection = await electionRes.json()

      setData({ agents, parties, tasks, activeElection })
      setLoading(false)
    } catch (err) {
      setError('Failed to load dashboard data')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
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
            {data.tasks.map(task => (
              <div key={task.id} className="party-item">
                <div className="party-color" style={{ 
                  background: task.status === 'completed' ? 'var(--accent-green)' : 
                             task.status === 'failed' ? 'var(--accent-red)' : 'var(--accent-yellow)' 
                }} />
                <div className="party-info">
                  <div className="party-name">{task.description}</div>
                  <div className="party-tagline">ID: {task.id.slice(0, 8)}</div>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: '12px', background: 'var(--bg-tertiary)', fontSize: '12px' }}>
                  {getStatusLabel(task.status)}
                </span>
              </div>
            ))}
            {taskCount === 0 && <div className="empty-state">No tasks yet</div>}
          </div>
        </div>
      )}

      {view === 'elections' && (
        <div className="section">
          <h3 className="section-title"><span>▸</span> Elections</h3>
          <div className="card">
            <div className="election-status">
              <div className={`status-indicator ${data.activeElection ? 'active' : 'pending'}`} />
              <span className="status-text">
                {data.activeElection 
                  ? `Active Election - ${getStatusLabel(data.activeElection.status)}`
                  : 'No active election'}
              </span>
            </div>
            {data.activeElection && (
              <div style={{ marginTop: '16px' }}>
                <div className="stat-row">
                  <span className="stat-label">Election ID</span>
                  <span className="stat-value">{data.activeElection.id}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Task ID</span>
                  <span className="stat-value">{data.activeElection.task_id.slice(0, 8)}...</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Winner</span>
                  <span className="stat-value">{data.activeElection.winner_id || 'TBD'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}