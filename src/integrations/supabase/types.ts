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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          daily_license_count: number
          email: string
          id: string
          last_license_date: string | null
          last_login: string | null
          password_hash: string | null
          plan: string
          role: string
          username: string | null
        }
        Insert: {
          created_at?: string | null
          daily_license_count?: number
          email: string
          id?: string
          last_license_date?: string | null
          last_login?: string | null
          password_hash?: string | null
          plan?: string
          role?: string
          username?: string | null
        }
        Update: {
          created_at?: string | null
          daily_license_count?: number
          email?: string
          id?: string
          last_license_date?: string | null
          last_login?: string | null
          password_hash?: string | null
          plan?: string
          role?: string
          username?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          author_id: string
          author_name: string | null
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          author_name?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          author_name?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: string | null
          id: string
          ip_address: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      discord_bot_logs: {
        Row: {
          action: string
          bot_id: string | null
          created_at: string | null
          details: string | null
          id: string
        }
        Insert: {
          action: string
          bot_id?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
        }
        Update: {
          action?: string
          bot_id?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discord_bot_logs_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "discord_bots"
            referencedColumns: ["id"]
          },
        ]
      }
      discord_bots: {
        Row: {
          bot_name: string
          bot_token_encrypted: string
          created_at: string
          id: string
          is_running: boolean
          last_started_at: string | null
          last_stopped_at: string | null
          log_channel_id: string | null
          status: string
          ticket_category_id: string | null
          tickets_open: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bot_name?: string
          bot_token_encrypted: string
          created_at?: string
          id?: string
          is_running?: boolean
          last_started_at?: string | null
          last_stopped_at?: string | null
          log_channel_id?: string | null
          status?: string
          ticket_category_id?: string | null
          tickets_open?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bot_name?: string
          bot_token_encrypted?: string
          created_at?: string
          id?: string
          is_running?: boolean
          last_started_at?: string | null
          last_stopped_at?: string | null
          log_channel_id?: string | null
          status?: string
          ticket_category_id?: string | null
          tickets_open?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      licenses: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          hwid: string | null
          id: string
          ip_address: string | null
          last_validated: string | null
          license_key: string
          max_ips: number | null
          notes: string | null
          owner_email: string | null
          owner_name: string | null
          port: number | null
          resource_name: string
          status: string | null
          updated_at: string | null
          validation_count: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          hwid?: string | null
          id?: string
          ip_address?: string | null
          last_validated?: string | null
          license_key: string
          max_ips?: number | null
          notes?: string | null
          owner_email?: string | null
          owner_name?: string | null
          port?: number | null
          resource_name: string
          status?: string | null
          updated_at?: string | null
          validation_count?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          hwid?: string | null
          id?: string
          ip_address?: string | null
          last_validated?: string | null
          license_key?: string
          max_ips?: number | null
          notes?: string | null
          owner_email?: string | null
          owner_name?: string | null
          port?: number | null
          resource_name?: string
          status?: string | null
          updated_at?: string | null
          validation_count?: number | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          success: boolean
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          username?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          sender_id: string
          sender_name: string
          sender_role: string | null
          ticket_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          sender_id: string
          sender_name: string
          sender_role?: string | null
          ticket_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          sender_id?: string
          sender_name?: string
          sender_role?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_name: string | null
          assigned_to: string | null
          closed_at: string | null
          created_at: string | null
          id: string
          priority: string | null
          status: string
          subject: string
          updated_at: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          assigned_name?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string | null
          id?: string
          priority?: string | null
          status?: string
          subject: string
          updated_at?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          assigned_name?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string | null
          id?: string
          priority?: string | null
          status?: string
          subject?: string
          updated_at?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      user_webhooks: {
        Row: {
          created_at: string | null
          enabled: boolean
          event_type: string
          id: string
          updated_at: string | null
          user_id: string
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean
          event_type: string
          id?: string
          updated_at?: string | null
          user_id: string
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean
          event_type?: string
          id?: string
          updated_at?: string | null
          user_id?: string
          webhook_url?: string
        }
        Relationships: []
      }
      validation_logs: {
        Row: {
          error_message: string | null
          id: string
          ip_address: string | null
          license_id: string | null
          license_key: string | null
          result: string | null
          success: boolean | null
          validated_at: string | null
        }
        Insert: {
          error_message?: string | null
          id?: string
          ip_address?: string | null
          license_id?: string | null
          license_key?: string | null
          result?: string | null
          success?: boolean | null
          validated_at?: string | null
        }
        Update: {
          error_message?: string | null
          id?: string
          ip_address?: string | null
          license_id?: string | null
          license_key?: string | null
          result?: string | null
          success?: boolean | null
          validated_at?: string | null
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
