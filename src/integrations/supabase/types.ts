export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          cover_message: string | null
          created_at: string
          developer_id: string
          id: string
          project_id: string
          proposed_rate_inr: number | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          cover_message?: string | null
          created_at?: string
          developer_id: string
          id?: string
          project_id: string
          proposed_rate_inr?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          cover_message?: string | null
          created_at?: string
          developer_id?: string
          id?: string
          project_id?: string
          proposed_rate_inr?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          agreed_rate_inr: number | null
          application_id: string | null
          created_at: string
          developer_id: string
          ended_at: string | null
          id: string
          project_id: string
          recruiter_id: string
          started_at: string
          status: Database["public"]["Enums"]["contract_status"]
        }
        Insert: {
          agreed_rate_inr?: number | null
          application_id?: string | null
          created_at?: string
          developer_id: string
          ended_at?: string | null
          id?: string
          project_id: string
          recruiter_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["contract_status"]
        }
        Update: {
          agreed_rate_inr?: number | null
          application_id?: string | null
          created_at?: string
          developer_id?: string
          ended_at?: string | null
          id?: string
          project_id?: string
          recruiter_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["contract_status"]
        }
        Relationships: [
          {
            foreignKeyName: "contracts_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_profiles: {
        Row: {
          availability_hours_per_week: number | null
          bio: string | null
          created_at: string
          experience_years: number | null
          github_url: string | null
          headline: string | null
          hourly_rate_inr: number | null
          id: string
          is_verified: boolean
          linkedin_url: string | null
          location: string | null
          portfolio_url: string | null
          skills: string[] | null
          updated_at: string
        }
        Insert: {
          availability_hours_per_week?: number | null
          bio?: string | null
          created_at?: string
          experience_years?: number | null
          github_url?: string | null
          headline?: string | null
          hourly_rate_inr?: number | null
          id: string
          is_verified?: boolean
          linkedin_url?: string | null
          location?: string | null
          portfolio_url?: string | null
          skills?: string[] | null
          updated_at?: string
        }
        Update: {
          availability_hours_per_week?: number | null
          bio?: string | null
          created_at?: string
          experience_years?: number | null
          github_url?: string | null
          headline?: string | null
          hourly_rate_inr?: number | null
          id?: string
          is_verified?: boolean
          linkedin_url?: string | null
          location?: string | null
          portfolio_url?: string | null
          skills?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          application_id: string
          body: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          application_id: string
          body: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          application_id?: string
          body?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget_max_inr: number | null
          budget_min_inr: number | null
          created_at: string
          description: string
          duration_weeks: number | null
          hours_per_week: number | null
          id: string
          project_type: Database["public"]["Enums"]["project_type"]
          recruiter_id: string
          status: Database["public"]["Enums"]["project_status"]
          tech_stack: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          budget_max_inr?: number | null
          budget_min_inr?: number | null
          created_at?: string
          description: string
          duration_weeks?: number | null
          hours_per_week?: number | null
          id?: string
          project_type?: Database["public"]["Enums"]["project_type"]
          recruiter_id: string
          status?: Database["public"]["Enums"]["project_status"]
          tech_stack?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          budget_max_inr?: number | null
          budget_min_inr?: number | null
          created_at?: string
          description?: string
          duration_weeks?: number | null
          hours_per_week?: number | null
          id?: string
          project_type?: Database["public"]["Enums"]["project_type"]
          recruiter_id?: string
          status?: Database["public"]["Enums"]["project_status"]
          tech_stack?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      recruiter_profiles: {
        Row: {
          company_description: string | null
          company_name: string | null
          company_size: string | null
          company_website: string | null
          created_at: string
          id: string
          industry: string | null
          location: string | null
          updated_at: string
        }
        Insert: {
          company_description?: string | null
          company_name?: string | null
          company_size?: string | null
          company_website?: string | null
          created_at?: string
          id: string
          industry?: string | null
          location?: string | null
          updated_at?: string
        }
        Update: {
          company_description?: string | null
          company_name?: string | null
          company_size?: string | null
          company_website?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          location?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          contract_id: string
          created_at: string
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          contract_id: string
          created_at?: string
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          contract_id?: string
          created_at?: string
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          developer_id: string
          github_url: string | null
          id: string
          linkedin_url: string | null
          notes: string | null
          portfolio_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          developer_id: string
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          notes?: string | null
          portfolio_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          developer_id?: string
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          notes?: string | null
          portfolio_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "developer" | "recruiter"
      application_status: "pending" | "accepted" | "rejected" | "withdrawn"
      contract_status: "active" | "completed" | "cancelled"
      project_status: "open" | "in_progress" | "completed" | "closed"
      project_type: "fixed" | "hourly"
      verification_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "developer", "recruiter"],
      application_status: ["pending", "accepted", "rejected", "withdrawn"],
      contract_status: ["active", "completed", "cancelled"],
      project_status: ["open", "in_progress", "completed", "closed"],
      project_type: ["fixed", "hourly"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
