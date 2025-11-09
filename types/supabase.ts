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
      users: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          organization_id: number | null
          branch_id: number | null
          warehouse_id: number | null
          role: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          organization_id?: number | null
          branch_id?: number | null
          warehouse_id?: number | null
          role: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          organization_id?: number | null
          branch_id?: number | null
          warehouse_id?: number | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      gr_confirm: {
        Args: { p_gr_header_id: string }
        Returns: undefined
      }
      gi_approve: {
        Args: { p_gi_header_id: string }
        Returns: undefined
      }
      // Dashboard RPCs
      get_total_onhand: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_dashboard_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          goods_count: number
          receipts_count: number
          issues_count: number
          transfers_count: number
        }[]
      }
      get_recent_activities: {
        Args: {
          limit_count: number
        }
        Returns: {
            key: string;
            documentNo: string;
            type: "Receipt" | "Issue";
            status: string;
            date: string;
        }[]
      }
      // List Page RPCs
      get_gr_list_with_relations: {
        Args: Record<PropertyKey, never>;
        Returns: (Database['transactions']['Tables']['gr_header']['Row'] & { warehouses: { name: string } | null; partners: { name: string } | null; })[]
      }
      get_gi_list_with_relations: {
        Args: Record<PropertyKey, never>;
        Returns: (Database['transactions']['Tables']['gi_header']['Row'] & { warehouses: { name: string } | null; partners: { name: string } | null; })[]
      }
      get_warehouses: {
        Args: Record<PropertyKey, never>;
        Returns: { id: string; name: string }[]
      }
      get_suppliers: {
        Args: Record<PropertyKey, never>;
        Returns: { id: string; name: string }[]
      }
      get_customers: {
        Args: Record<PropertyKey, never>;
        Returns: { id: string; name: string }[]
      }
    }
    Enums: {
      gr_status_enum:
        | "DRAFT"
        | "CREATED"
        | "RECEIVING"
        | "COMPLETED"
        | "CANCELLED"
      gi_status_enum:
        | "DRAFT"
        | "WAITING_FOR_APPROVAL"
        | "APPROVED"
        | "COMPLETED"
        | "CANCELLED"
      gt_status_enum:
        | "DRAFT"
        | "CONFIRMED"
        | "IN_TRANSIT"
        | "COMPLETED"
        | "CANCELLED"
      ic_status_enum: 
        | "DRAFT"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "CANCELLED"
      putaway_status_enum:
        | "DRAFT"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "CANCELLED"
      tracking_type_enum:
        | "NONE"
        | "LOT"
        | "SERIAL"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  master: {
    Tables: {
      organizations: {
        Row: {
          id: string
          code: string
          name: string
          name_en: string | null
          tax_code: string | null
          phone: string | null
          email: string | null
          website: string | null
          address: string | null
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code?: string
          name: string
          name_en?: string | null
          tax_code?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          address?: string | null
          description?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          code?: string
          name?: string
          name_en?: string | null
          tax_code?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          address?: string | null
          description?: string | null
          is_active?: boolean
        }
        Relationships: []
      }
      branches: {
        Row: {
          id: string
          organization_id: string
          code: string
          name: string
          name_en: string | null
          manager_name: string | null
          manager_phone: string | null
          phone: string | null
          email: string | null
          address: string | null
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          code?: string
          name: string
          name_en?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          description?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          organization_id?: string
          code?: string
          name?: string
          name_en?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          description?: string | null
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          id: string
          branch_id: string
          code: string
          name: string
          name_en: string | null
          manager_name: string | null
          phone: string | null
          email: string | null
          address: string | null
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          branch_id: string
          code?: string
          name: string
          name_en?: string | null
          manager_name?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          description?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          branch_id?: string
          code?: string
          name?: string
          name_en?: string | null
          manager_name?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          description?: string | null
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_branch_id_fkey"
            columns: ["branch_id"]
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          id: string
          warehouse_id: string
          parent_id: string | null
          code: string
          name: string
          location_type: string | null
          zone_type: string | null
          barcode: string | null
          is_active: boolean
          is_pickable: boolean
          is_receivable: boolean
          is_blocked: boolean
          description: string | null
        }
        Insert: {
          id?: string
          warehouse_id: string
          parent_id?: string | null
          code?: string
          name: string
          location_type?: string | null
          zone_type?: string | null
          barcode?: string | null
          is_active?: boolean
          is_pickable?: boolean
          is_receivable?: boolean
          is_blocked?: boolean
          description?: string | null
        }
        Update: {
          id?: string
          warehouse_id?: string
          parent_id?: string | null
          code?: string
          name?: string
          location_type?: string | null
          zone_type?: string | null
          barcode?: string | null
          is_active?: boolean
          is_pickable?: boolean
          is_receivable?: boolean
          is_blocked?: boolean
          description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          }
        ]
      }
      goods_types: {
        Row: {
          id: string
          organization_id: string
          parent_id: string | null
          code: string
          name: string
          description: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          organization_id: string
          parent_id?: string | null
          code?: string
          name: string
          description?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          organization_id?: string
          parent_id?: string | null
          code?: string
          name?: string
          description?: string | null
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "goods_types_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
           {
            foreignKeyName: "goods_types_parent_id_fkey"
            columns: ["parent_id"]
            referencedRelation: "goods_types"
            referencedColumns: ["id"]
          }
        ]
      }
      uom_categories: {
        Row: {
          id: string
          organization_id: string
          code: string
          name: string
          name_en: string | null
          description: string | null
          is_active: boolean | null
        }
        Insert: {
          id?: string
          organization_id: string
          code?: string
          name: string
          name_en?: string | null
          description?: string | null
          is_active?: boolean | null
        }
        Update: {
          id?: string
          organization_id?: string
          code?: string
          name?: string
          name_en?: string | null
          description?: string | null
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "uom_categories_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      uoms: {
        Row: {
          id: string
          organization_id: string
          uom_category_id: string
          code: string
          name: string
          symbol: string | null
          is_base_unit: boolean
          base_unit_id: string | null
          conversion_factor: number | null
          is_active: boolean
        }
        Insert: {
          id?: string
          organization_id: string
          uom_category_id: string
          code?: string
          name: string
          symbol?: string | null
          is_base_unit?: boolean
          base_unit_id?: string | null
          conversion_factor?: number | null
          is_active?: boolean
        }
        Update: {
          id?: string
          organization_id?: string
          uom_category_id?: string
          code?: string
          name?: string
          symbol?: string | null
          is_base_unit?: boolean
          base_unit_id?: string | null
          conversion_factor?: number | null
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "uoms_uom_category_id_fkey"
            columns: ["uom_category_id"]
            referencedRelation: "uom_categories"
            referencedColumns: ["id"]
          },
           {
            foreignKeyName: "uoms_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      goods_models: {
        Row: {
          id: string
          organization_id: string
          goods_type_id: string
          base_uom_id: string
          code: string
          name: string
          name_en: string | null
          sku: string | null
          barcode: string | null
          tracking_type: "NONE" | "LOT" | "SERIAL"
          min_stock_level: number | null
          reorder_point: number | null
          brand: string | null
          manufacturer: string | null
          description: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          organization_id: string
          goods_type_id: string
          base_uom_id: string
          code?: string
          name: string
          name_en?: string | null
          sku?: string | null
          barcode?: string | null
          tracking_type: "NONE" | "LOT" | "SERIAL"
          min_stock_level?: number | null
          reorder_point?: number | null
          brand?: string | null
          manufacturer?: string | null
          description?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          organization_id?: string
          goods_type_id?: string
          base_uom_id?: string
          code?: string
          name?: string
          name_en?: string | null
          sku?: string | null
          barcode?: string | null
          tracking_type?: "NONE" | "LOT" | "SERIAL"
          min_stock_level?: number | null
          reorder_point?: number | null
          brand?: string | null
          manufacturer?: string | null
          description?: string | null
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "goods_models_goods_type_id_fkey"
            columns: ["goods_type_id"]
            referencedRelation: "goods_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_models_base_uom_id_fkey"
            columns: ["base_uom_id"]
            referencedRelation: "uoms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_models_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      partners: {
        Row: {
          id: string
          organization_id: string
          code: string
          name: string
          legal_name: string | null
          tax_code: string | null
          address: string | null
          phone: string | null
          email: string | null
          contact_person_name: string | null
          contact_person_phone: string | null
          payment_terms: string | null
          credit_limit: number | null
          is_supplier: boolean
          is_customer: boolean
          is_carrier: boolean
          is_active: boolean
        }
        Insert: {
          id?: string
          organization_id: string
          code?: string
          name: string
          legal_name?: string | null
          tax_code?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          payment_terms?: string | null
          credit_limit?: number | null
          is_supplier?: boolean
          is_customer?: boolean
          is_carrier?: boolean
          is_active?: boolean
        }
        Update: {
          id?: string
          organization_id?: string
          code?: string
          name?: string
          legal_name?: string | null
          tax_code?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          payment_terms?: string | null
          credit_limit?: number | null
          is_supplier?: boolean
          is_customer?: boolean
          is_carrier?: boolean
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "partners_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
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
  inventory: {
    Tables: {
      onhand: {
        Row: {
          id: string
          organization_id: string
          warehouse_id: string
          location_id: string
          goods_model_id: string
          lot_number: string | null
          serial_number: string | null
          quantity_onhand: number
          quantity_reserved: number
          quantity_available: number | null
          expiry_date: string | null
          stock_status: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          warehouse_id: string
          location_id: string
          goods_model_id: string
          lot_number?: string | null
          serial_number?: string | null
          quantity_onhand: number
          quantity_reserved?: number
          expiry_date?: string | null
          stock_status?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          warehouse_id?: string
          location_id?: string
          goods_model_id?: string
          lot_number?: string | null
          serial_number?: string | null
          quantity_onhand?: number
          quantity_reserved?: number
          expiry_date?: string | null
          stock_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onhand_goods_model_id_fkey"
            columns: ["goods_model_id"]
            referencedRelation: "goods_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onhand_location_id_fkey"
            columns: ["location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onhand_warehouse_id_fkey"
            columns: ["warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          }
        ]
      }
      onhand_movements: {
        Row: {
          id: string
          movement_type: string
          warehouse_id: string
          goods_model_id: string
          quantity_change: number
          reference_document_code: string
        }
        Insert: {
          id?: string
          movement_type: string
          warehouse_id: string
          goods_model_id: string
          quantity_change: number
          reference_document_code: string
        }
        Update: {
          id?: string
          movement_type?: string
          warehouse_id?: string
          goods_model_id?: string
          quantity_change?: number
          reference_document_code?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_low_stock_alert: {
        Row: {}
      }
      v_movement_history: {
        Row: {}
      }
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
  transactions: {
    Tables: {
      gr_header: {
        Row: {
          id: string
          organization_id: string | null
          warehouse_id: string
          supplier_id: string | null
          code: string
          document_date: string | null
          status: "DRAFT" | "CREATED" | "RECEIVING" | "COMPLETED" | "CANCELLED"
          notes: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          organization_id?: string | null
          warehouse_id: string
          supplier_id?: string | null
          code?: string
          document_date?: string | null
          status?: "DRAFT" | "CREATED" | "RECEIVING" | "COMPLETED" | "CANCELLED"
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string | null
          warehouse_id?: string
          supplier_id?: string | null
          code?: string
          document_date?: string | null
          status?: "DRAFT" | "CREATED" | "RECEIVING" | "COMPLETED" | "CANCELLED"
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gr_header_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_header_supplier_id_fkey"
            columns: ["supplier_id"]
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_header_warehouse_id_fkey"
            columns: ["warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          }
        ]
      }
      gr_lines: {
        Row: {
          id: string
          gr_header_id: string
          goods_model_id: string
          uom_id: string
          quantity_expected: number
          quantity_received: number
        }
        Insert: {
          id?: string
          gr_header_id: string
          goods_model_id: string
          uom_id: string
          quantity_expected: number
          quantity_received?: number
        }
        Update: {
          id?: string
          gr_header_id?: string
          goods_model_id?: string
          uom_id?: string
          quantity_expected?: number
          quantity_received?: number
        }
        Relationships: [
          {
            foreignKeyName: "gr_lines_goods_model_id_fkey"
            columns: ["goods_model_id"]
            referencedRelation: "goods_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_lines_gr_header_id_fkey"
            columns: ["gr_header_id"]
            referencedRelation: "gr_header"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_lines_uom_id_fkey"
            columns: ["uom_id"]
            referencedRelation: "uoms"
            referencedColumns: ["id"]
          }
        ]
      }
      gi_header: {
        Row: {
          id: string
          organization_id: string | null
          warehouse_id: string
          customer_id: string | null
          code: string
          document_date: string | null
          sales_order_number: string | null
          status: "DRAFT" | "WAITING_FOR_APPROVAL" | "APPROVED" | "COMPLETED" | "CANCELLED"
          notes: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          organization_id?: string | null
          warehouse_id: string
          customer_id?: string | null
          code?: string
          document_date?: string | null
          sales_order_number?: string | null
          status?: "DRAFT" | "WAITING_FOR_APPROVAL" | "APPROVED" | "COMPLETED" | "CANCELLED"
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string | null
          warehouse_id?: string
          customer_id?: string | null
          code?: string
          document_date?: string | null
          sales_order_number?: string | null
          status?: "DRAFT" | "WAITING_FOR_APPROVAL" | "APPROVED" | "COMPLETED" | "CANCELLED"
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gi_header_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_header_customer_id_fkey"
            columns: ["customer_id"]
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_header_warehouse_id_fkey"
            columns: ["warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          }
        ]
      }
      gi_lines: {
        Row: {
          id: string
          gi_header_id: string
          goods_model_id: string
          quantity_requested: number
        }
        Insert: {
          id?: string
          gi_header_id: string
          goods_model_id: string
          quantity_requested: number
        }
        Update: {
          id?: string
          gi_header_id?: string
          goods_model_id?: string
          quantity_requested?: number
        }
        Relationships: [
          {
            foreignKeyName: "gi_lines_gi_header_id_fkey"
            columns: ["gi_header_id"]
            referencedRelation: "gi_header"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_lines_goods_model_id_fkey"
            columns: ["goods_model_id"]
            referencedRelation: "goods_models"
            referencedColumns: ["id"]
          }
        ]
      }
      gt_header: {
        Row: {
          id: string
          from_warehouse_id: string
          to_warehouse_id: string
          code: string
          status: "DRAFT" | "CONFIRMED" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED"
        }
        Insert: {
          id?: string
          from_warehouse_id: string
          to_warehouse_id: string
          code?: string
          status?: "DRAFT" | "CONFIRMED" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED"
        }
        Update: {
          id?: string
          from_warehouse_id?: string
          to_warehouse_id?: string
          code?: string
          status?: "DRAFT" | "CONFIRMED" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED"
        }
        Relationships: [
          {
            foreignKeyName: "gt_header_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gt_header_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          }
        ]
      }
      gt_lines: {
        Row: {
          id: string
          gt_header_id: string
          goods_model_id: string
          quantity: number
        }
        Insert: {
          id?: string
          gt_header_id: string
          goods_model_id: string
          quantity: number
        }
        Update: {
          id?: string
          gt_header_id?: string
          goods_model_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "gt_lines_goods_model_id_fkey"
            columns: ["goods_model_id"]
            referencedRelation: "goods_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gt_lines_gt_header_id_fkey"
            columns: ["gt_header_id"]
            referencedRelation: "gt_header"
            referencedColumns: ["id"]
          }
        ]
      }
      ic_header: {
        Row: { id: string }
        Insert: {}
        Update: {}
        Relationships: []
      }
      ic_lines: {
        Row: { id: string }
        Insert: {}
        Update: {}
        Relationships: []
      }
      putaway_header: {
        Row: { 
          id: string;
          organization_id: string | null;
          warehouse_id: string;
          gr_header_id: string | null;
          code: string;
          status: "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
        }
        Insert: {}
        Update: {}
        Relationships: [
          {
            foreignKeyName: "putaway_header_gr_header_id_fkey"
            columns: ["gr_header_id"]
            referencedRelation: "gr_header"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_header_warehouse_id_fkey"
            columns: ["warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          }
        ]
      }
      putaway_lines: {
        Row: { id: string }
        Insert: {}
        Update: {}
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
  reporting: {
    Tables: {
        [_ in never]: never
    }
    Views: {
      v_warehouse_performance: {
        Row: {}
      }
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