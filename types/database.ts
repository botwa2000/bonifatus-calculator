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
      grading_systems: {
        Row: {
          id: string
          name: string | null
          scale_type: string | null
          best_is_highest: boolean | null
          min_value: number | null
          max_value: number | null
          grade_definitions: {
            grade?: string | null
            normalized_100?: number | null
            quality_tier?: 'best' | 'second' | 'third' | 'below' | null
          }[]
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Partial<GradingSystemInsert>
        Update: Partial<GradingSystemInsert>
      }
      bonus_factor_defaults: {
        Row: {
          id: string
          factor_type: string
          factor_key: string
          factor_value: number
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          factor_type: string
          factor_key: string
          factor_value: number
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          factor_type?: string
          factor_key?: string
          factor_value?: number
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      user_bonus_factors: {
        Row: {
          id: string
          user_id: string
          child_id: string | null
          factor_type: string
          factor_key: string
          factor_value: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          child_id?: string | null
          factor_type: string
          factor_key: string
          factor_value: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          child_id?: string | null
          factor_type?: string
          factor_key?: string
          factor_value?: number
          created_at?: string | null
          updated_at?: string | null
        }
      }
      term_grades: {
        Row: {
          id: string
          child_id: string
          school_year: string
          term_type: 'midterm' | 'final' | 'semester' | 'quarterly'
          grading_system_id: string
          class_level: number
          term_name: string | null
          status: string | null
          total_bonus_points: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          child_id: string
          school_year: string
          term_type: 'midterm' | 'final' | 'semester' | 'quarterly'
          grading_system_id: string
          class_level: number
          term_name?: string | null
          status?: string | null
          total_bonus_points?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          child_id?: string
          school_year?: string
          term_type?: 'midterm' | 'final' | 'semester' | 'quarterly'
          grading_system_id?: string
          class_level?: number
          term_name?: string | null
          status?: string | null
          total_bonus_points?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      subject_grades: {
        Row: {
          id: string
          term_grade_id: string
          subject_id: string | null
          grade_value: string | null
          grade_numeric: number | null
          grade_normalized_100: number | null
          grade_quality_tier: 'best' | 'second' | 'third' | 'below' | null
          subject_weight: number | null
          bonus_points: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          term_grade_id: string
          subject_id?: string | null
          grade_value?: string | null
          grade_numeric?: number | null
          grade_normalized_100?: number | null
          grade_quality_tier?: 'best' | 'second' | 'third' | 'below' | null
          subject_weight?: number | null
          bonus_points?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          term_grade_id?: string
          subject_id?: string | null
          grade_value?: string | null
          grade_numeric?: number | null
          grade_normalized_100?: number | null
          grade_quality_tier?: 'best' | 'second' | 'third' | 'below' | null
          subject_weight?: number | null
          bonus_points?: number | null
          created_at?: string | null
          updated_at?: string | null
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
      grade_quality_tier: 'best' | 'second' | 'third' | 'below'
      term_type: 'midterm' | 'final' | 'semester' | 'quarterly'
    }
  }
}

type GradingSystemInsert = {
  id?: string
  name?: string | null
  scale_type?: string | null
  best_is_highest?: boolean | null
  min_value?: number | null
  max_value?: number | null
  grade_definitions?: {
    grade?: string | null
    normalized_100?: number | null
    quality_tier?: 'best' | 'second' | 'third' | 'below' | null
  }[]
  is_active?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}
