import { createClient, SupabaseClient } from '@supabase/supabase-js'

export function getSupabase(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.error('[DEBUG] Supabase URL:', supabaseUrl ? 'SET' : 'MISSING')
  console.error('[DEBUG] Supabase Key:', supabaseAnonKey ? 'SET' : 'MISSING')
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      `Supabase environment variables not set. ` +
      `URL: ${supabaseUrl ? 'set' : 'missing'}, ` +
      `KEY: ${supabaseAnonKey ? 'set' : 'missing'}`
    )
  }
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

export type Database = {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string
          name: string
          ideology: Record<string, unknown>
          conviction: number
          persuadability: number
          expertise: string[]
          party_id: string | null
          trust_score: number
          contribution: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          ideology?: Record<string, unknown>
          conviction?: number
          persuadability?: number
          expertise?: string[]
          party_id?: string | null
          trust_score?: number
          contribution?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          ideology?: Record<string, unknown>
          conviction?: number
          persuadability?: number
          expertise?: string[]
          party_id?: string | null
          trust_score?: number
          contribution?: number
          created_at?: string
        }
      }
      parties: {
        Row: {
          id: string
          name: string
          tagline: string
          philosophy: string
          core_beliefs: string[]
          tool_preference: string[]
          risk_tolerance: string
          preferred_model: string
          temperature: number
          member_count: number
          approval_rating: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          tagline?: string
          philosophy?: string
          core_beliefs?: string[]
          tool_preference?: string[]
          risk_tolerance?: string
          preferred_model?: string
          temperature?: number
          member_count?: number
          approval_rating?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          tagline?: string
          philosophy?: string
          core_beliefs?: string[]
          tool_preference?: string[]
          risk_tolerance?: string
          preferred_model?: string
          temperature?: number
          member_count?: number
          approval_rating?: number
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          description: string
          status: string
          result: Record<string, unknown> | null
          metrics: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          description: string
          status?: string
          result?: Record<string, unknown> | null
          metrics?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          description?: string
          status?: string
          result?: Record<string, unknown> | null
          metrics?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
      }
      elections: {
        Row: {
          id: string
          task_id: string
          status: string
          winner_id: string | null
          vote_count: number
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          task_id: string
          status?: string
          winner_id?: string | null
          vote_count?: number
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          task_id?: string
          status?: string
          winner_id?: string | null
          vote_count?: number
          created_at?: string
          completed_at?: string | null
        }
      }
      votes: {
        Row: {
          id: string
          election_id: string
          agent_id: string
          party_id: string
          created_at: string
        }
        Insert: {
          id?: string
          election_id: string
          agent_id: string
          party_id: string
          created_at?: string
        }
        Update: {
          id?: string
          election_id?: string
          agent_id?: string
          party_id?: string
          created_at?: string
        }
      }
      arguments: {
        Row: {
          id: string
          election_id: string
          agent_id: string
          proposal_id: string | null
          party_id: string | null
          position: 'support' | 'oppose' | 'amend' | 'question'
          content: string
          target_agent_id: string | null
          target_party_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          election_id: string
          agent_id: string
          proposal_id?: string | null
          party_id?: string | null
          position: 'support' | 'oppose' | 'amend' | 'question'
          content: string
          target_agent_id?: string | null
          target_party_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          election_id?: string
          agent_id?: string
          proposal_id?: string | null
          party_id?: string | null
          position?: 'support' | 'oppose' | 'amend' | 'question'
          content?: string
          target_agent_id?: string | null
          target_party_id?: string | null
          created_at?: string
        }
      }
    }
  }
}