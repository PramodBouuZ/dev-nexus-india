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
      contact_access_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          requester_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["contact_access_status"]
          target_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          requester_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["contact_access_status"]
          target_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          requester_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["contact_access_status"]
          target_id?: string
          updated_at?: string
        }
        Relationships: []
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
          available_days: string[] | null
          bio: string | null
          contact_public: boolean
          created_at: string
          developer_type: Database["public"]["Enums"]["developer_type"] | null
          experience_years: number | null
          github_url: string | null
          headline: string | null
          hourly_rate_inr: number | null
          hours_per_day: number | null
          id: string
          is_verified: boolean
          linkedin_url: string | null
          location: string | null
          monthly_rate_inr: number | null
          phone: string | null
          portfolio_url: string | null
          project_min_inr: number | null
          skills: string[] | null
          time_slots: string | null
          updated_at: string
          weekly_rate_inr: number | null
          work_preference: Database["public"]["Enums"]["work_preference"] | null
        }
        Insert: {
          availability_hours_per_week?: number | null
          available_days?: string[] | null
          bio?: string | null
          contact_public?: boolean
          created_at?: string
          developer_type?: Database["public"]["Enums"]["developer_type"] | null
          experience_years?: number | null
          github_url?: string | null
          headline?: string | null
          hourly_rate_inr?: number | null
          hours_per_day?: number | null
          id: string
          is_verified?: boolean
          linkedin_url?: string | null
          location?: string | null
          monthly_rate_inr?: number | null
          phone?: string | null
          portfolio_url?: string | null
          project_min_inr?: number | null
          skills?: string[] | null
          time_slots?: string | null
          updated_at?: string
          weekly_rate_inr?: number | null
          work_preference?:
            | Database["public"]["Enums"]["work_preference"]
            | null
        }
        Update: {
          availability_hours_per_week?: number | null
          available_days?: string[] | null
          bio?: string | null
          contact_public?: boolean
          created_at?: string
          developer_type?: Database["public"]["Enums"]["developer_type"] | null
          experience_years?: number | null
          github_url?: string | null
          headline?: string | null
          hourly_rate_inr?: number | null
          hours_per_day?: number | null
          id?: string
          is_verified?: boolean
          linkedin_url?: string | null
          location?: string | null
          monthly_rate_inr?: number | null
          phone?: string | null
          portfolio_url?: string | null
          project_min_inr?: number | null
          skills?: string[] | null
          time_slots?: string | null
          updated_at?: string
          weekly_rate_inr?: number | null
          work_preference?:
            | Database["public"]["Enums"]["work_preference"]
            | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["favorite_kind"]
          target_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["favorite_kind"]
          target_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["favorite_kind"]
          target_id?: string
          user_id?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          created_at: string
          developer_id: string
          id: string
          message: string | null
          project_id: string | null
          recruiter_id: string
          status: Database["public"]["Enums"]["invite_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          developer_id: string
          id?: string
          message?: string | null
          project_id?: string | null
          recruiter_id: string
          status?: Database["public"]["Enums"]["invite_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          developer_id?: string
          id?: string
          message?: string | null
          project_id?: string | null
          recruiter_id?: string
          status?: Database["public"]["Enums"]["invite_status"]
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          application_id: string
          attachments: Json
          body: string | null
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          application_id: string
          attachments?: Json
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          application_id?: string
          attachments?: Json
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
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
      notifications: {
        Row: {
          body: string | null
          created_at: string
          email_sent: boolean
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          email_sent?: boolean
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          email_sent?: boolean
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
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
      project_stages: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          name: string
          position: number
          project_id: string
          status: Database["public"]["Enums"]["stage_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          name: string
          position?: number
          project_id: string
          status?: Database["public"]["Enums"]["stage_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          name?: string
          position?: number
          project_id?: string
          status?: Database["public"]["Enums"]["stage_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          ai_suggestions: Json | null
          budget_max_inr: number | null
          budget_min_inr: number | null
          created_at: string
          description: string
          developer_type: Database["public"]["Enums"]["developer_type"] | null
          duration_weeks: number | null
          hiring_type: Database["public"]["Enums"]["hiring_type"] | null
          hours_per_week: number | null
          id: string
          project_type: Database["public"]["Enums"]["project_type"]
          recruiter_id: string
          status: Database["public"]["Enums"]["project_status"]
          tech_stack: string[] | null
          timeline: string | null
          title: string
          updated_at: string
          work_mode: Database["public"]["Enums"]["work_mode"] | null
        }
        Insert: {
          ai_suggestions?: Json | null
          budget_max_inr?: number | null
          budget_min_inr?: number | null
          created_at?: string
          description: string
          developer_type?: Database["public"]["Enums"]["developer_type"] | null
          duration_weeks?: number | null
          hiring_type?: Database["public"]["Enums"]["hiring_type"] | null
          hours_per_week?: number | null
          id?: string
          project_type?: Database["public"]["Enums"]["project_type"]
          recruiter_id: string
          status?: Database["public"]["Enums"]["project_status"]
          tech_stack?: string[] | null
          timeline?: string | null
          title: string
          updated_at?: string
          work_mode?: Database["public"]["Enums"]["work_mode"] | null
        }
        Update: {
          ai_suggestions?: Json | null
          budget_max_inr?: number | null
          budget_min_inr?: number | null
          created_at?: string
          description?: string
          developer_type?: Database["public"]["Enums"]["developer_type"] | null
          duration_weeks?: number | null
          hiring_type?: Database["public"]["Enums"]["hiring_type"] | null
          hours_per_week?: number | null
          id?: string
          project_type?: Database["public"]["Enums"]["project_type"]
          recruiter_id?: string
          status?: Database["public"]["Enums"]["project_status"]
          tech_stack?: string[] | null
          timeline?: string | null
          title?: string
          updated_at?: string
          work_mode?: Database["public"]["Enums"]["work_mode"] | null
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
          logo_url: string | null
          phone: string | null
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
          logo_url?: string | null
          phone?: string | null
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
          logo_url?: string | null
          phone?: string | null
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
          documents: Json
          github_url: string | null
          id: string
          linkedin_url: string | null
          notes: string | null
          portfolio_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          status_history: Json
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          developer_id: string
          documents?: Json
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          notes?: string | null
          portfolio_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          status_history?: Json
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          developer_id?: string
          documents?: Json
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          notes?: string | null
          portfolio_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          status_history?: Json
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_contact_access: { Args: { _a: string; _b: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_application_party: {
        Args: { _app_id: string; _user_id: string }
        Returns: boolean
      }
      is_project_party: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "developer" | "recruiter"
      application_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "withdrawn"
        | "shortlisted"
      contact_access_status: "pending" | "approved" | "rejected"
      contract_status: "active" | "completed" | "cancelled"
      developer_type:
        | "frontend"
        | "backend"
        | "fullstack"
        | "mobile"
        | "devops"
        | "data"
        | "ai_ml"
        | "designer"
        | "other"
      favorite_kind: "developer" | "project"
      hiring_type: "part_time" | "weekly" | "monthly" | "ongoing"
      invite_status: "pending" | "accepted" | "rejected" | "withdrawn"
      notification_type:
        | "new_matching_project"
        | "new_application"
        | "application_accepted"
        | "application_rejected"
        | "recruiter_invite"
        | "invite_accepted"
        | "contact_request"
        | "contact_approved"
        | "contact_rejected"
        | "project_update"
        | "account_update"
        | "welcome"
        | "stage_update"
      project_status: "open" | "in_progress" | "completed" | "closed"
      project_type: "fixed" | "hourly"
      stage_status:
        | "planned"
        | "in_progress"
        | "under_review"
        | "completed"
        | "blocked"
      verification_status: "pending" | "approved" | "rejected"
      work_mode: "remote" | "hybrid" | "onsite"
      work_preference: "part_time" | "full_time" | "both"
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
      application_status: [
        "pending",
        "accepted",
        "rejected",
        "withdrawn",
        "shortlisted",
      ],
      contact_access_status: ["pending", "approved", "rejected"],
      contract_status: ["active", "completed", "cancelled"],
      developer_type: [
        "frontend",
        "backend",
        "fullstack",
        "mobile",
        "devops",
        "data",
        "ai_ml",
        "designer",
        "other",
      ],
      favorite_kind: ["developer", "project"],
      hiring_type: ["part_time", "weekly", "monthly", "ongoing"],
      invite_status: ["pending", "accepted", "rejected", "withdrawn"],
      notification_type: [
        "new_matching_project",
        "new_application",
        "application_accepted",
        "application_rejected",
        "recruiter_invite",
        "invite_accepted",
        "contact_request",
        "contact_approved",
        "contact_rejected",
        "project_update",
        "account_update",
        "welcome",
        "stage_update",
      ],
      project_status: ["open", "in_progress", "completed", "closed"],
      project_type: ["fixed", "hourly"],
      stage_status: [
        "planned",
        "in_progress",
        "under_review",
        "completed",
        "blocked",
      ],
      verification_status: ["pending", "approved", "rejected"],
      work_mode: ["remote", "hybrid", "onsite"],
      work_preference: ["part_time", "full_time", "both"],
    },
  },
} as const
