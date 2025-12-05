/**
 * Supabase generated types
 * (Replace with `npx supabase gen types typescript --project-id <PROJECT_ID> --schema public`)
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      parent_child_invites: {
        Row: {
          id: string
          parent_id: string
          child_id: string | null
          code: string
          status: 'pending' | 'accepted' | 'cancelled' | 'expired'
          expires_at: string
          created_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          parent_id: string
          child_id?: string | null
          code: string
          status?: 'pending' | 'accepted' | 'cancelled' | 'expired'
          expires_at: string
          created_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          parent_id?: string
          child_id?: string | null
          code?: string
          status?: 'pending' | 'accepted' | 'cancelled' | 'expired'
          expires_at?: string
          created_at?: string
          accepted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'parent_child_invites_child_id_fkey'
            columns: ['child_id']
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'parent_child_invites_parent_id_fkey'
            columns: ['parent_id']
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      parent_child_relationships: {
        Row: {
          id: string
          parent_id: string
          child_id: string
          relationship_type: 'parent'
          invitation_status: 'pending' | 'accepted' | 'revoked'
          invited_at: string
          responded_at: string | null
          invited_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          parent_id: string
          child_id: string
          relationship_type?: 'parent'
          invitation_status?: 'pending' | 'accepted' | 'revoked'
          invited_at?: string
          responded_at?: string | null
          invited_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          parent_id?: string
          child_id?: string
          relationship_type?: 'parent'
          invitation_status?: 'pending' | 'accepted' | 'revoked'
          invited_at?: string
          responded_at?: string | null
          invited_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'parent_child_relationships_child_id_fkey'
            columns: ['child_id']
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'parent_child_relationships_invited_by_fkey'
            columns: ['invited_by']
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'parent_child_relationships_parent_id_fkey'
            columns: ['parent_id']
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: 'verification_codes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: 'security_events_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
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
        Relationships: []
      }
      grading_systems: {
        Row: {
          id: string
          code: string | null
          name: string | Record<string, string> | null
          description: string | Record<string, string> | null
          country_code: string | null
          scale_type: 'letter' | 'numeric' | 'percentage'
          best_is_highest: boolean
          min_value: number | null
          max_value: number | null
          passing_threshold: number | null
          grade_definitions: {
            grade?: string | null
            numeric_value?: number | null
            normalized_100?: number | null
            quality_tier?: Database['public']['Enums']['grade_quality_tier'] | null
          }[]
          display_order: number | null
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          code?: string | null
          name?: string | Record<string, string> | null
          description?: string | Record<string, string> | null
          country_code?: string | null
          scale_type: 'letter' | 'numeric' | 'percentage'
          best_is_highest?: boolean
          min_value?: number | null
          max_value?: number | null
          passing_threshold?: number | null
          grade_definitions?: {
            grade?: string | null
            numeric_value?: number | null
            normalized_100?: number | null
            quality_tier?: Database['public']['Enums']['grade_quality_tier'] | null
          }[]
          display_order?: number | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          code?: string | null
          name?: string | Record<string, string> | null
          description?: string | Record<string, string> | null
          country_code?: string | null
          scale_type?: 'letter' | 'numeric' | 'percentage'
          best_is_highest?: boolean
          min_value?: number | null
          max_value?: number | null
          passing_threshold?: number | null
          grade_definitions?: {
            grade?: string | null
            numeric_value?: number | null
            normalized_100?: number | null
            quality_tier?: Database['public']['Enums']['grade_quality_tier'] | null
          }[]
          display_order?: number | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bonus_factor_defaults: {
        Row: {
          id: string
          factor_type: string
          factor_key: string
          factor_value: number
          description: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          factor_type: string
          factor_key: string
          factor_value: number
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          factor_type?: string
          factor_key?: string
          factor_value?: number
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: 'user_bonus_factors_child_id_fkey'
            columns: ['child_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_bonus_factors_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      term_grades: {
        Row: {
          id: string
          child_id: string
          school_year: string
          term_type: Database['public']['Enums']['term_type']
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
          term_type: Database['public']['Enums']['term_type']
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
          term_type?: Database['public']['Enums']['term_type']
          grading_system_id?: string
          class_level?: number
          term_name?: string | null
          status?: string | null
          total_bonus_points?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'term_grades_child_id_fkey'
            columns: ['child_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'term_grades_grading_system_id_fkey'
            columns: ['grading_system_id']
            isOneToOne: false
            referencedRelation: 'grading_systems'
            referencedColumns: ['id']
          },
        ]
      }
      subject_grades: {
        Row: {
          id: string
          term_grade_id: string
          subject_id: string | null
          grade_value: string | null
          grade_numeric: number | null
          grade_normalized_100: number | null
          grade_quality_tier: Database['public']['Enums']['grade_quality_tier'] | null
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
          grade_quality_tier?: Database['public']['Enums']['grade_quality_tier'] | null
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
          grade_quality_tier?: Database['public']['Enums']['grade_quality_tier'] | null
          subject_weight?: number | null
          bonus_points?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'subject_grades_term_grade_id_fkey'
            columns: ['term_grade_id']
            isOneToOne: false
            referencedRelation: 'term_grades'
            referencedColumns: ['id']
          },
        ]
      }
      subjects: {
        Row: {
          id: string
          name: string | Record<string, string>
          description: string | Record<string, string> | null
          category_id: string | null
          is_core_subject: boolean | null
          is_active: boolean
          is_custom: boolean
          display_order: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string | Record<string, string>
          description?: string | Record<string, string> | null
          category_id?: string | null
          is_core_subject?: boolean | null
          is_active?: boolean
          is_custom?: boolean
          display_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string | Record<string, string>
          description?: string | Record<string, string> | null
          category_id?: string | null
          is_core_subject?: boolean | null
          is_active?: boolean
          is_custom?: boolean
          display_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'subjects_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'subject_categories'
            referencedColumns: ['id']
          },
        ]
      }
      subject_categories: {
        Row: {
          id: string
          name: string | Record<string, string>
          description: string | Record<string, string> | null
          display_order: number | null
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string | Record<string, string>
          description?: string | Record<string, string> | null
          display_order?: number | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string | Record<string, string>
          description?: string | Record<string, string> | null
          display_order?: number | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      languages: {
        Row: {
          code: string
          name_native: string
          name_english: string
          text_direction: Database['public']['Enums']['text_direction']
          is_active: boolean
          display_order: number
          created_at: string
        }
        Insert: {
          code: string
          name_native: string
          name_english: string
          text_direction?: Database['public']['Enums']['text_direction']
          is_active?: boolean
          display_order?: number
          created_at?: string
        }
        Update: {
          code?: string
          name_native?: string
          name_english?: string
          text_direction?: Database['public']['Enums']['text_direction']
          is_active?: boolean
          display_order?: number
          created_at?: string
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends { Row: infer R }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] &
        Database['public']['Views'])
    ? (Database['public']['Tables'] &
        Database['public']['Views'])[PublicTableNameOrOptions] extends { Row: infer R }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends keyof Database['public']['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions] extends { Insert: infer I }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof Database['public']['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions] extends { Update: infer U }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends keyof Database['public']['Enums'] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof Database['public']['Enums']
    ? Database['public']['Enums'][PublicEnumNameOrOptions]
    : never
