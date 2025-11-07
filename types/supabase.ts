

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      branches: {
        Row: {
          address: string | null
          code: string
          created_at: string
          created_by: string | null
          notes: string | null
          id: number
          is_active: boolean
          name: string
          org_id: number
          updated_at: string | null
          updated_by: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          country: string | null
          phone: string | null
          email: string | null
          manager_name: string | null
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          notes?: string | null
          id?: number
          is_active?: boolean
          name: string
          org_id: number
          updated_at?: string | null
          updated_by?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string | null
          phone?: string | null
          email?: string | null
          manager_name?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          notes?: string | null
          id?: number
          is_active?: boolean
          name?: string
          org_id?: number
          updated_at?: string | null
          updated_by?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string | null
          phone?: string | null
          email?: string | null
          manager_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_org_id_fkey"
            columns: ["org_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      goods_models: {
        Row: {
          base_uom_id: number
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          goods_type_id: number
          id: number
          image_urls: string[] | null
          is_active: boolean
          name: string
          tracking_type: Database["public"]["Enums"]["tracking_type_enum"]
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          base_uom_id: number
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          goods_type_id: number
          id?: number
          image_urls?: string[] | null
          is_active?: boolean
          name: string
          tracking_type: Database["public"]["Enums"]["tracking_type_enum"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          base_uom_id?: number
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          goods_type_id?: number
          id?: number
          image_urls?: string[] | null
          is_active?: boolean
          name?: string
          tracking_type?: Database["public"]["Enums"]["tracking_type_enum"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goods_models_base_uom_id_fkey"
            columns: ["base_uom_id"]
            referencedRelation: "uoms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_models_goods_type_id_fkey"
            columns: ["goods_type_id"]
            referencedRelation: "goods_types"
            referencedColumns: ["id"]
          }
        ]
      }
      goods_receipts: {
        Row: {
          id: number
          reference_number: string | null
          created_at: string
          created_by: string | null
          updated_at: string | null
          updated_by: string | null
          receipt_date: string | null
          partner_reference: string | null
          warehouse_id: number
          status: Database["public"]["Enums"]["gr_status"]
          notes: string | null
          transaction_type: Database["public"]["Enums"]["gr_transaction_type"]
          partner_name: string | null
          supplier_id: number | null
          completed_at: string | null
          completed_by: string | null
        }
        Insert: {
          id?: number
          reference_number?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
          receipt_date?: string | null
          partner_reference?: string | null
          warehouse_id: number
          status: Database["public"]["Enums"]["gr_status"]
          notes?: string | null
          transaction_type: Database["public"]["Enums"]["gr_transaction_type"]
          partner_name?: string | null
          supplier_id?: number | null
          completed_at?: string | null
          completed_by?: string | null
        }
        Update: {
          id?: number
          reference_number?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
          receipt_date?: string | null
          partner_reference?: string | null
          warehouse_id?: number
          status?: Database["public"]["Enums"]["gr_status"]
          notes?: string | null
          transaction_type?: Database["public"]["Enums"]["gr_transaction_type"]
          partner_name?: string | null
          supplier_id?: number | null
          completed_at?: string | null
          completed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          }
        ]
      }
      gr_lines: {
        Row: {
          id: number
          gr_id: number
          goods_model_id: number
          expected_qty: number
          actual_qty: number | null
          lot_number: string | null
          serial_number: string | null
          location_id: number | null
          manufacturing_date: string | null
          expiry_date: string | null
          notes: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          gr_id: number
          goods_model_id: number
          expected_qty: number
          actual_qty?: number | null
          lot_number?: string | null
          serial_number?: string | null
          location_id?: number | null
          manufacturing_date?: string | null
          expiry_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          gr_id?: number
          goods_model_id?: number
          expected_qty?: number
          actual_qty?: number | null
          lot_number?: string | null
          serial_number?: string | null
          location_id?: number | null
          manufacturing_date?: string | null
          expiry_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gr_lines_gr_id_fkey"
            columns: ["gr_id"]
            referencedRelation: "goods_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_lines_goods_model_id_fkey"
            columns: ["goods_model_id"]
            referencedRelation: "goods_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_lines_location_id_fkey"
            columns: ["location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          }
        ]
      }
      goods_types: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          code: string
          constrained_goods_model_ids: number[] | null
          constraint_type: Database["public"]["Enums"]["location_constraint_type"]
          created_at: string
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean
          name: string
          updated_at: string | null
          updated_by: string | null
          warehouse_id: number
        }
        Insert: {
          code: string
          constrained_goods_model_ids?: number[] | null
          constraint_type?: Database["public"]["Enums"]["location_constraint_type"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          name: string
          updated_at?: string | null
          updated_by?: string | null
          warehouse_id: number
        }
        Update: {
          code?: string
          constrained_goods_model_ids?: number[] | null
          constraint_type?: Database["public"]["Enums"]["location_constraint_type"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string
          updated_at?: string | null
          updated_by?: string | null
          warehouse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "locations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          }
        ]
      }
      organizations: {
        Row: {
          address: string | null
          code: string
          created_at: string
          created_by: string | null
          email: string | null
          id: number
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          tax_id: string | null
          updated_at: string | null
          updated_by: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: number
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: number
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          address: string | null
          code: string
          created_at: string
          created_by: string | null
          email: string | null
          id: number
          is_active: boolean
          name: string
          notes: string | null
          org_id: number
          partner_type: Database["public"]["Enums"]["partner_type"]
          phone: string | null
          tax_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: number
          is_active?: boolean
          name: string
          notes?: string | null
          org_id: number
          partner_type?: Database["public"]["Enums"]["partner_type"]
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: number
          is_active?: boolean
          name?: string
          notes?: string | null
          org_id?: number
          partner_type?: Database["public"]["Enums"]["partner_type"]
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_org_id_fkey"
            columns: ["org_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      uom_categories: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      uoms: {
        Row: {
          category_id: number
          code: string
          created_at: string
          created_by: string | null
          id: number
          is_active: boolean
          is_base: boolean
          name: string
          ratio_to_base: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category_id: number
          code: string
          created_at?: string
          created_by?: string | null
          id?: number
          is_active?: boolean
          is_base?: boolean
          name: string
          ratio_to_base?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category_id?: number
          code?: string
          created_at?: string
          created_by?: string | null
          id?: number
          is_active?: boolean
          is_base?: boolean
          name?: string
          ratio_to_base?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uoms_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "uom_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      warehouses: {
        Row: {
          branch_id: number
          code: string
          created_at: string
          created_by: string | null
          notes: string | null
          id: number
          is_active: boolean
          name: string
          updated_at: string | null
          updated_by: string | null
          warehouse_type: Database["public"]["Enums"]["warehouse_type"]
          address: string | null
          capacity_sqm: number | null
          manager_name: string | null
          phone: string | null
        }
        Insert: {
          branch_id: number
          code: string
          created_at?: string
          created_by?: string | null
          notes?: string | null
          id?: number
          is_active?: boolean
          name: string
          updated_at?: string | null
          updated_by?: string | null
          warehouse_type?: Database["public"]["Enums"]["warehouse_type"]
          address?: string | null
          capacity_sqm?: number | null
          manager_name?: string | null
          phone?: string | null
        }
        Update: {
          branch_id?: number
          code?: string
          created_at?: string
          created_by?: string | null
          notes?: string | null
          id?: number
          is_active?: boolean
          name?: string
          updated_at?: string | null
          updated_by?: string | null
          warehouse_type?: Database["public"]["Enums"]["warehouse_type"]
          address?: string | null
          capacity_sqm?: number | null
          manager_name?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_branch_id_fkey"
            columns: ["branch_id"]
            referencedRelation: "branches"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_schema_details: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      gr_status: "DRAFT" | "CREATED" | "RECEIVING" | "PARTIAL_RECEIVED" | "APPROVED" | "COMPLETED"
      gr_transaction_type: "PURCHASE" | "PRODUCTION" | "RETURN_FROM_CUSTOMER" | "TRANSFER_IN" | "ADJUSTMENT_IN"
      location_constraint_type: "NONE" | "ALLOWED" | "DISALLOWED"
      partner_type: "CUSTOMER" | "SUPPLIER" | "CARRIER" | "OTHER"
      tracking_type_enum: "NONE" | "LOT" | "SERIAL"
      warehouse_type: "NORMAL" | "QUARANTINE" | "DAMAGE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Organization = Database['public']['Tables']['organizations']['Row'];
export type Branch = Database['public']['Tables']['branches']['Row'];
export type Warehouse = Database['public']['Tables']['warehouses']['Row'];
export type Location = Database['public']['Tables']['locations']['Row'];
export type UomCategory = Database['public']['Tables']['uom_categories']['Row'];
export type Uom = Database['public']['Tables']['uoms']['Row'];
export type Partner = Database['public']['Tables']['partners']['Row'];
export type GoodsType = Database['public']['Tables']['goods_types']['Row'];
export type GoodsModel = Database['public']['Tables']['goods_models']['Row'];
export type GoodsReceipt = Database['public']['Tables']['goods_receipts']['Row'];
export type GRLine = Database['public']['Tables']['gr_lines']['Row'];