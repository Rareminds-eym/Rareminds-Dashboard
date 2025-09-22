export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      blog_posts: {
        Row: {
          category: string
          content: string
          created_at: string
          excerpt: string
          featured_image: string
          alt_image: string
          id: string
          meta_description: string
          meta_title: string
          slug: string
          subcategory: string
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          excerpt: string
          featured_image: string
          alt_image: string
          id?: string
          meta_description: string
          meta_title: string
          slug: string
          subcategory: string
          tags: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          featured_image?: string
          alt_image?: string
          id?: string
          meta_description?: string
          meta_title?: string
          slug?: string
          subcategory?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blogs_draft: {
        Row: {
          category: string
          content: string
          created_at: string
          excerpt: string
          featured_image: string
          alt_image: string
          id: number
          meta_description: string
          meta_title: string
          publish_date: string | null
          slug: string
          subcategory: string
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          excerpt: string
          featured_image: string
          alt_image: string
          id?: number
          meta_description: string
          meta_title: string
          publish_date?: string | null
          slug: string
          subcategory: string
          tags: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          featured_image?: string
          alt_image?: string
          id?: number
          meta_description?: string
          meta_title?: string
          publish_date?: string | null
          slug?: string
          subcategory?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          event_date: string
          event_time: string
          duration: string
          location: string
          organizer_name: string
          organizer_email: string
          organizer_phone: string
          capacity: number
          category: string
          price: string | null
          registration_deadline: string | null
          requirements: string | null
          agenda: string | null
          speakers: string[] | null
          sponsors: string[] | null
          additional_contact_info: string | null
          status: string
          event_banner: string | null
          featured_image: string | null
          event_tags: string[] | null
          key_highlights: string[] | null
          languages: string[] | null
          faq: Json
          meta_title: string
          meta_description: string
          slug: string
          created_at: string
          updated_at: string
          location_latitude: number | null
          location_longitude: number | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          event_date: string
          event_time: string
          duration: string
          location: string
          organizer_name: string
          organizer_email: string
          organizer_phone: string
          capacity?: number
          category: string
          price?: string | null
          registration_deadline?: string | null
          requirements?: string | null
          agenda?: string | null
          speakers?: string[] | null
          sponsors?: string[] | null
          additional_contact_info?: string | null
          status?: string
          event_banner?: string | null
          featured_image?: string | null
          event_tags?: string[] | null
          key_highlights?: string[] | null
          languages?: string[] | null
          faq?: Json
          meta_title: string
          meta_description: string
          slug: string
          created_at?: string
          updated_at?: string
          location_latitude?: number | null
          location_longitude?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          event_date?: string
          event_time?: string
          duration?: string
          location?: string
          organizer_name?: string
          organizer_email?: string
          organizer_phone?: string
          capacity?: number
          category?: string
          price?: string | null
          registration_deadline?: string | null
          requirements?: string | null
          agenda?: string | null
          speakers?: string[] | null
          sponsors?: string[] | null
          additional_contact_info?: string | null
          status?: string
          event_banner?: string | null
          featured_image?: string | null
          event_tags?: string[] | null
          key_highlights?: string[] | null
          languages?: string[] | null
          faq?: Json
          meta_title?: string
          meta_description?: string
          slug?: string
          created_at?: string
          updated_at?: string
          location_latitude?: number | null
          location_longitude?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      project_posts: {
        Row: {
          id: string
          user_id: string
          title: string
          featured_image: string | null
          meta_title: string
          meta_description: string
          slug: string
          videos_url: string[] | null
          project_tags: string | null
          content_json: Json | null
          conclusion: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          featured_image?: string | null
          meta_title: string
          meta_description: string
          slug: string
          videos_url?: string[] | null
          project_tags?: string | null
          content_json?: Json | null
          conclusion?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          featured_image?: string | null
          meta_title?: string
          meta_description?: string
          slug?: string
          videos_url?: string[] | null
          project_tags?: string | null
          content_json?: Json | null
          conclusion?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'editor' | 'owner'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'editor' | 'owner'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'editor' | 'owner'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
