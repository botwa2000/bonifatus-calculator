/**
 * Database Type Definitions
 * Auto-generated types for Supabase database
 *
 * TODO: Generate these types using:
 * npx supabase gen types typescript --project-id qvbeleouvaknbhnztmgf > types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          role: 'parent' | 'child'
          full_name: string
          date_of_birth: string | null
          avatar_url: string | null
          preferred_language: string
          theme_preference: 'light' | 'dark' | 'system'
          timezone: string
          notification_preferences: Json
          onboarding_completed: boolean
          terms_accepted_at: string | null
          privacy_policy_accepted_at: string | null
          is_active: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'parent' | 'child'
          full_name: string
          date_of_birth?: string | null
          avatar_url?: string | null
          preferred_language?: string
          theme_preference?: 'light' | 'dark' | 'system'
          timezone?: string
          notification_preferences?: Json
          onboarding_completed?: boolean
          terms_accepted_at?: string | null
          privacy_policy_accepted_at?: string | null
          is_active?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'parent' | 'child'
          full_name?: string
          date_of_birth?: string | null
          avatar_url?: string | null
          preferred_language?: string
          theme_preference?: 'light' | 'dark' | 'system'
          timezone?: string
          notification_preferences?: Json
          onboarding_completed?: boolean
          terms_accepted_at?: string | null
          privacy_policy_accepted_at?: string | null
          is_active?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      verification_codes: {
        Row: {
          id: string
          user_id: string
          code: string
          purpose: 'email_verification' | 'password_reset' | 'email_change'
          expires_at: string
          is_used: boolean
          used_at: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          code: string
          purpose: 'email_verification' | 'password_reset' | 'email_change'
          expires_at: string
          is_used?: boolean
          used_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          code?: string
          purpose?: 'email_verification' | 'password_reset' | 'email_change'
          expires_at?: string
          is_used?: boolean
          used_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      security_events: {
        Row: {
          id: string
          event_type: string
          user_id: string | null
          ip_address: string
          user_agent: string | null
          event_metadata: Json
          severity: 'info' | 'warning' | 'critical'
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          user_id?: string | null
          ip_address: string
          user_agent?: string | null
          event_metadata?: Json
          severity?: 'info' | 'warning' | 'critical'
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          user_id?: string | null
          ip_address?: string
          user_agent?: string | null
          event_metadata?: Json
          severity?: 'info' | 'warning' | 'critical'
          created_at?: string
        }
      }
      rate_limit_tracking: {
        Row: {
          id: string
          identifier: string
          action_type: string
          window_start: string
          attempt_count: number
          last_attempt_at: string
          is_locked: boolean
          locked_until: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          identifier: string
          action_type: string
          window_start: string
          attempt_count?: number
          last_attempt_at?: string
          is_locked?: boolean
          locked_until?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          identifier?: string
          action_type?: string
          window_start?: string
          attempt_count?: number
          last_attempt_at?: string
          is_locked?: boolean
          locked_until?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      languages: {
        Row: {
          code: string
          name_native: string
          name_english: string
          text_direction: 'ltr' | 'rtl'
          is_active: boolean
          display_order: number
          created_at: string
        }
        Insert: {
          code: string
          name_native: string
          name_english: string
          text_direction?: 'ltr' | 'rtl'
          is_active?: boolean
          display_order?: number
          created_at?: string
        }
        Update: {
          code?: string
          name_native?: string
          name_english?: string
          text_direction?: 'ltr' | 'rtl'
          is_active?: boolean
          display_order?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'parent' | 'child'
      theme_preference: 'light' | 'dark' | 'system'
      verification_purpose: 'email_verification' | 'password_reset' | 'email_change'
      event_severity: 'info' | 'warning' | 'critical'
      text_direction: 'ltr' | 'rtl'
    }
  }
}
