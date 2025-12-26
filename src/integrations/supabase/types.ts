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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          bot_token: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          meta_app_id: string | null
          meta_token: string | null
          phone_number: string | null
          phone_number_id: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          updated_at: string | null
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          bot_token?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          meta_app_id?: string | null
          meta_token?: string | null
          phone_number?: string | null
          phone_number_id?: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          updated_at?: string | null
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          bot_token?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          meta_app_id?: string | null
          meta_token?: string | null
          phone_number?: string | null
          phone_number_id?: string | null
          platform?: Database["public"]["Enums"]["platform_type"]
          updated_at?: string | null
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      booking_configurations: {
        Row: {
          ai_instructions: string | null
          business_type: string
          created_at: string | null
          custom_fields: Json | null
          hospital_departments: Json | null
          id: string
          is_active: boolean | null
          require_appointment_date: boolean | null
          require_appointment_time: boolean | null
          require_check_in_date: boolean | null
          require_check_out_date: boolean | null
          require_customer_email: boolean | null
          require_customer_name: boolean | null
          require_customer_phone: boolean | null
          require_department: boolean | null
          require_doctor_name: boolean | null
          require_number_of_guests: boolean | null
          require_number_of_people: boolean | null
          require_reason_for_visit: boolean | null
          require_reservation_date: boolean | null
          require_reservation_time: boolean | null
          require_room_type: boolean | null
          require_special_requests: boolean | null
          require_table_preference: boolean | null
          restaurant_opening_hours: Json | null
          hotel_rooms_available: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_instructions?: string | null
          business_type: string
          created_at?: string | null
          custom_fields?: Json | null
          hospital_departments?: Json | null
          id?: string
          is_active?: boolean | null
          require_appointment_date?: boolean | null
          require_appointment_time?: boolean | null
          require_check_in_date?: boolean | null
          require_check_out_date?: boolean | null
          require_customer_email?: boolean | null
          require_customer_name?: boolean | null
          require_customer_phone?: boolean | null
          require_department?: boolean | null
          require_doctor_name?: boolean | null
          require_number_of_guests?: boolean | null
          require_number_of_people?: boolean | null
          require_reason_for_visit?: boolean | null
          require_reservation_date?: boolean | null
          require_reservation_time?: boolean | null
          require_room_type?: boolean | null
          require_special_requests?: boolean | null
          require_table_preference?: boolean | null
          restaurant_opening_hours?: Json | null
          hotel_rooms_available?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_instructions?: string | null
          business_type?: string
          created_at?: string | null
          custom_fields?: Json | null
          hospital_departments?: Json | null
          id?: string
          is_active?: boolean | null
          require_appointment_date?: boolean | null
          require_appointment_time?: boolean | null
          require_check_in_date?: boolean | null
          require_check_out_date?: boolean | null
          require_customer_email?: boolean | null
          require_customer_name?: boolean | null
          require_customer_phone?: boolean | null
          require_department?: boolean | null
          require_doctor_name?: boolean | null
          require_number_of_guests?: boolean | null
          require_number_of_people?: boolean | null
          require_reason_for_visit?: boolean | null
          require_reservation_date?: boolean | null
          require_reservation_time?: boolean | null
          require_room_type?: boolean | null
          require_special_requests?: boolean | null
          require_table_preference?: boolean | null
          restaurant_opening_hours?: Json | null
          hotel_rooms_available?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_configurations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          content: string
          created_at: string | null
          file_url: string | null
          id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          file_url?: string | null
          id?: string
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          file_url?: string | null
          id?: string
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      message_logs: {
        Row: {
          ai_response: string
          created_at: string | null
          customer_id: string | null
          id: string
          message_text: string
          platform: Database["public"]["Enums"]["platform_type"]
          user_id: string
        }
        Insert: {
          ai_response: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          message_text: string
          platform: Database["public"]["Enums"]["platform_type"]
          user_id: string
        }
        Update: {
          ai_response?: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          message_text?: string
          platform?: Database["public"]["Enums"]["platform_type"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          knowledge_base_limit: number | null
          message_limit: number
          messages_used: number
          plan: Database["public"]["Enums"]["subscription_plan"]
          platform: Database["public"]["Enums"]["platform_type"] | null
          products_limit: number | null
          max_chars_per_item: number | null
          started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          knowledge_base_limit?: number | null
          message_limit?: number
          messages_used?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          platform?: Database["public"]["Enums"]["platform_type"] | null
          products_limit?: number | null
          max_chars_per_item?: number | null
          started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          knowledge_base_limit?: number | null
          message_limit?: number
          messages_used?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          platform?: Database["public"]["Enums"]["platform_type"] | null
          products_limit?: number | null
          max_chars_per_item?: number | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_products: {
        Row: {
          id: string
          user_id: string
          name: string
          price: number | null
          details: string | null
          category: string | null
          quantity: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          price?: number | null
          details?: string | null
          category?: string | null
          quantity?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          price?: number | null
          details?: string | null
          category?: string | null
          quantity?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          booking_type: string
          check_in_date: string | null
          check_out_date: string | null
          created_at: string | null
          customer_email: string | null
          customer_id: string
          customer_name: string | null
          customer_phone: string | null
          department: string | null
          doctor_name: string | null
          id: string
          notes: string | null
          number_of_guests: number | null
          number_of_people: number | null
          platform: Database["public"]["Enums"]["platform_type"]
          reservation_date: string | null
          reservation_time: string | null
          room_type: string | null
          status: string
          reason_for_visit: string | null
          table_preference: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          booking_type: string
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_id: string
          customer_name?: string | null
          customer_phone?: string | null
          department?: string | null
          doctor_name?: string | null
          id?: string
          notes?: string | null
          number_of_guests?: number | null
          number_of_people?: number | null
          platform: Database["public"]["Enums"]["platform_type"]
          reservation_date?: string | null
          reservation_time?: string | null
          room_type?: string | null
          status?: string
          reason_for_visit?: string | null
          table_preference?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          booking_type?: string
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string
          customer_name?: string | null
          customer_phone?: string | null
          department?: string | null
          doctor_name?: string | null
          id?: string
          notes?: string | null
          number_of_guests?: number | null
          number_of_people?: number | null
          platform?: Database["public"]["Enums"]["platform_type"]
          reservation_date?: string | null
          reservation_time?: string | null
          room_type?: string | null
          status?: string
          reason_for_visit?: string | null
          table_preference?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      increment_message_count: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      platform_type: "whatsapp"
      subscription_plan: "free" | "starter" | "enterprise" | "custom"
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
      app_role: ["admin", "user"],
      platform_type: ["whatsapp"],
      subscription_plan: ["free", "starter", "enterprise", "custom"],
    },
  },
} as const
