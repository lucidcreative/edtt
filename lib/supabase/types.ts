export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          username: string | null
          role: 'teacher' | 'student' | 'admin'
          password_hash: string | null
          pin_hash: string | null
          nickname: string | null
          first_name: string | null
          last_name: string | null
          profile_image_url: string | null
          token_balance: number
          total_tokens_earned: number
          total_tokens_spent: number
          streak_count: number
          last_activity: string | null
          settings: Json | null
          is_active: boolean
          email_verified: boolean
          phone_number: string | null
          emergency_contact: string | null
          grade_level: string | null
          date_of_birth: string | null
          parent_email: string | null
          preferred_language: string | null
          accessibility_needs: string | null
          learning_style: string | null
          bio: string | null
          social_links: Json | null
          achievements: string[] | null
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          username?: string | null
          role?: 'teacher' | 'student' | 'admin'
          password_hash?: string | null
          pin_hash?: string | null
          nickname?: string | null
          first_name?: string | null
          last_name?: string | null
          profile_image_url?: string | null
          token_balance?: number
          total_tokens_earned?: number
          total_tokens_spent?: number
          streak_count?: number
          last_activity?: string | null
          settings?: Json | null
          is_active?: boolean
          email_verified?: boolean
          phone_number?: string | null
          emergency_contact?: string | null
          grade_level?: string | null
          date_of_birth?: string | null
          parent_email?: string | null
          preferred_language?: string | null
          accessibility_needs?: string | null
          learning_style?: string | null
          bio?: string | null
          social_links?: Json | null
          achievements?: string[] | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          username?: string | null
          role?: 'teacher' | 'student' | 'admin'
          password_hash?: string | null
          pin_hash?: string | null
          nickname?: string | null
          first_name?: string | null
          last_name?: string | null
          profile_image_url?: string | null
          token_balance?: number
          total_tokens_earned?: number
          total_tokens_spent?: number
          streak_count?: number
          last_activity?: string | null
          settings?: Json | null
          is_active?: boolean
          email_verified?: boolean
          phone_number?: string | null
          emergency_contact?: string | null
          grade_level?: string | null
          date_of_birth?: string | null
          parent_email?: string | null
          preferred_language?: string | null
          accessibility_needs?: string | null
          learning_style?: string | null
          bio?: string | null
          social_links?: Json | null
          achievements?: string[] | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      classrooms: {
        Row: {
          id: string
          name: string
          description: string | null
          teacher_id: string
          subject: string | null
          grade_level: string | null
          classroom_code: string
          max_students: number | null
          is_active: boolean
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          teacher_id: string
          subject?: string | null
          grade_level?: string | null
          classroom_code: string
          max_students?: number | null
          is_active?: boolean
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          teacher_id?: string
          subject?: string | null
          grade_level?: string | null
          classroom_code?: string
          max_students?: number | null
          is_active?: boolean
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          title: string
          description: string | null
          type: string
          classroom_id: string
          teacher_id: string
          student_id: string | null
          due_date: string | null
          token_reward: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          type: string
          classroom_id: string
          teacher_id: string
          student_id?: string | null
          due_date?: string | null
          token_reward: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          type?: string
          classroom_id?: string
          teacher_id?: string
          student_id?: string | null
          due_date?: string | null
          token_reward?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      proposals: {
        Row: {
          id: string
          assignment_id: string
          student_id: string
          title: string | null
          content: string
          status: string
          priority: string
          progress_percentage: number
          milestones: string[] | null
          completed_milestones: string[] | null
          teacher_feedback: string | null
          submitted_at: string | null
          approved_at: string | null
          is_winner: boolean | null
          selected_at: string | null
          selected_by: string | null
          project_budget: number | null
          payment_type: string | null
          escrow_status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          student_id: string
          title?: string | null
          content: string
          status?: string
          priority?: string
          progress_percentage?: number
          milestones?: string[] | null
          completed_milestones?: string[] | null
          teacher_feedback?: string | null
          submitted_at?: string | null
          approved_at?: string | null
          is_winner?: boolean | null
          selected_at?: string | null
          selected_by?: string | null
          project_budget?: number | null
          payment_type?: string | null
          escrow_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          student_id?: string
          title?: string | null
          content?: string
          status?: string
          priority?: string
          progress_percentage?: number
          milestones?: string[] | null
          completed_milestones?: string[] | null
          teacher_feedback?: string | null
          submitted_at?: string | null
          approved_at?: string | null
          is_winner?: boolean | null
          selected_at?: string | null
          selected_by?: string | null
          project_budget?: number | null
          payment_type?: string | null
          escrow_status?: string | null
          created_at?: string
          updated_at?: string
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}