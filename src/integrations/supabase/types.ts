export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          age: number;
          created_at: string | null;
          email: string | null;
          id: string;
          name: string;
          username: string | null;
          updated_at: string | null;
          mfa_enabled: boolean;
          last_login: string | null;
        };
        Insert: {
          age: number;
          created_at?: string | null;
          email?: string | null;
          id: string;
          name: string;
          username?: string | null;
          updated_at?: string | null;
          mfa_enabled?: boolean;
          last_login?: string | null;
        };
        Update: {
          age?: number;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          name?: string;
          username?: string | null;
          updated_at?: string | null;
          mfa_enabled?: boolean;
          last_login?: string | null;
        };
        Relationships: [];
      };
      recommendations: {
        Row: {
          author: string | null;
          content_type: string;
          created_at: string | null;
          description: string | null;
          director: string | null;
          explanation: string | null;
          genre: string | null;
          id: string;
          is_favorited: boolean | null;
          poster_url: string | null;
          rating: number | null;
          title: string;
          type: string;
          user_id: string;
          year: number | null;
        };
        Insert: {
          author?: string | null;
          content_type?: string;
          created_at?: string | null;
          description?: string | null;
          director?: string | null;
          explanation?: string | null;
          genre?: string | null;
          id?: string;
          is_favorited?: boolean | null;
          poster_url?: string | null;
          rating?: number | null;
          title: string;
          type: string;
          user_id: string;
          year?: number | null;
        };
        Update: {
          author?: string | null;
          content_type?: string;
          created_at?: string | null;
          description?: string | null;
          director?: string | null;
          explanation?: string | null;
          genre?: string | null;
          id?: string;
          is_favorited?: boolean | null;
          poster_url?: string | null;
          rating?: number | null;
          title?: string;
          type?: string;
          user_id?: string;
          year?: number | null;
        };
        Relationships: [];
      };
      mfa_factors: {
        Row: {
          id: string;
          user_id: string;
          factor_type: string;
          factor_id: string;
          is_verified: boolean;
          enrolled_at: string | null;
          last_used_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          factor_type?: string;
          factor_id: string;
          is_verified?: boolean;
          enrolled_at?: string | null;
          last_used_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          factor_type?: string;
          factor_id?: string;
          is_verified?: boolean;
          enrolled_at?: string | null;
          last_used_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          ip_address: string | null;
          user_agent: string | null;
          device_name: string | null;
          device_type: string | null;
          browser_name: string | null;
          browser_version: string | null;
          os_name: string | null;
          os_version: string | null;
          is_current_device: boolean;
          last_activity: string;
          created_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          ip_address?: string | null;
          user_agent?: string | null;
          device_name?: string | null;
          device_type?: string | null;
          browser_name?: string | null;
          browser_version?: string | null;
          os_name?: string | null;
          os_version?: string | null;
          is_current_device?: boolean;
          last_activity?: string;
          created_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          device_name?: string | null;
          device_type?: string | null;
          browser_name?: string | null;
          browser_version?: string | null;
          os_name?: string | null;
          os_version?: string | null;
          is_current_device?: boolean;
          last_activity?: string;
          created_at?: string;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
