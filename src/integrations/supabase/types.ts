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
      chat_messages: {
        Row: {
          client_id: string
          content: string
          created_at: string
          id: string
          organization_id: string | null
          role: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string
          id?: string
          organization_id?: string | null
          role: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          adherence: number | null
          client_id: string
          created_at: string
          id: string
          mood: string | null
          notes: string | null
          organization_id: string | null
          weight: number | null
        }
        Insert: {
          adherence?: number | null
          client_id: string
          created_at?: string
          id?: string
          mood?: string | null
          notes?: string | null
          organization_id?: string | null
          weight?: number | null
        }
        Update: {
          adherence?: number | null
          client_id?: string
          created_at?: string
          id?: string
          mood?: string | null
          notes?: string | null
          organization_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      diets: {
        Row: {
          ai_content: Json | null
          approved_at: string | null
          client_id: string
          created_at: string
          guidance: string | null
          id: string
          nutritionist_id: string | null
          organization_id: string | null
          pdf_url: string | null
          questionnaire_id: string | null
          shopping_list: Json | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_content?: Json | null
          approved_at?: string | null
          client_id: string
          created_at?: string
          guidance?: string | null
          id?: string
          nutritionist_id?: string | null
          organization_id?: string | null
          pdf_url?: string | null
          questionnaire_id?: string | null
          shopping_list?: Json | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          ai_content?: Json | null
          approved_at?: string | null
          client_id?: string
          created_at?: string
          guidance?: string | null
          id?: string
          nutritionist_id?: string | null
          organization_id?: string | null
          pdf_url?: string | null
          questionnaire_id?: string | null
          shopping_list?: Json | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diets_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          channel: string
          created_at: string
          diet_id: string | null
          error_message: string | null
          id: string
          organization_id: string | null
          payload: Json | null
          recipient_email: string
          sent_at: string | null
          status: string
          subject: string
          template_name: string
          user_id: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          diet_id?: string | null
          error_message?: string | null
          id?: string
          organization_id?: string | null
          payload?: Json | null
          recipient_email: string
          sent_at?: string | null
          status?: string
          subject: string
          template_name: string
          user_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          diet_id?: string | null
          error_message?: string | null
          id?: string
          organization_id?: string | null
          payload?: Json | null
          recipient_email?: string
          sent_at?: string | null
          status?: string
          subject?: string
          template_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_diet_id_fkey"
            columns: ["diet_id"]
            isOneToOne: false
            referencedRelation: "diets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      food_substitutions: {
        Row: {
          created_at: string
          equivalencia: string
          food_id: string
          id: string
          observacoes: string | null
          organization_id: string | null
          substitute_food_id: string
        }
        Insert: {
          created_at?: string
          equivalencia?: string
          food_id: string
          id?: string
          observacoes?: string | null
          organization_id?: string | null
          substitute_food_id: string
        }
        Update: {
          created_at?: string
          equivalencia?: string
          food_id?: string
          id?: string
          observacoes?: string | null
          organization_id?: string | null
          substitute_food_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_substitutions_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_substitutions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_substitutions_substitute_food_id_fkey"
            columns: ["substitute_food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          ativo: boolean
          calorias: number
          carboidratos: number
          categoria: string
          codigo_taco: string | null
          created_at: string
          fibras: number | null
          gorduras: number
          id: string
          nome: string
          observacoes: string | null
          organization_id: string | null
          porcao_referencia: string
          proteinas: number
          sodio: number | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          calorias?: number
          carboidratos?: number
          categoria: string
          codigo_taco?: string | null
          created_at?: string
          fibras?: number | null
          gorduras?: number
          id?: string
          nome: string
          observacoes?: string | null
          organization_id?: string | null
          porcao_referencia?: string
          proteinas?: number
          sodio?: number | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          calorias?: number
          carboidratos?: number
          categoria?: string
          codigo_taco?: string | null
          created_at?: string
          fibras?: number | null
          gorduras?: number
          id?: string
          nome?: string
          observacoes?: string | null
          organization_id?: string | null
          porcao_referencia?: string
          proteinas?: number
          sodio?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "foods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      pdf_logs: {
        Row: {
          client_id: string
          created_at: string
          diet_id: string
          file_path: string
          generated_by: string
          id: string
          organization_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          diet_id: string
          file_path: string
          generated_by: string
          id?: string
          organization_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          diet_id?: string
          file_path?: string
          generated_by?: string
          id?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdf_logs_diet_id_fkey"
            columns: ["diet_id"]
            isOneToOne: false
            referencedRelation: "diets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          organization_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaires: {
        Row: {
          answers: Json
          client_id: string
          created_at: string
          id: string
          organization_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          answers?: Json
          client_id: string
          created_at?: string
          id?: string
          organization_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          answers?: Json
          client_id?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionnaires_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          code: string
          created_at: string
          currency: string
          description: string | null
          features: Json
          id: string
          max_clients: number
          max_diets_per_month: number
          max_pdfs_per_month: number
          name: string
          price_cents: number
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          max_clients?: number
          max_diets_per_month?: number
          max_pdfs_per_month?: number
          name: string
          price_cents?: number
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          max_clients?: number
          max_diets_per_month?: number
          max_pdfs_per_month?: number
          name?: string
          price_cents?: number
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          checkout_url: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          organization_id: string
          payment_status: string | null
          plan_id: string
          provider: string | null
          provider_subscription_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          checkout_url?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          organization_id: string
          payment_status?: string | null
          plan_id: string
          provider?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          checkout_url?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          organization_id?: string
          payment_status?: string | null
          plan_id?: string
          provider?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_counters: {
        Row: {
          active_clients: number
          chat_messages: number
          created_at: string
          diets_generated: number
          emails_sent: number
          id: string
          organization_id: string
          pdfs_generated: number
          period_month: number
          period_year: number
          updated_at: string
        }
        Insert: {
          active_clients?: number
          chat_messages?: number
          created_at?: string
          diets_generated?: number
          emails_sent?: number
          id?: string
          organization_id: string
          pdfs_generated?: number
          period_month: number
          period_year: number
          updated_at?: string
        }
        Update: {
          active_clients?: number
          chat_messages?: number
          created_at?: string
          diets_generated?: number
          emails_sent?: number
          id?: string
          organization_id?: string
          pdfs_generated?: number
          period_month?: number
          period_year?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_counters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          error: string | null
          event_type: string
          id: string
          payload: Json | null
          provider: string
          status: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          provider: string
          status?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          provider?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bump_usage: {
        Args: { _by?: number; _field: string; _org: string }
        Returns: undefined
      }
      check_org_limit: { Args: { _field: string; _org: string }; Returns: Json }
      get_user_organization_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "nutricionista" | "cliente" | "super_admin"
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
      app_role: ["admin", "nutricionista", "cliente", "super_admin"],
    },
  },
} as const
