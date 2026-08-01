export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_alerts: {
        Row: {
          created_at: string;
          id: string;
          message: string | null;
          title: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message?: string | null;
          title: string;
          type: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string | null;
          title?: string;
          type?: string;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          cover_message: string | null;
          created_at: string;
          developer_id: string;
          id: string;
          project_id: string;
          proposed_rate_inr: number | null;
          status: Database["public"]["Enums"]["application_status"];
          updated_at: string;
        };
        Insert: {
          cover_message?: string | null;
          created_at?: string;
          developer_id: string;
          id?: string;
          project_id: string;
          proposed_rate_inr?: number | null;
          status?: Database["public"]["Enums"]["application_status"];
          updated_at?: string;
        };
        Update: {
          cover_message?: string | null;
          created_at?: string;
          developer_id?: string;
          id?: string;
          project_id?: string;
          proposed_rate_inr?: number | null;
          status?: Database["public"]["Enums"]["application_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "applications_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_access_requests: {
        Row: {
          created_at: string;
          id: string;
          message: string | null;
          requester_id: string;
          responded_at: string | null;
          status: Database["public"]["Enums"]["contact_access_status"];
          target_id: string;
          updated_at: string;
          request_type: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message?: string | null;
          requester_id: string;
          responded_at?: string | null;
          status?: Database["public"]["Enums"]["contact_access_status"];
          target_id: string;
          updated_at?: string;
          request_type?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string | null;
          requester_id?: string;
          responded_at?: string | null;
          status?: Database["public"]["Enums"]["contact_access_status"];
          target_id?: string;
          updated_at?: string;
          request_type?: string | null;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          created_at: string;
          id: string;
          participant_1_id: string;
          participant_2_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          participant_1_id: string;
          participant_2_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          participant_1_id?: string;
          participant_2_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contracts: {
        Row: {
          agreed_rate_inr: number | null;
          application_id: string | null;
          created_at: string;
          developer_id: string;
          ended_at: string | null;
          id: string;
          project_id: string;
          recruiter_id: string;
          started_at: string;
          status: Database["public"]["Enums"]["contract_status"];
        };
        Insert: {
          agreed_rate_inr?: number | null;
          application_id?: string | null;
          created_at?: string;
          developer_id: string;
          ended_at?: string | null;
          id?: string;
          project_id: string;
          recruiter_id: string;
          started_at?: string;
          status?: Database["public"]["Enums"]["contract_status"];
        };
        Update: {
          agreed_rate_inr?: number | null;
          application_id?: string | null;
          created_at?: string;
          developer_id?: string;
          ended_at?: string | null;
          id?: string;
          project_id?: string;
          recruiter_id?: string;
          started_at?: string;
          status?: Database["public"]["Enums"]["contract_status"];
        };
        Relationships: [
          {
            foreignKeyName: "contracts_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contracts_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      developer_phones: {
        Row: {
          developer_id: string;
          phone: string;
          updated_at: string;
        };
        Insert: {
          developer_id: string;
          phone: string;
          updated_at?: string;
        };
        Update: {
          developer_id?: string;
          phone?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "developer_phones_developer_id_fkey";
            columns: ["developer_id"];
            isOneToOne: true;
            referencedRelation: "developer_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      developer_profiles: {
        Row: {
          active_projects: number;
          total_applications: number;
          total_invitations_received: number;
          certifications: any | null;
          education: any | null;
          languages: any | null;
          portfolio_screenshots: string[] | null;
          developer_slug: string | null;
          availability_hours_per_week: number | null;
          available_days: string[] | null;
          avatar_url: string | null;
          bio: string | null;
          completed_projects: number;
          contact_public: boolean;
          created_at: string;
          developer_type: Database["public"]["Enums"]["developer_type"] | null;
          experience_years: number | null;
          full_name: string | null;
          github_url: string | null;
          headline: string | null;
          hourly_rate_inr: number | null;
          hours_per_day: number | null;
          id: string;
          is_available: boolean;
          is_verified: boolean;
          linkedin_url: string | null;
          location: string | null;
          monthly_rate_inr: number | null;
          portfolio_url: string | null;
          profile_views: number;
          project_min_inr: number | null;
          response_rate: number;
          skills: string[] | null;
          time_slots: string | null;
          updated_at: string;
          weekly_rate_inr: number | null;
          work_preference: Database["public"]["Enums"]["work_preference"] | null;
        };
        Insert: {
          active_projects?: number;
          total_applications?: number;
          total_invitations_received?: number;
          certifications?: any | null;
          education?: any | null;
          languages?: any | null;
          portfolio_screenshots?: string[] | null;
          developer_slug?: string | null;
          availability_hours_per_week?: number | null;
          available_days?: string[] | null;
          avatar_url?: string | null;
          bio?: string | null;
          completed_projects?: number;
          contact_public?: boolean;
          created_at?: string;
          developer_type?: Database["public"]["Enums"]["developer_type"] | null;
          experience_years?: number | null;
          full_name?: string | null;
          github_url?: string | null;
          headline?: string | null;
          hourly_rate_inr?: number | null;
          hours_per_day?: number | null;
          id: string;
          is_available?: boolean;
          is_verified?: boolean;
          linkedin_url?: string | null;
          location?: string | null;
          monthly_rate_inr?: number | null;
          portfolio_url?: string | null;
          profile_views?: number;
          project_min_inr?: number | null;
          response_rate?: number;
          skills?: string[] | null;
          time_slots?: string | null;
          updated_at?: string;
          weekly_rate_inr?: number | null;
          work_preference?: Database["public"]["Enums"]["work_preference"] | null;
        };
        Update: {
          active_projects?: number;
          total_applications?: number;
          total_invitations_received?: number;
          certifications?: any | null;
          education?: any | null;
          languages?: any | null;
          portfolio_screenshots?: string[] | null;
          developer_slug?: string | null;
          availability_hours_per_week?: number | null;
          available_days?: string[] | null;
          avatar_url?: string | null;
          bio?: string | null;
          completed_projects?: number;
          contact_public?: boolean;
          created_at?: string;
          developer_type?: Database["public"]["Enums"]["developer_type"] | null;
          experience_years?: number | null;
          full_name?: string | null;
          github_url?: string | null;
          headline?: string | null;
          hourly_rate_inr?: number | null;
          hours_per_day?: number | null;
          id?: string;
          is_available?: boolean;
          is_verified?: boolean;
          linkedin_url?: string | null;
          location?: string | null;
          monthly_rate_inr?: number | null;
          portfolio_url?: string | null;
          profile_views?: number;
          project_min_inr?: number | null;
          response_rate?: number;
          skills?: string[] | null;
          time_slots?: string | null;
          updated_at?: string;
          weekly_rate_inr?: number | null;
          work_preference?: Database["public"]["Enums"]["work_preference"] | null;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          created_at: string;
          id: string;
          kind: Database["public"]["Enums"]["favorite_kind"];
          target_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind: Database["public"]["Enums"]["favorite_kind"];
          target_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["favorite_kind"];
          target_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      invites: {
        Row: {
          created_at: string;
          developer_id: string;
          id: string;
          message: string | null;
          project_id: string | null;
          recruiter_id: string;
          status: Database["public"]["Enums"]["invite_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          developer_id: string;
          id?: string;
          message?: string | null;
          project_id?: string | null;
          recruiter_id: string;
          status?: Database["public"]["Enums"]["invite_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          developer_id?: string;
          id?: string;
          message?: string | null;
          project_id?: string | null;
          recruiter_id?: string;
          status?: Database["public"]["Enums"]["invite_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          application_id: string | null;
          conversation_id: string | null;
          attachments: Json;
          body: string | null;
          created_at: string;
          id: string;
          read_at: string | null;
          sender_id: string;
        };
        Insert: {
          application_id?: string | null;
          conversation_id?: string | null;
          attachments?: Json;
          body?: string | null;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          sender_id: string;
        };
        Update: {
          application_id?: string | null;
          conversation_id?: string | null;
          attachments?: Json;
          body?: string | null;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          email_sent: boolean;
          id: string;
          link: string | null;
          read_at: string | null;
          title: string;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          email_sent?: boolean;
          id?: string;
          link?: string | null;
          read_at?: string | null;
          title: string;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          email_sent?: boolean;
          id?: string;
          link?: string | null;
          read_at?: string | null;
          title?: string;
          type?: Database["public"]["Enums"]["notification_type"];
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          is_suspended: boolean;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          is_suspended?: boolean;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          is_suspended?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_assignments: {
        Row: {
          assigned_at: string;
          developer_id: string;
          id: string;
          project_id: string;
          recruiter_id: string;
          status: string;
        };
        Insert: {
          assigned_at?: string;
          developer_id: string;
          id?: string;
          project_id: string;
          recruiter_id: string;
          status?: string;
        };
        Update: {
          assigned_at?: string;
          developer_id?: string;
          id?: string;
          project_id?: string;
          recruiter_id?: string;
          status?: string;
        };
        Relationships: [];
      };
      project_stages: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          name: string;
          position: number;
          project_id: string;
          status: Database["public"]["Enums"]["stage_status"];
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          position?: number;
          project_id: string;
          status?: Database["public"]["Enums"]["stage_status"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          position?: number;
          project_id?: string;
          status?: Database["public"]["Enums"]["stage_status"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          project_slug: string | null;
          ai_suggestions: Json | null;
          budget_max_inr: number | null;
          budget_min_inr: number | null;
          created_at: string;
          description: string;
          developer_type: Database["public"]["Enums"]["developer_type"] | null;
          duration_weeks: number | null;
          hiring_type: Database["public"]["Enums"]["hiring_type"] | null;
          hours_per_week: number | null;
          id: string;
          is_featured: boolean;
          project_type: Database["public"]["Enums"]["project_type"];
          recruiter_id: string;
          status: Database["public"]["Enums"]["project_status"];
          tech_stack: string[] | null;
          timeline: string | null;
          title: string;
          updated_at: string;
          work_mode: Database["public"]["Enums"]["work_mode"] | null;
        };
        Insert: {
          project_slug?: string | null;
          ai_suggestions?: Json | null;
          budget_max_inr?: number | null;
          budget_min_inr?: number | null;
          created_at?: string;
          description: string;
          developer_type?: Database["public"]["Enums"]["developer_type"] | null;
          duration_weeks?: number | null;
          hiring_type?: Database["public"]["Enums"]["hiring_type"] | null;
          hours_per_week?: number | null;
          id?: string;
          is_featured?: boolean;
          project_type?: Database["public"]["Enums"]["project_type"];
          recruiter_id: string;
          status?: Database["public"]["Enums"]["project_status"];
          tech_stack?: string[] | null;
          timeline?: string | null;
          title: string;
          updated_at?: string;
          work_mode?: Database["public"]["Enums"]["work_mode"] | null;
        };
        Update: {
          project_slug?: string | null;
          ai_suggestions?: Json | null;
          budget_max_inr?: number | null;
          budget_min_inr?: number | null;
          created_at?: string;
          description?: string;
          developer_type?: Database["public"]["Enums"]["developer_type"] | null;
          duration_weeks?: number | null;
          hiring_type?: Database["public"]["Enums"]["hiring_type"] | null;
          hours_per_week?: number | null;
          id?: string;
          is_featured?: boolean;
          project_type?: Database["public"]["Enums"]["project_type"];
          recruiter_id?: string;
          status?: Database["public"]["Enums"]["project_status"];
          tech_stack?: string[] | null;
          timeline?: string | null;
          title?: string;
          updated_at?: string;
          work_mode?: Database["public"]["Enums"]["work_mode"] | null;
        };
        Relationships: [];
      };
      recruiter_phones: {
        Row: {
          phone: string;
          recruiter_id: string;
          updated_at: string;
        };
        Insert: {
          phone: string;
          recruiter_id: string;
          updated_at?: string;
        };
        Update: {
          phone?: string;
          recruiter_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recruiter_phones_recruiter_id_fkey";
            columns: ["recruiter_id"];
            isOneToOne: true;
            referencedRelation: "recruiter_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      recruiter_profiles: {
        Row: {
          company_slug: string | null;
          avatar_url: string | null;
          company_description: string | null;
          company_name: string | null;
          company_size: string | null;
          company_website: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          industry: string | null;
          is_verified: boolean;
          location: string | null;
          logo_url: string | null;
          updated_at: string;
        };
        Insert: {
          company_slug?: string | null;
          avatar_url?: string | null;
          company_description?: string | null;
          company_name?: string | null;
          company_size?: string | null;
          company_website?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          industry?: string | null;
          is_verified?: boolean;
          location?: string | null;
          logo_url?: string | null;
          updated_at?: string;
        };
        Update: {
          company_slug?: string | null;
          avatar_url?: string | null;
          company_description?: string | null;
          company_name?: string | null;
          company_size?: string | null;
          company_website?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          industry?: string | null;
          is_verified?: boolean;
          location?: string | null;
          logo_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          communication_rating: number | null;
          payment_timeliness_rating: number | null;
          requirement_clarity_rating: number | null;
          professionalism_rating: number | null;
          technical_skills_rating: number | null;
          delivery_quality_rating: number | null;
          timeline_adherence_rating: number | null;
          is_hidden: boolean;
          status: string;
          is_reported: boolean;
          report_reason: string | null;
          comment: string | null;
          contract_id: string;
          created_at: string;
          id: string;
          rating: number;
          reviewee_id: string;
          reviewer_id: string;
        };
        Insert: {
          communication_rating?: number | null;
          payment_timeliness_rating?: number | null;
          requirement_clarity_rating?: number | null;
          professionalism_rating?: number | null;
          technical_skills_rating?: number | null;
          delivery_quality_rating?: number | null;
          timeline_adherence_rating?: number | null;
          is_hidden?: boolean;
          status?: string;
          is_reported?: boolean;
          report_reason?: string | null;
          comment?: string | null;
          contract_id: string;
          created_at?: string;
          id?: string;
          rating: number;
          reviewee_id: string;
          reviewer_id: string;
        };
        Update: {
          communication_rating?: number | null;
          payment_timeliness_rating?: number | null;
          requirement_clarity_rating?: number | null;
          professionalism_rating?: number | null;
          technical_skills_rating?: number | null;
          delivery_quality_rating?: number | null;
          timeline_adherence_rating?: number | null;
          is_hidden?: boolean;
          status?: string;
          is_reported?: boolean;
          report_reason?: string | null;
          comment?: string | null;
          contract_id?: string;
          created_at?: string;
          id?: string;
          rating?: number;
          reviewee_id?: string;
          reviewer_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      verification_requests: {
        Row: {
          admin_notes: string | null;
          created_at: string;
          developer_id: string;
          documents: Json;
          github_url: string | null;
          id: string;
          linkedin_url: string | null;
          notes: string | null;
          portfolio_url: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database["public"]["Enums"]["verification_status"];
          status_history: Json;
          updated_at: string;
        };
        Insert: {
          admin_notes?: string | null;
          created_at?: string;
          developer_id: string;
          documents?: Json;
          github_url?: string | null;
          id?: string;
          linkedin_url?: string | null;
          notes?: string | null;
          portfolio_url?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["verification_status"];
          status_history?: Json;
          updated_at?: string;
        };
        Update: {
          admin_notes?: string | null;
          created_at?: string;
          developer_id?: string;
          documents?: Json;
          github_url?: string | null;
          id?: string;
          linkedin_url?: string | null;
          notes?: string | null;
          portfolio_url?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["verification_status"];
          status_history?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      blogs: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          content: string;
          featured_image: string | null;
          author: string;
          read_time: string | null;
          category: string;
          tags: string[] | null;
          seo_title: string | null;
          seo_description: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          content: string;
          featured_image?: string | null;
          author?: string;
          read_time?: string | null;
          category?: string;
          tags?: string[] | null;
          seo_title?: string | null;
          seo_description?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          content?: string;
          featured_image?: string | null;
          author?: string;
          read_time?: string | null;
          category?: string;
          tags?: string[] | null;
          seo_title?: string | null;
          seo_description?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ndas: {
        Row: {
          id: string;
          project_id: string;
          recruiter_id: string;
          developer_id: string;
          file_url: string | null;
          template_name: string | null;
          template_data: any | null;
          status: "pending" | "accepted" | "rejected" | "viewed" | "sent" | "draft" | "expired";
          developer_ip: string | null;
          accepted_at: string | null;
          rejected_at: string | null;
          viewed_at: string | null;
          file_version: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          recruiter_id: string;
          developer_id: string;
          file_url?: string | null;
          template_name?: string | null;
          template_data?: any | null;
          status?: "pending" | "accepted" | "rejected" | "viewed" | "sent" | "draft" | "expired";
          developer_ip?: string | null;
          accepted_at?: string | null;
          rejected_at?: string | null;
          viewed_at?: string | null;
          file_version?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          recruiter_id?: string;
          developer_id?: string;
          file_url?: string | null;
          template_name?: string | null;
          template_data?: any | null;
          status?: "pending" | "accepted" | "rejected" | "viewed" | "sent" | "draft" | "expired";
          developer_ip?: string | null;
          accepted_at?: string | null;
          rejected_at?: string | null;
          viewed_at?: string | null;
          file_version?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ndas_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      email_logs: {
        Row: {
          id: string;
          recipient_email: string;
          subject: string;
          body: string;
          status: string;
          error_message: string | null;
          email_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_email: string;
          subject: string;
          body: string;
          status: string;
          error_message?: string | null;
          email_type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_email?: string;
          subject?: string;
          body?: string;
          status?: string;
          error_message?: string | null;
          email_type?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          user_id: string;
          email: string;
          role: string;
          subscription_tier: string;
          reminders_disabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email: string;
          role: string;
          subscription_tier?: string;
          reminders_disabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          email?: string;
          role?: string;
          subscription_tier?: string;
          reminders_disabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_stages: {
        Row: {
          id: string;
          project_id: string;
          stage_name: string;
          stage_description: string | null;
          stage_status: "planned" | "in_progress" | "under_review" | "completed" | "blocked" | "pending" | "waiting_for_approval" | "delayed" | "cancelled";
          progress_percent: number;
          deadline: string | null;
          start_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          stage_name: string;
          stage_description?: string | null;
          stage_status?: "planned" | "in_progress" | "under_review" | "completed" | "blocked" | "pending" | "waiting_for_approval" | "delayed" | "cancelled";
          progress_percent?: number;
          deadline?: string | null;
          start_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          stage_name?: string;
          stage_description?: string | null;
          stage_status?: "planned" | "in_progress" | "under_review" | "completed" | "blocked" | "pending" | "waiting_for_approval" | "delayed" | "cancelled";
          progress_percent?: number;
          deadline?: string | null;
          start_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_stages_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      project_activities: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          activity_type: string;
          description: string;
          metadata: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          activity_type: string;
          description: string;
          metadata?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          activity_type?: string;
          description?: string;
          metadata?: any;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_activities_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      notification_preferences: {
        Row: {
          user_id: string;
          in_app_new_projects: boolean;
          email_new_projects: boolean;
          in_app_invites: boolean;
          email_invites: boolean;
          in_app_chat: boolean;
          email_chat: boolean;
          in_app_nda: boolean;
          email_nda: boolean;
          in_app_milestones: boolean;
          email_milestones: boolean;
          in_app_reviews: boolean;
          email_reviews: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          in_app_new_projects?: boolean;
          email_new_projects?: boolean;
          in_app_invites?: boolean;
          email_invites?: boolean;
          in_app_chat?: boolean;
          email_chat?: boolean;
          in_app_nda?: boolean;
          email_nda?: boolean;
          in_app_milestones?: boolean;
          email_milestones?: boolean;
          in_app_reviews?: boolean;
          email_reviews?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          in_app_new_projects?: boolean;
          email_new_projects?: boolean;
          in_app_invites?: boolean;
          email_invites?: boolean;
          in_app_chat?: boolean;
          email_chat?: boolean;
          in_app_nda?: boolean;
          email_nda?: boolean;
          in_app_milestones?: boolean;
          email_milestones?: boolean;
          in_app_reviews?: boolean;
          email_reviews?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_list_user_emails: {
        Args: never;
        Returns: {
          email: string;
          user_id: string;
        }[];
      };
      get_my_email: { Args: never; Returns: string };
      has_contact_access: { Args: { _a: string; _b: string }; Returns: boolean };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      increment_profile_view: {
        Args: { _developer_id: string };
        Returns: undefined;
      };
      is_application_party: {
        Args: { _app_id: string; _user_id: string };
        Returns: boolean;
      };
      is_project_party: {
        Args: { _project_id: string; _user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "developer" | "recruiter";
      application_status: "pending" | "accepted" | "rejected" | "withdrawn" | "shortlisted";
      contact_access_status: "pending" | "approved" | "rejected";
      contract_status: "active" | "completed" | "cancelled";
      developer_type:
        | "frontend"
        | "backend"
        | "fullstack"
        | "mobile"
        | "devops"
        | "data"
        | "ai_ml"
        | "designer"
        | "other";
      favorite_kind: "developer" | "project";
      hiring_type: "part_time" | "weekly" | "monthly" | "ongoing";
      invite_status: "pending" | "accepted" | "rejected" | "withdrawn";
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
        | "invite_rejected"
        | "project_assigned"
        | "new_message"
        | "developer_accepted_project";
      project_status:
        "open" | "in_progress" | "completed" | "closed" | "assigned" | "in_discussion";
      project_type: "fixed" | "hourly";
      stage_status: "planned" | "in_progress" | "under_review" | "completed" | "blocked";
      verification_status: "pending" | "approved" | "rejected";
      work_mode: "remote" | "hybrid" | "onsite";
      work_preference: "part_time" | "full_time" | "both";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "developer", "recruiter"],
      application_status: ["pending", "accepted", "rejected", "withdrawn", "shortlisted"],
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
        "invite_rejected",
        "project_assigned",
        "new_message",
        "developer_accepted_project",
      ],
      project_status: ["open", "in_progress", "completed", "closed", "assigned", "in_discussion"],
      project_type: ["fixed", "hourly"],
      stage_status: ["planned", "in_progress", "under_review", "completed", "blocked"],
      verification_status: ["pending", "approved", "rejected"],
      work_mode: ["remote", "hybrid", "onsite"],
      work_preference: ["part_time", "full_time", "both"],
    },
  },
} as const;
