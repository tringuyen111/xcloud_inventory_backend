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
      user_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          organization_id: number | null;
          branch_id: number | null;
          warehouse_id: number | null;
          role: string;
          is_active: boolean | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          organization_id?: number | null;
          branch_id?: number | null;
          warehouse_id?: number | null;
          role?: string;
          is_active?: boolean | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          organization_id?: number | null;
          branch_id?: number | null;
          warehouse_id?: number | null;
          role?: string;
          is_active?: boolean | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      check_user_access: {
        Args: Record<PropertyKey, never>;
        Returns: {
          user_id: string;
          user_email: string;
          user_role: string;
          organization_ids: number[];
          branch_ids: number[];
          warehouse_ids: number[];
        }[];
      };
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
  master: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          code: string;
          name: string;
          name_en: string | null;
          tax_code: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          address: string | null;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          name_en?: string | null;
          tax_code?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          address?: string | null;
          description?: string | null;
        };
        Update: {
          name?: string;
          name_en?: string | null;
          tax_code?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          address?: string | null;
          description?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      branches: {
        Row: {
          id: string;
          organization_id: string;
          code: string;
          name: string;
          name_en: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          manager_name: string | null;
          manager_phone: string | null;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          name: string;
          name_en?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          manager_name?: string | null;
          manager_phone?: string | null;
          description?: string | null;
        };
        Update: {
          organization_id?: string;
          name?: string;
          name_en?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          manager_name?: string | null;
          manager_phone?: string | null;
          description?: string | null;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ];
      };
      warehouses: {
        Row: {
          id: string;
          branch_id: string;
          code: string;
          name: string;
          name_en: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          manager_name: string | null;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          branch_id: string;
          name: string;
          name_en?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          manager_name?: string | null;
          description?: string | null;
        };
        Update: {
          branch_id?: string;
          name?: string;
          name_en?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          manager_name?: string | null;
          description?: string | null;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "warehouses_branch_id_fkey"
            columns: ["branch_id"]
            referencedRelation: "branches"
            referencedColumns: ["id"]
          }
        ];
      };
      locations: {
        Row: {
          id: string;
          warehouse_id: string;
          parent_id: string | null;
          code: string;
          name: string;
          location_type: string;
          zone_type: string | null;
          is_active: boolean;
          is_blocked: boolean;
        };
        Insert: {
          warehouse_id: string;
          parent_id?: string | null;
          name: string;
          location_type?: string;
          zone_type?: string | null;
          is_blocked?: boolean;
        };
        Update: {
          warehouse_id?: string;
          parent_id?: string | null;
          name?: string;
          location_type?: string;
          zone_type?: string | null;
          is_active?: boolean;
          is_blocked?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "locations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          }
        ];
      };
      partners: {
        Row: {
          id: string;
          organization_id: string;
          code: string;
          name: string;
          is_supplier: boolean;
          is_customer: boolean;
          is_carrier: boolean;
          is_active: boolean;
        };
        Insert: {
          organization_id: string;
          name: string;
          is_supplier?: boolean;
          is_customer?: boolean;
          is_carrier?: boolean;
        };
        Update: {
          organization_id?: string;
          name?: string;
          is_supplier?: boolean;
          is_customer?: boolean;
          is_carrier?: boolean;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "partners_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ];
      };
      uom_categories: {
        Row: {
          id: string
          organization_id: string
          code: string
          name: string
          name_en: string | null
          description: string | null
          is_active: boolean
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: string
          code?: string
          name: string
          name_en?: string | null
          description?: string | null
          is_active?: boolean
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          code?: string
          name?: string
          name_en?: string | null
          description?: string | null
          is_active?: boolean
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "uom_categories_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uom_categories_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uom_categories_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      uoms: {
        Row: {
          id: string;
          organization_id: string;
          uom_category_id: string;
          base_unit_id: string | null;
          code: string;
          name: string;
          symbol: string;
          conversion_factor: number;
          is_base_unit: boolean;
          is_active: boolean;
        };
        Insert: {
          organization_id: string;
          uom_category_id: string;
          base_unit_id?: string | null;
          name: string;
          symbol?: string;
          conversion_factor?: number;
          is_base_unit?: boolean;
        };
        Update: {
          organization_id?: string;
          uom_category_id?: string;
          base_unit_id?: string | null;
          name?: string;
          symbol?: string;
          conversion_factor?: number;
          is_base_unit?: boolean;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "uoms_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uoms_uom_category_id_fkey"
            columns: ["uom_category_id"]
            referencedRelation: "uom_categories"
            referencedColumns: ["id"]
          }
        ];
      };
      goods_types: {
        Row: {
          id: string
          organization_id: string
          parent_id: string | null
          code: string
          name: string
          name_en: string | null
          level: number
          path: string | null
          description: string | null
          is_active: boolean
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: string
          parent_id?: string | null
          code?: string
          name: string
          name_en?: string | null
          level?: number
          path?: string | null
          description?: string | null
          is_active?: boolean
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          parent_id?: string | null
          code?: string
          name?: string
          name_en?: string | null
          level?: number
          path?: string | null
          description?: string | null
          is_active?: boolean
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goods_types_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
          },
          {
            foreignKeyName: "goods_types_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_models: {
        Row: {
          id: string;
          organization_id: string;
          goods_type_id: string;
          base_uom_id: string;
          code: string;
          name: string;
          sku: string;
          barcode: string | null;
          tracking_type: string;
          is_active: boolean;
        };
        Insert: {
          organization_id: string;
          goods_type_id: string;
          base_uom_id: string;
          name: string;
          tracking_type: string;
          sku?: string;
          barcode?: string | null;
        };
        Update: {
          organization_id?: string;
          goods_type_id?: string;
          base_uom_id?: string;
          name?: string;
          tracking_type?: string;
          sku?: string;
          barcode?: string | null;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "goods_models_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
          }
        ];
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      [_ in never]: never
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
  transactions: {
    Tables: {
      goods_receipts: {
        Row: {
          id: string;
          code: string;
          document_date: string;
          warehouse_id: string;
          supplier_id: string;
          status: 'DRAFT' | 'CREATED' | 'RECEIVING' | 'RECEIVED' | 'COMPLETED' | 'CANCELLED';
        };
        Insert: {};
        Update: {};
        Relationships: [];
      };
      goods_issues: {
        Row: {
          id: string;
          code: string;
          document_date: string;
          warehouse_id: string;
          customer_id: string;
          status: 'DRAFT' | 'CREATED' | 'PICKING' | 'PICKED' | 'WAITING_FOR_APPROVAL' | 'COMPLETED' | 'CANCELLED';
        };
        Insert: {};
        Update: {};
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      [_ in never]: never
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
  inventory: {
    Tables: {
      onhand_stock: {
        Row: {
          id: string;
          warehouse_id: string;
          location_id: string;
          goods_model_id: string;
          lot_number: string | null;
          serial_number: string | null;
          quantity_onhand: number;
          quantity_reserved: number;
          quantity_available: number;
        };
        Insert: {};
        Update: {};
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      [_ in never]: never
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
  reporting: {
    Tables: {
      [_ in never]: never
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      [_ in never]: never
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
}