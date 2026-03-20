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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      import_rows: {
        Row: {
          action: Database["public"]["Enums"]["change_action"] | null
          field_diffs: Json | null
          id: string
          import_id: string
          is_duplicate: boolean
          normalized: Json
          raw_values: Json
          row_index: number
          showtime_id: string | null
        }
        Insert: {
          action?: Database["public"]["Enums"]["change_action"] | null
          field_diffs?: Json | null
          id?: string
          import_id: string
          is_duplicate?: boolean
          normalized: Json
          raw_values: Json
          row_index: number
          showtime_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["change_action"] | null
          field_diffs?: Json | null
          id?: string
          import_id?: string
          is_duplicate?: boolean
          normalized?: Json
          raw_values?: Json
          row_index?: number
          showtime_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_rows_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_rows_showtime_id_fkey"
            columns: ["showtime_id"]
            isOneToOne: false
            referencedRelation: "showtimes"
            referencedColumns: ["id"]
          },
        ]
      }
      imports: {
        Row: {
          applied_at: string | null
          created_at: string
          created_by: string | null
          filename: string
          id: string
          status: Database["public"]["Enums"]["import_status"]
          theater_id: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          created_by?: string | null
          filename: string
          id?: string
          status?: Database["public"]["Enums"]["import_status"]
          theater_id: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          created_by?: string | null
          filename?: string
          id?: string
          status?: Database["public"]["Enums"]["import_status"]
          theater_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "imports_theater_id_fkey"
            columns: ["theater_id"]
            isOneToOne: false
            referencedRelation: "theaters"
            referencedColumns: ["id"]
          },
        ]
      }
      showtime_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          import_id: string | null
          new_values: Json
          old_values: Json
          showtime_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          import_id?: string | null
          new_values: Json
          old_values: Json
          showtime_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          import_id?: string | null
          new_values?: Json
          old_values?: Json
          showtime_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "showtime_history_showtime_id_fkey"
            columns: ["showtime_id"]
            isOneToOne: false
            referencedRelation: "showtimes"
            referencedColumns: ["id"]
          },
        ]
      }
      showtimes: {
        Row: {
          auditorium: string
          created_at: string
          end_time: string
          format: string
          id: string
          language: string
          last_updated: string
          movie_title: string
          rating: string | null
          start_time: string
          status: Database["public"]["Enums"]["showtime_status"]
          theater_id: string
          updated_at: string
        }
        Insert: {
          auditorium: string
          created_at?: string
          end_time: string
          format: string
          id?: string
          language?: string
          last_updated: string
          movie_title: string
          rating?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["showtime_status"]
          theater_id: string
          updated_at?: string
        }
        Update: {
          auditorium?: string
          created_at?: string
          end_time?: string
          format?: string
          id?: string
          language?: string
          last_updated?: string
          movie_title?: string
          rating?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["showtime_status"]
          theater_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "showtimes_theater_id_fkey"
            columns: ["theater_id"]
            isOneToOne: false
            referencedRelation: "theaters"
            referencedColumns: ["id"]
          },
        ]
      }
      theaters: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_import: {
        Args: { p_import_id: string; p_user_id?: string }
        Returns: undefined
      }
      clear_schedule: {
        Args: { p_theater_id: string; p_user_id?: string }
        Returns: number
      }
      get_active_showtimes: {
        Args: {
          p_date?: string
          p_format?: string
          p_movie?: string
          p_theater_id: string
        }
        Returns: {
          auditorium: string
          created_at: string
          end_time: string
          format: string
          id: string
          language: string
          last_updated: string
          movie_title: string
          rating: string | null
          start_time: string
          status: Database["public"]["Enums"]["showtime_status"]
          theater_id: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "showtimes"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      normalize_title: { Args: { raw: string }; Returns: string }
      schedule_summary: {
        Args: { p_theater_id: string }
        Returns: {
          formats: string[]
          movies_showing: number
          total_active: number
          total_archived: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      title_similarity: { Args: { a: string; b: string }; Returns: number }
    }
    Enums: {
      archive_reason: "import_drop" | "clear_schedule" | "manual"
      change_action: "add" | "update" | "archive"
      import_status: "pending" | "previewing" | "applied" | "cancelled"
      showtime_status: "active" | "archived"
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
      archive_reason: ["import_drop", "clear_schedule", "manual"],
      change_action: ["add", "update", "archive"],
      import_status: ["pending", "previewing", "applied", "cancelled"],
      showtime_status: ["active", "archived"],
    },
  },
} as const
