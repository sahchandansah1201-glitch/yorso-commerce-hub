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
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          category_id: string | null
          certifications: string[]
          commercial_terms: Json
          created_at: string
          delivery_basis_options: Json
          description: string | null
          format: string | null
          format_cut: string | null
          freshness: string | null
          gallery: Json
          id: string
          image: string | null
          image_list: string[]
          image_url: string | null
          incoterms: string | null
          inspection_available: boolean
          latin_name: string | null
          moq_label: string | null
          moq_unit: string | null
          moq_value: number | null
          origin_country_code: string
          origin_flag: string | null
          packaging: string | null
          packaging_label: string | null
          payment_terms: string | null
          photo_source_label: string | null
          price_amount: number | null
          price_currency: string
          price_max: number | null
          price_min: number | null
          price_range_label: string | null
          price_unit: string
          product_name: string
          published_at: string | null
          related_articles: Json
          sample_available: boolean
          species: string | null
          specs: Json
          status: Database["public"]["Enums"]["offer_status"]
          supplier_id: string
          traceability: string | null
          updated_at: string
          volume_breaks: Json
        }
        Insert: {
          category_id?: string | null
          certifications?: string[]
          commercial_terms?: Json
          created_at?: string
          delivery_basis_options?: Json
          description?: string | null
          format?: string | null
          format_cut?: string | null
          freshness?: string | null
          gallery?: Json
          id?: string
          image?: string | null
          image_list?: string[]
          image_url?: string | null
          incoterms?: string | null
          inspection_available?: boolean
          latin_name?: string | null
          moq_label?: string | null
          moq_unit?: string | null
          moq_value?: number | null
          origin_country_code: string
          origin_flag?: string | null
          packaging?: string | null
          packaging_label?: string | null
          payment_terms?: string | null
          photo_source_label?: string | null
          price_amount?: number | null
          price_currency?: string
          price_max?: number | null
          price_min?: number | null
          price_range_label?: string | null
          price_unit?: string
          product_name: string
          published_at?: string | null
          related_articles?: Json
          sample_available?: boolean
          species?: string | null
          specs?: Json
          status?: Database["public"]["Enums"]["offer_status"]
          supplier_id: string
          traceability?: string | null
          updated_at?: string
          volume_breaks?: Json
        }
        Update: {
          category_id?: string | null
          certifications?: string[]
          commercial_terms?: Json
          created_at?: string
          delivery_basis_options?: Json
          description?: string | null
          format?: string | null
          format_cut?: string | null
          freshness?: string | null
          gallery?: Json
          id?: string
          image?: string | null
          image_list?: string[]
          image_url?: string | null
          incoterms?: string | null
          inspection_available?: boolean
          latin_name?: string | null
          moq_label?: string | null
          moq_unit?: string | null
          moq_value?: number | null
          origin_country_code?: string
          origin_flag?: string | null
          packaging?: string | null
          packaging_label?: string | null
          payment_terms?: string | null
          photo_source_label?: string | null
          price_amount?: number | null
          price_currency?: string
          price_max?: number | null
          price_min?: number | null
          price_range_label?: string | null
          price_unit?: string
          product_name?: string
          published_at?: string | null
          related_articles?: Json
          sample_available?: boolean
          species?: string | null
          specs?: Json
          status?: Database["public"]["Enums"]["offer_status"]
          supplier_id?: string
          traceability?: string | null
          updated_at?: string
          volume_breaks?: Json
        }
        Relationships: [
          {
            foreignKeyName: "offers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      price_access_requests: {
        Row: {
          buyer_user_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          message: string | null
          offer_id: string
          status: Database["public"]["Enums"]["price_access_status"]
          updated_at: string
        }
        Insert: {
          buyer_user_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          message?: string | null
          offer_id: string
          status?: Database["public"]["Enums"]["price_access_status"]
          updated_at?: string
        }
        Update: {
          buyer_user_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          message?: string | null
          offer_id?: string
          status?: Database["public"]["Enums"]["price_access_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_access_requests_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_access_requests_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          certifications: string[]
          company_name: string
          contact_email: string | null
          contact_phone: string | null
          country_code: string
          country_flag: string | null
          created_at: string
          description: string | null
          documents_reviewed: string[]
          id: string
          in_business_since: number | null
          owner_user_id: string | null
          profile_slug: string | null
          rating: number | null
          response_time: string | null
          updated_at: string
          verification_date: string | null
          verification_scope: string | null
          verification_status: Database["public"]["Enums"]["supplier_verification_status"]
          website: string | null
        }
        Insert: {
          certifications?: string[]
          company_name: string
          contact_email?: string | null
          contact_phone?: string | null
          country_code: string
          country_flag?: string | null
          created_at?: string
          description?: string | null
          documents_reviewed?: string[]
          id?: string
          in_business_since?: number | null
          owner_user_id?: string | null
          profile_slug?: string | null
          rating?: number | null
          response_time?: string | null
          updated_at?: string
          verification_date?: string | null
          verification_scope?: string | null
          verification_status?: Database["public"]["Enums"]["supplier_verification_status"]
          website?: string | null
        }
        Update: {
          certifications?: string[]
          company_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          country_code?: string
          country_flag?: string | null
          created_at?: string
          description?: string | null
          documents_reviewed?: string[]
          id?: string
          in_business_since?: number | null
          owner_user_id?: string | null
          profile_slug?: string | null
          rating?: number | null
          response_time?: string | null
          updated_at?: string
          verification_date?: string | null
          verification_scope?: string | null
          verification_status?: Database["public"]["Enums"]["supplier_verification_status"]
          website?: string | null
        }
        Relationships: []
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
    }
    Views: {
      offers_public: {
        Row: {
          category_id: string | null
          certifications: string[] | null
          commercial_terms: Json | null
          created_at: string | null
          delivery_basis_options: Json | null
          description: string | null
          format: string | null
          format_cut: string | null
          freshness: string | null
          gallery: Json | null
          id: string | null
          image: string | null
          image_list: string[] | null
          image_url: string | null
          inspection_available: boolean | null
          latin_name: string | null
          moq_label: string | null
          moq_unit: string | null
          moq_value: number | null
          origin_country_code: string | null
          origin_flag: string | null
          packaging: string | null
          packaging_label: string | null
          photo_source_label: string | null
          price_range_label: string | null
          product_name: string | null
          published_at: string | null
          related_articles: Json | null
          sample_available: boolean | null
          species: string | null
          specs: Json | null
          status: Database["public"]["Enums"]["offer_status"] | null
          traceability: string | null
          updated_at: string | null
          volume_breaks: Json | null
        }
        Insert: {
          category_id?: string | null
          certifications?: string[] | null
          commercial_terms?: Json | null
          created_at?: string | null
          delivery_basis_options?: Json | null
          description?: string | null
          format?: string | null
          format_cut?: string | null
          freshness?: string | null
          gallery?: Json | null
          id?: string | null
          image?: string | null
          image_list?: string[] | null
          image_url?: string | null
          inspection_available?: boolean | null
          latin_name?: string | null
          moq_label?: string | null
          moq_unit?: string | null
          moq_value?: number | null
          origin_country_code?: string | null
          origin_flag?: string | null
          packaging?: string | null
          packaging_label?: string | null
          photo_source_label?: string | null
          price_range_label?: string | null
          product_name?: string | null
          published_at?: string | null
          related_articles?: Json | null
          sample_available?: boolean | null
          species?: string | null
          specs?: Json | null
          status?: Database["public"]["Enums"]["offer_status"] | null
          traceability?: string | null
          updated_at?: string | null
          volume_breaks?: Json | null
        }
        Update: {
          category_id?: string | null
          certifications?: string[] | null
          commercial_terms?: Json | null
          created_at?: string | null
          delivery_basis_options?: Json | null
          description?: string | null
          format?: string | null
          format_cut?: string | null
          freshness?: string | null
          gallery?: Json | null
          id?: string | null
          image?: string | null
          image_list?: string[] | null
          image_url?: string | null
          inspection_available?: boolean | null
          latin_name?: string | null
          moq_label?: string | null
          moq_unit?: string | null
          moq_value?: number | null
          origin_country_code?: string | null
          origin_flag?: string | null
          packaging?: string | null
          packaging_label?: string | null
          photo_source_label?: string | null
          price_range_label?: string | null
          product_name?: string | null
          published_at?: string | null
          related_articles?: Json | null
          sample_available?: boolean | null
          species?: string | null
          specs?: Json | null
          status?: Database["public"]["Enums"]["offer_status"] | null
          traceability?: string | null
          updated_at?: string | null
          volume_breaks?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers_public: {
        Row: {
          certifications: string[] | null
          country_code: string | null
          country_flag: string | null
          created_at: string | null
          documents_reviewed: string[] | null
          id: string | null
          in_business_since: number | null
          profile_slug: string | null
          response_time: string | null
          updated_at: string | null
          verification_date: string | null
          verification_scope: string | null
          verification_status:
            | Database["public"]["Enums"]["supplier_verification_status"]
            | null
        }
        Insert: {
          certifications?: string[] | null
          country_code?: string | null
          country_flag?: string | null
          created_at?: string | null
          documents_reviewed?: string[] | null
          id?: string | null
          in_business_since?: number | null
          profile_slug?: string | null
          response_time?: string | null
          updated_at?: string | null
          verification_date?: string | null
          verification_scope?: string | null
          verification_status?:
            | Database["public"]["Enums"]["supplier_verification_status"]
            | null
        }
        Update: {
          certifications?: string[] | null
          country_code?: string | null
          country_flag?: string | null
          created_at?: string | null
          documents_reviewed?: string[] | null
          id?: string | null
          in_business_since?: number | null
          profile_slug?: string | null
          response_time?: string | null
          updated_at?: string | null
          verification_date?: string | null
          verification_scope?: string | null
          verification_status?:
            | Database["public"]["Enums"]["supplier_verification_status"]
            | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_qualified_offer: {
        Args: { p_offer_id: string }
        Returns: {
          category_id: string
          certifications: string[]
          commercial_terms: Json
          created_at: string
          delivery_basis_options: Json
          description: string
          format: string
          format_cut: string
          freshness: string
          gallery: Json
          id: string
          image: string
          image_list: string[]
          image_url: string
          inspection_available: boolean
          latin_name: string
          moq_label: string
          moq_unit: string
          moq_value: number
          origin_country_code: string
          origin_flag: string
          packaging: string
          packaging_label: string
          photo_source_label: string
          price_currency: string
          price_max: number
          price_min: number
          price_range_label: string
          price_unit: string
          product_name: string
          published_at: string
          related_articles: Json
          sample_available: boolean
          species: string
          specs: Json
          status: Database["public"]["Enums"]["offer_status"]
          supplier_company_name: string
          supplier_country_code: string
          supplier_country_flag: string
          supplier_id: string
          supplier_in_business_since: number
          supplier_profile_slug: string
          supplier_rating: number
          supplier_response_time: string
          supplier_verification_status: Database["public"]["Enums"]["supplier_verification_status"]
          supplier_website: string
          traceability: string
          updated_at: string
          volume_breaks: Json
        }[]
      }
      get_qualified_offers: {
        Args: never
        Returns: {
          category_id: string
          certifications: string[]
          commercial_terms: Json
          created_at: string
          delivery_basis_options: Json
          description: string
          format: string
          format_cut: string
          freshness: string
          gallery: Json
          id: string
          image: string
          image_list: string[]
          image_url: string
          inspection_available: boolean
          latin_name: string
          moq_label: string
          moq_unit: string
          moq_value: number
          origin_country_code: string
          origin_flag: string
          packaging: string
          packaging_label: string
          photo_source_label: string
          price_currency: string
          price_max: number
          price_min: number
          price_range_label: string
          price_unit: string
          product_name: string
          published_at: string
          related_articles: Json
          sample_available: boolean
          species: string
          specs: Json
          status: Database["public"]["Enums"]["offer_status"]
          supplier_company_name: string
          supplier_country_code: string
          supplier_country_flag: string
          supplier_id: string
          supplier_in_business_since: number
          supplier_profile_slug: string
          supplier_rating: number
          supplier_response_time: string
          supplier_verification_status: Database["public"]["Enums"]["supplier_verification_status"]
          supplier_website: string
          traceability: string
          updated_at: string
          volume_breaks: Json
        }[]
      }
      has_price_access: {
        Args: { _offer_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "buyer" | "supplier"
      offer_status: "draft" | "published" | "archived"
      price_access_status: "pending" | "approved" | "rejected" | "revoked"
      supplier_verification_status: "unverified" | "pending" | "verified"
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
      app_role: ["admin", "buyer", "supplier"],
      offer_status: ["draft", "published", "archived"],
      price_access_status: ["pending", "approved", "rejected", "revoked"],
      supplier_verification_status: ["unverified", "pending", "verified"],
    },
  },
} as const
