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
      edited_outputs: {
        Row: {
          created_at: string
          edit_notes: string | null
          final_decisions_json: Json
          final_questions_json: Json
          final_tasks_json: Json
          id: string
          run_id: string
        }
        Insert: {
          created_at?: string
          edit_notes?: string | null
          final_decisions_json?: Json
          final_questions_json?: Json
          final_tasks_json?: Json
          id?: string
          run_id: string
        }
        Update: {
          created_at?: string
          edit_notes?: string | null
          final_decisions_json?: Json
          final_questions_json?: Json
          final_tasks_json?: Json
          id?: string
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edited_outputs_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
        ]
      }
      gold_standards: {
        Row: {
          created_at: string
          expected_decisions: Json
          expected_tasks: Json
          expected_things_to_confirm: Json
          id: string
          notes: string | null
          transcript_case_id: string | null
          transcript_text: string
          transcript_title: string
        }
        Insert: {
          created_at?: string
          expected_decisions?: Json
          expected_tasks?: Json
          expected_things_to_confirm?: Json
          id?: string
          notes?: string | null
          transcript_case_id?: string | null
          transcript_text: string
          transcript_title: string
        }
        Update: {
          created_at?: string
          expected_decisions?: Json
          expected_tasks?: Json
          expected_things_to_confirm?: Json
          id?: string
          notes?: string | null
          transcript_case_id?: string | null
          transcript_text?: string
          transcript_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gold_standards_transcript_case_id_fkey"
            columns: ["transcript_case_id"]
            isOneToOne: false
            referencedRelation: "transcript_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      runs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          model_name: string
          parsed_output_json: Json | null
          prompt_version: string
          raw_model_output: string | null
          transcript_case_id: string
          validation_status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          model_name?: string
          parsed_output_json?: Json | null
          prompt_version?: string
          raw_model_output?: string | null
          transcript_case_id: string
          validation_status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          model_name?: string
          parsed_output_json?: Json | null
          prompt_version?: string
          raw_model_output?: string | null
          transcript_case_id?: string
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "runs_transcript_case_id_fkey"
            columns: ["transcript_case_id"]
            isOneToOne: false
            referencedRelation: "transcript_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      transcript_cases: {
        Row: {
          attendees_text: string | null
          created_at: string
          id: string
          template_type: string
          title: string | null
          transcript_text: string
        }
        Insert: {
          attendees_text?: string | null
          created_at?: string
          id?: string
          template_type?: string
          title?: string | null
          transcript_text: string
        }
        Update: {
          attendees_text?: string | null
          created_at?: string
          id?: string
          template_type?: string
          title?: string | null
          transcript_text?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          biggest_pain: string | null
          created_at: string
          email: string
          id: string
          name: string
          referral_source: string | null
          role: string | null
          team_size: string | null
        }
        Insert: {
          biggest_pain?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          referral_source?: string | null
          role?: string | null
          team_size?: string | null
        }
        Update: {
          biggest_pain?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          referral_source?: string | null
          role?: string | null
          team_size?: string | null
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
