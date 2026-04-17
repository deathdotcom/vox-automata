-- Vox Automata Database Schema
-- Tables for Agent Democracy Simulation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PARTIES: Political organizations (must be created first - agents references it)
CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  tagline TEXT DEFAULT '',
  philosophy TEXT DEFAULT '',
  core_beliefs TEXT[] DEFAULT '{}',
  tool_preference TEXT[] DEFAULT '{}',
  risk_tolerance TEXT DEFAULT 'medium',
  preferred_model TEXT DEFAULT 'gemini-flash',
  temperature FLOAT DEFAULT 0.7,
  member_count INTEGER DEFAULT 0,
  approval_rating FLOAT DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TASKS: Work items to be executed
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  result JSONB,
  metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ELECTIONS: Election cycles for tasks
CREATE TABLE elections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id),
  status TEXT DEFAULT 'pending',
  winner_id UUID REFERENCES parties(id),
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- AGENTS: Citizens of the democracy (created after parties)
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  ideology JSONB DEFAULT '{}',
  conviction FLOAT DEFAULT 0.5,
  persuadability FLOAT DEFAULT 0.5,
  expertise TEXT[] DEFAULT '{}',
  party_id UUID REFERENCES parties(id),
  trust_score FLOAT DEFAULT 0.5,
  contribution FLOAT DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VOTES: Individual agent votes
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID REFERENCES elections(id),
  agent_id UUID REFERENCES agents(id),
  party_id UUID REFERENCES parties(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ARGUMENTS: Debate arguments during elections
CREATE TABLE arguments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID REFERENCES elections(id),
  agent_id UUID REFERENCES agents(id),
  proposal_id UUID,
  party_id UUID REFERENCES parties(id),
  position TEXT NOT NULL CHECK (position IN ('support', 'oppose', 'amend', 'question')),
  content TEXT NOT NULL,
  target_agent_id UUID REFERENCES agents(id),
  target_party_id UUID REFERENCES parties(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE arguments ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (can be tightened later)
CREATE POLICY "Allow all for agents" ON agents FOR ALL USING (true);
CREATE POLICY "Allow all for parties" ON parties FOR ALL USING (true);
CREATE POLICY "Allow all for tasks" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all for elections" ON elections FOR ALL USING (true);
CREATE POLICY "Allow all for votes" ON votes FOR ALL USING (true);
CREATE POLICY "Allow all for arguments" ON arguments FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX idx_agents_party ON agents(party_id);
CREATE INDEX idx_elections_task ON elections(task_id);
CREATE INDEX idx_elections_status ON elections(status);
CREATE INDEX idx_votes_election ON votes(election_id);
CREATE INDEX idx_votes_agent ON votes(agent_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_arguments_election ON arguments(election_id);
CREATE INDEX idx_arguments_agent ON arguments(agent_id);
CREATE INDEX idx_arguments_proposal ON arguments(proposal_id);

-- RPC Functions for atomic counter updates
CREATE OR REPLACE FUNCTION increment_party_member_count(party_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE parties
  SET member_count = member_count + 1
  WHERE id = party_id;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_party_member_count(party_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE parties
  SET member_count = member_count - 1
  WHERE id = party_id AND member_count > 0;
END;
$$;