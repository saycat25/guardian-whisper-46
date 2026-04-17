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
      ai_configs: {
        Row: {
          adaptation_level: number
          created_at: string
          enabled: boolean
          id: string
          model: string
          server_id: string
          style: string
          temperature: number
          updated_at: string
        }
        Insert: {
          adaptation_level?: number
          created_at?: string
          enabled?: boolean
          id?: string
          model?: string
          server_id: string
          style?: string
          temperature?: number
          updated_at?: string
        }
        Update: {
          adaptation_level?: number
          created_at?: string
          enabled?: boolean
          id?: string
          model?: string
          server_id?: string
          style?: string
          temperature?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_configs_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: true
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          server_id: string
          value: number | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          server_id: string
          value?: number | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          server_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage: {
        Row: {
          cost_cents: number | null
          created_at: string
          id: string
          period_start: string
          provider: string
          requests: number | null
          server_id: string
          tokens: number | null
        }
        Insert: {
          cost_cents?: number | null
          created_at?: string
          id?: string
          period_start?: string
          provider: string
          requests?: number | null
          server_id: string
          tokens?: number | null
        }
        Update: {
          cost_cents?: number | null
          created_at?: string
          id?: string
          period_start?: string
          provider?: string
          requests?: number | null
          server_id?: string
          tokens?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_settings: {
        Row: {
          created_at: string
          id: string
          language: string | null
          modules: Json
          prefix: string | null
          raw: Json | null
          server_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string | null
          modules?: Json
          prefix?: string | null
          raw?: Json | null
          server_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string | null
          modules?: Json
          prefix?: string | null
          raw?: Json | null
          server_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_settings_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: true
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          channel_id: string | null
          channel_name: string | null
          created_at: string
          id: string
          last_message_at: string
          server_id: string
          title: string | null
          user_discord_id: string | null
          user_display_name: string | null
        }
        Insert: {
          channel_id?: string | null
          channel_name?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          server_id: string
          title?: string | null
          user_discord_id?: string | null
          user_display_name?: string | null
        }
        Update: {
          channel_id?: string | null
          channel_name?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          server_id?: string
          title?: string | null
          user_discord_id?: string | null
          user_display_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_entries: {
        Row: {
          content: string
          created_at: string
          id: string
          key: string | null
          kind: string
          metadata: Json | null
          server_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          key?: string | null
          kind: string
          metadata?: Json | null
          server_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          key?: string | null
          kind?: string
          metadata?: Json | null
          server_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_entries_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          author_name: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: Database["public"]["Enums"]["message_role"]
          server_id: string
        }
        Insert: {
          author_name?: string | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: Database["public"]["Enums"]["message_role"]
          server_id: string
        }
        Update: {
          author_name?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: Database["public"]["Enums"]["message_role"]
          server_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      mod_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          reason: string | null
          server_id: string
          severity: Database["public"]["Enums"]["mod_severity"]
          toxicity_score: number | null
          user_discord_id: string | null
          user_display_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          server_id: string
          severity?: Database["public"]["Enums"]["mod_severity"]
          toxicity_score?: number | null
          user_discord_id?: string | null
          user_display_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          server_id?: string
          severity?: Database["public"]["Enums"]["mod_severity"]
          toxicity_score?: number | null
          user_discord_id?: string | null
          user_display_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mod_logs_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          level: string
          read: boolean
          server_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          level?: string
          read?: boolean
          server_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          level?: string
          read?: boolean
          server_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          discord_id: string | null
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          discord_id?: string | null
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          discord_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      prompts: {
        Row: {
          content: string
          created_at: string
          enabled: boolean
          id: string
          name: string
          scope: string
          scope_ref: string | null
          server_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          scope: string
          scope_ref?: string | null
          server_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          scope?: string
          scope_ref?: string | null
          server_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompts_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      research_history: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          query: string
          result: string | null
          server_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          query: string
          result?: string | null
          server_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          query?: string
          result?: string | null
          server_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_history_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      servers: {
        Row: {
          created_at: string
          discord_guild_id: string
          icon_url: string | null
          id: string
          is_active: boolean
          name: string
          owner_user_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          discord_guild_id: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          owner_user_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          discord_guild_id?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          owner_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          author_name: string | null
          content: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["message_role"]
          server_id: string
          ticket_id: string
        }
        Insert: {
          author_name?: string | null
          content: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["message_role"]
          server_id: string
          ticket_id: string
        }
        Update: {
          author_name?: string | null
          content?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["message_role"]
          server_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
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
          channel_id: string | null
          created_at: string
          id: string
          priority: number
          server_id: string
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_discord_id: string | null
          user_display_name: string | null
        }
        Insert: {
          channel_id?: string | null
          created_at?: string
          id?: string
          priority?: number
          server_id: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_discord_id?: string | null
          user_display_name?: string | null
        }
        Update: {
          channel_id?: string | null
          created_at?: string
          id?: string
          priority?: number
          server_id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_discord_id?: string | null
          user_display_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          server_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          server_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          server_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_server_access: {
        Args: { _server_id: string; _user_id: string }
        Returns: boolean
      }
      has_server_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _server_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_server_admin: {
        Args: { _server_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "moderator" | "viewer"
      message_role: "user" | "assistant" | "system"
      mod_severity: "low" | "medium" | "high" | "critical"
      ticket_status: "open" | "pending" | "resolved" | "closed"
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
      app_role: ["owner", "admin", "moderator", "viewer"],
      message_role: ["user", "assistant", "system"],
      mod_severity: ["low", "medium", "high", "critical"],
      ticket_status: ["open", "pending", "resolved", "closed"],
    },
  },
} as const
