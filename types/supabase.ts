

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  auth: {
      Tables: {
        [_ in never]: never
      }
      Views: {
        [_ in never]: never
      }
      Functions: {
        [_ in never]: never
      }
  }
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          organization_id: string | null
          branch_id: string | null
          warehouse_id: string | null
          role: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          organization_id?: string | null
          branch_id?: string | null
          warehouse_id?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          organization_id?: string | null
          branch_id?: string | null
          warehouse_id?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      },
      roles: {
        Row: {
          id: string
          description: string | null
        }
        Insert: {
          id: string
          description?: string | null
        }
        Update: {
          id?: string
          description?: string | null
        }
        Relationships: []
      },
      permissions: {
        Row: {
          id: string
          module: string
          description: string | null
        }
        Insert: {
          id: string
          module: string
          description?: string | null
        }
        Update: {
          id?: string
          module?: string
          description?: string | null
        }
        Relationships: []
      },
      role_permissions: {
        Row: {
          role: string
          permission: string
        }
        Insert: {
          role: string
          permission: string
        }
        Update: {
          role?: string
          permission?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_fkey"
            columns: ["permission"]
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_fkey"
            columns: ["role"]
            referencedRelation: "roles"
            referencedColumns: ["id"]
          }
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
    }
    Enums: {
      status_enum: "ACTIVE" | "INACTIVE"
      gr_status_enum:
        | "DRAFT"
        | "CREATED"
        | "RECEIVING"
        | "RECEIVED"
        | "COMPLETED"
        | "CANCELLED"
      gr_type_enum:
        | "PURCHASE"
        | "TRANSFER_IN"
        | "ADJUSTMENT_IN"
        | "RETURN_IN"
        | "OTHER"
      gi_status_enum:
        | "DRAFT"
        | "CREATED"
        | "PICKING"
        | "PICKED"
        | "WAITING_FOR_APPROVAL"
        | "COMPLETED"
        | "CANCELLED"
      gi_type_enum:
        | "SALE"
        | "TRANSFER_OUT"
        | "RETURN_OUT"
        | "ADJUSTMENT_OUT"
        | "SCRAP"
      gi_mode_enum: "SUMMARY" | "DETAIL"
      gt_status_enum:
        | "DRAFT"
        | "CREATED"
        | "IN_PROGRESS"
        | "IN_TRANSIT"
        | "RECEIVING"
        | "COMPLETED"
        | "CANCELLED"
      ic_status_enum:
        | "DRAFT"
        | "CREATED"
        | "COUNTING"
        | "COMPLETED"
        | "CANCELLED"
      putaway_status_enum: "DRAFT" | "MOVING" | "COMPLETED" | "CANCELLED"
      tracking_type_enum: "NONE" | "LOT" | "SERIAL"
      partner_type_enum: "SUPPLIER" | "CUSTOMER" | "CARRIER"
      movement_type_enum:
        | "GR"
        | "GI"
        | "GT"
        | "PUTAWAY"
        | "IC"
        | "ADJUSTMENT"
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
          address: string | null
          phone: string | null
          email: string | null
          website: string | null
          description: string | null
          is_active: boolean
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          name_en?: string | null
          tax_code?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          description?: string | null
          is_active?: boolean
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          name_en?: string | null
          tax_code?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          description?: string | null
          is_active?: boolean
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      branches: {
        Row: {
          id: string
          organization_id: string
          code: string
          name: string
          name_en: string | null
          address: string | null
          phone: string | null
          email: string | null
          manager_name: string | null
          manager_phone: string | null
          description: string | null
          is_active: boolean
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          code: string
          name: string
          name_en?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
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
          address?: string | null
          phone?: string | null
          email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          description?: string | null
          is_active?: boolean
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      warehouses: {
        Row: {
          id: string
          organization_id: string
          branch_id: string
          code: string
          name: string
          name_en: string | null
          warehouse_type: string | null
          address: string | null
          phone: string | null
          email: string | null
          manager_name: string | null
          manager_phone: string | null
          area_sqm: number | null
          capacity_cbm: number | null
          description: string | null
          is_active: boolean
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          branch_id: string
          code: string
          name: string
          name_en?: string | null
          warehouse_type?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          area_sqm?: number | null
          capacity_cbm?: number | null
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
          branch_id?: string
          code?: string
          name?: string
          name_en?: string | null
          warehouse_type?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          area_sqm?: number | null
          capacity_cbm?: number | null
          description?: string | null
          is_active?: boolean
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_branch_id_fkey"
            columns: ["branch_id"]
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      locations: {
        Row: {
          id: string
          organization_id: string
          branch_id: string
          warehouse_id: string
          parent_id: string | null
          code: string
          name: string
          name_en: string | null
          location_type: string | null
          level: number
          path: string | null
          aisle: string | null
          rack: string | null
          shelf: string | null
          bin: string | null
          capacity_cbm: number | null
          capacity_weight_kg: number | null
          max_pallets: number | null
          is_pickable: boolean | null
          is_receivable: boolean | null
          is_countable: boolean | null
          is_virtual: boolean | null
          zone_type: string | null
          temperature_zone: string | null
          x_coordinate: number | null
          y_coordinate: number | null
          z_coordinate: number | null
          barcode: string | null
          description: string | null
          notes: string | null
          is_active: boolean
          is_blocked: boolean | null
          blocked_reason: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          branch_id: string
          warehouse_id: string
          parent_id?: string | null
          code: string
          name: string
          name_en?: string | null
          location_type?: string | null
          level?: number
          path?: string | null
          aisle?: string | null
          rack?: string | null
          shelf?: string | null
          bin?: string | null
          capacity_cbm?: number | null
          capacity_weight_kg?: number | null
          max_pallets?: number | null
          is_pickable?: boolean | null
          is_receivable?: boolean | null
          is_countable?: boolean | null
          is_virtual?: boolean | null
          zone_type?: string | null
          temperature_zone?: string | null
          x_coordinate?: number | null
          y_coordinate?: number | null
          z_coordinate?: number | null
          barcode?: string | null
          description?: string | null
          notes?: string | null
          is_active?: boolean
          is_blocked?: boolean | null
          blocked_reason?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          branch_id?: string
          warehouse_id?: string
          parent_id?: string | null
          code?: string
          name?: string
          name_en?: string | null
          location_type?: string | null
          level?: number
          path?: string | null
          aisle?: string | null
          rack?: string | null
          shelf?: string | null
          bin?: string | null
          capacity_cbm?: number | null
          capacity_weight_kg?: number | null
          max_pallets?: number | null
          is_pickable?: boolean | null
          is_receivable?: boolean | null
          is_countable?: boolean | null
          is_virtual?: boolean | null
          zone_type?: string | null
          temperature_zone?: string | null
          x_coordinate?: number | null
          y_coordinate?: number | null
          z_coordinate?: number | null
          barcode?: string | null
          description?: string | null
          notes?: string | null
          is_active?: boolean
          is_blocked?: boolean | null
          blocked_reason?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_branch_id_fkey"
            columns: ["branch_id"]
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
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
          },
          {
            foreignKeyName: "locations_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
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
          id?: string
          organization_id: string
          parent_id?: string | null
          code: string
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
            foreignKeyName: "goods_types_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_types_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
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
          is_active: boolean
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          code: string
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
            foreignKeyName: "uom_categories_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uom_categories_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uom_categories_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
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
          name_en: string | null
          symbol: string | null
          is_base_unit: boolean
          base_unit_id: string | null
          conversion_factor: number | null
          rounding_precision: number | null
          description: string | null
          is_active: boolean
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          uom_category_id: string
          code: string
          name: string
          name_en?: string | null
          symbol?: string | null
          is_base_unit?: boolean
          base_unit_id?: string | null
          conversion_factor?: number | null
          rounding_precision?: number | null
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
          uom_category_id?: string
          code?: string
          name?: string
          name_en?: string | null
          symbol?: string | null
          is_base_unit?: boolean
          base_unit_id?: string | null
          conversion_factor?: number | null
          rounding_precision?: number | null
          description?: string | null
          is_active?: boolean
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
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
          },
          {
            foreignKeyName: "uoms_base_unit_id_fkey"
            columns: ["base_unit_id"]
            referencedRelation: "uoms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uoms_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uoms_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
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
          tracking_type: Database["public"]["Enums"]["tracking_type_enum"]
          weight: number | null
          length: number | null
          width: number | null
          height: number | null
          volume: number | null
          min_stock_level: number | null
          max_stock_level: number | null
          reorder_point: number | null
          reorder_quantity: number | null
          standard_cost: number | null
          standard_price: number | null
          manufacturer: string | null
          brand: string | null
          model_number: string | null
          description: string | null
          specifications: Json | null
          images: Json | null
          is_active: boolean
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          goods_type_id: string
          base_uom_id: string
          code: string
          name: string
          name_en?: string | null
          sku?: string | null
          barcode?: string | null
          tracking_type?: Database["public"]["Enums"]["tracking_type_enum"]
          weight?: number | null
          length?: number | null
          width?: number | null
          height?: number | null
          volume?: number | null
          min_stock_level?: number | null
          max_stock_level?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          standard_cost?: number | null
          standard_price?: number | null
          manufacturer?: string | null
          brand?: string | null
          model_number?: string | null
          description?: string | null
          specifications?: Json | null
          images?: Json | null
          is_active?: boolean
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
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
          tracking_type?: Database["public"]["Enums"]["tracking_type_enum"]
          weight?: number | null
          length?: number | null
          width?: number | null
          height?: number | null
          volume?: number | null
          min_stock_level?: number | null
          max_stock_level?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          standard_cost?: number | null
          standard_price?: number | null
          manufacturer?: string | null
          brand?: string | null
          model_number?: string | null
          description?: string | null
          specifications?: Json | null
          images?: Json | null
          is_active?: boolean
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
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
          },
          {
            foreignKeyName: "goods_models_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_models_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
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
          name_en: string | null
          is_supplier: boolean | null
          is_customer: boolean | null
          is_carrier: boolean | null
          is_other: boolean | null
          tax_code: string | null
          legal_name: string | null
          registration_number: string | null
          address: string | null
          city: string | null
          district: string | null
          ward: string | null
          postal_code: string | null
          country: string | null
          phone: string | null
          mobile: string | null
          email: string | null
          website: string | null
          contact_person_name: string | null
          contact_person_phone: string | null
          contact_person_email: string | null
          contact_person_title: string | null
          payment_terms: string | null
          credit_limit: number | null
          currency: string | null
          notes: string | null
          tags: Json | null
          is_active: boolean
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          code: string
          name: string
          name_en?: string | null
          is_supplier?: boolean | null
          is_customer?: boolean | null
          is_carrier?: boolean | null
          is_other?: boolean | null
          tax_code?: string | null
          legal_name?: string | null
          registration_number?: string | null
          address?: string | null
          city?: string | null
          district?: string | null
          ward?: string | null
          postal_code?: string | null
          country?: string | null
          phone?: string | null
          mobile?: string | null
          email?: string | null
          website?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          contact_person_email?: string | null
          contact_person_title?: string | null
          payment_terms?: string | null
          credit_limit?: number | null
          currency?: string | null
          notes?: string | null
          tags?: Json | null
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
          is_supplier?: boolean | null
          is_customer?: boolean | null
          is_carrier?: boolean | null
          is_other?: boolean | null
          tax_code?: string | null
          legal_name?: string | null
          registration_number?: string | null
          address?: string | null
          city?: string | null
          district?: string | null
          ward?: string | null
          postal_code?: string | null
          country?: string | null
          phone?: string | null
          mobile?: string | null
          email?: string | null
          website?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          contact_person_email?: string | null
          contact_person_title?: string | null
          payment_terms?: string | null
          credit_limit?: number | null
          currency?: string | null
          notes?: string | null
          tags?: Json | null
          is_active?: boolean
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partners_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partners_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partners_updated_by_fkey"
            columns: ["updated_by"]
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
          quantity_available: number
          manufacture_date: string | null
          expiry_date: string | null
          received_date: string | null
          supplier_id: string | null
          stock_status: string | null
          quality_status: string | null
          reference_document: string | null
          notes: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          warehouse_id: string
          location_id: string
          goods_model_id: string
          lot_number?: string | null
          serial_number?: string | null
          quantity_onhand?: number
          quantity_reserved?: number
          manufacture_date?: string | null
          expiry_date?: string | null
          received_date?: string | null
          supplier_id?: string | null
          stock_status?: string | null
          quality_status?: string | null
          reference_document?: string | null
          notes?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
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
          manufacture_date?: string | null
          expiry_date?: string | null
          received_date?: string | null
          supplier_id?: string | null
          stock_status?: string | null
          quality_status?: string | null
          reference_document?: string | null
          notes?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onhand_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onhand_warehouse_id_fkey"
            columns: ["warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onhand_location_id_fkey"
            columns: ["location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onhand_goods_model_id_fkey"
            columns: ["goods_model_id"]
            referencedRelation: "goods_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onhand_supplier_id_fkey"
            columns: ["supplier_id"]
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onhand_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onhand_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      onhand_movements: {
        Row: {
          id: string
          movement_date: string
          movement_type: string
          organization_id: string
          warehouse_id: string
          location_id: string
          goods_model_id: string
          lot_number: string | null
          serial_number: string | null
          quantity_before: number
          quantity_change: number
          quantity_after: number
          reserved_before: number
          reserved_change: number
          reserved_after: number
          reference_document_type: string | null
          reference_document_id: string | null
          reference_document_code: string | null
          reference_line_id: string | null
          from_warehouse_id: string | null
          from_location_id: string | null
          to_warehouse_id: string | null
          to_location_id: string | null
          reason: string | null
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          movement_date?: string
          movement_type: string
          organization_id: string
          warehouse_id: string
          location_id: string
          goods_model_id: string
          lot_number?: string | null
          serial_number?: string | null
          quantity_before?: number
          quantity_change: number
          quantity_after: number
          reserved_before?: number
          reserved_change?: number
          reserved_after?: number
          reference_document_type?: string | null
          reference_document_id?: string | null
          reference_document_code?: string | null
          reference_line_id?: string | null
          from_warehouse_id?: string | null
          from_location_id?: string | null
          to_warehouse_id?: string | null
          to_location_id?: string | null
          reason?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          movement_date?: string
          movement_type?: string
          organization_id?: string
          warehouse_id?: string
          location_id?: string
          goods_model_id?: string
          lot_number?: string | null
          serial_number?: string | null
          quantity_before?: number
          quantity_change?: number
          quantity_after?: number
          reserved_before?: number
          reserved_change?: number
          reserved_after?: number
          reference_document_type?: string | null
          reference_document_id?: string | null
          reference_document_code?: string | null
          reference_line_id?: string | null
          from_warehouse_id?: string | null
          from_location_id?: string | null
          to_warehouse_id?: string | null
          to_location_id?: string | null
          reason?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onhand_movements_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onhand_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onhand_movements_location_id_fkey"
            columns: ["location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onhand_movements_goods_model_id_fkey"
            columns: ["goods_model_id"]
            referencedRelation: "goods_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onhand_movements_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onhand_movements_from_location_id_fkey"
            columns: ["from_location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onhand_movements_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onhand_movements_to_location_id_fkey"
            columns: ["to_location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onhand_movements_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      v_stock_summary: {
        Row: {
          warehouse_id: string | null
          goods_model_id: string | null
          total_quantity_onhand: number | null
          total_quantity_reserved: number | null
          total_quantity_available: number | null
          last_updated_at: string | null
        }
      }
      v_stock_details: { Row: {} }
      v_expiring_stock: { Row: {} }
      v_low_stock_alert: { Row: {} }
      v_movement_history: { Row: {} }
    }
    Functions: {
      create_inventory_movement: {
        Args: {
          p_movement_type: string
          p_warehouse_id: string
          p_location_id: string
          p_goods_model_id: string
          p_lot_number?: string
          p_serial_number?: string
          p_quantity_change?: number
          p_reserved_change?: number
          p_reference_document_type?: string
          p_reference_document_id?: string
          p_reference_document_code?: string
          p_reference_line_id?: string
          p_from_warehouse_id?: string
          p_from_location_id?: string
          p_to_warehouse_id?: string
          p_to_location_id?: string
          p_reason?: string
          p_notes?: string
        }
        Returns: string
      }
      get_available_quantity: {
        Args: {
          p_warehouse_id: string
          p_goods_model_id: string
          p_lot_number?: string
          p_serial_number?: string
        }
        Returns: number
      }
      is_quantity_available: {
        Args: {
          p_warehouse_id: string
          p_goods_model_id: string
          p_required_quantity: number
          p_lot_number?: string
          p_serial_number?: string
        }
        Returns: boolean
      }
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
          organization_id: string
          warehouse_id: string
          supplier_id: string | null
          code: string
          document_date: string
          expected_date: string | null
          actual_date: string | null
          purchase_order_number: string | null
          supplier_invoice_number: string | null
          supplier_delivery_note: string | null
          carrier_name: string | null
          vehicle_number: string | null
          driver_name: string | null
          driver_phone: string | null
          status: Database["public"]["Enums"]["gr_status_enum"]
          confirmed_at: string | null
          confirmed_by: string | null
          started_at: string | null
          started_by: string | null
          completed_at: string | null
          completed_by: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          cancellation_reason: string | null
          notes: string | null
          attachments: Json | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
          gr_type: Database["public"]["Enums"]["gr_type_enum"]
        }
        Insert: {
          id?: string
          organization_id: string
          warehouse_id: string
          supplier_id?: string | null
          code: string
          document_date?: string
          expected_date?: string | null
          actual_date?: string | null
          purchase_order_number?: string | null
          supplier_invoice_number?: string | null
          supplier_delivery_note?: string | null
          carrier_name?: string | null
          vehicle_number?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          status?: Database["public"]["Enums"]["gr_status_enum"]
          confirmed_at?: string | null
          confirmed_by?: string | null
          started_at?: string | null
          started_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          notes?: string | null
          attachments?: Json | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
          gr_type?: Database["public"]["Enums"]["gr_type_enum"]
        }
        Update: {
          id?: string
          organization_id?: string
          warehouse_id?: string
          supplier_id?: string | null
          code?: string
          document_date?: string
          expected_date?: string | null
          actual_date?: string | null
          purchase_order_number?: string | null
          supplier_invoice_number?: string | null
          supplier_delivery_note?: string | null
          carrier_name?: string | null
          vehicle_number?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          status?: Database["public"]["Enums"]["gr_status_enum"]
          confirmed_at?: string | null
          confirmed_by?: string | null
          started_at?: string | null
          started_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          notes?: string | null
          attachments?: Json | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
          gr_type?: Database["public"]["Enums"]["gr_type_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "gr_header_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_header_warehouse_id_fkey"
            columns: ["warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_header_supplier_id_fkey"
            columns: ["supplier_id"]
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_header_confirmed_by_fkey"
            columns: ["confirmed_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_header_started_by_fkey"
            columns: ["started_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_header_completed_by_fkey"
            columns: ["completed_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_header_cancelled_by_fkey"
            columns: ["cancelled_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_header_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_header_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
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
          line_number: number
          quantity_expected: number
          quantity_received: number
          quantity_remaining: number
          lot_number: string | null
          serial_number: string | null
          manufacture_date: string | null
          expiry_date: string | null
          received_location_id: string | null
          line_status: string | null
          notes: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          gr_header_id: string
          goods_model_id: string
          uom_id: string
          line_number?: number
          quantity_expected: number
          quantity_received?: number
          lot_number?: string | null
          serial_number?: string | null
          manufacture_date?: string | null
          expiry_date?: string | null
          received_location_id?: string | null
          line_status?: string | null
          notes?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          gr_header_id?: string
          goods_model_id?: string
          uom_id?: string
          line_number?: number
          quantity_expected?: number
          quantity_received?: number
          lot_number?: string | null
          serial_number?: string | null
          manufacture_date?: string | null
          expiry_date?: string | null
          received_location_id?: string | null
          line_status?: string | null
          notes?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gr_lines_gr_header_id_fkey"
            columns: ["gr_header_id"]
            referencedRelation: "gr_header"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_lines_goods_model_id_fkey"
            columns: ["goods_model_id"]
            referencedRelation: "goods_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_lines_uom_id_fkey"
            columns: ["uom_id"]
            referencedRelation: "uoms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_lines_received_location_id_fkey"
            columns: ["received_location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_lines_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_lines_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      gi_header: {
        Row: {
          id: string
          organization_id: string
          warehouse_id: string
          customer_id: string | null
          code: string
          document_date: string
          expected_date: string | null
          actual_date: string | null
          sales_order_number: string | null
          customer_po_number: string | null
          delivery_note_number: string | null
          carrier_name: string | null
          vehicle_number: string | null
          driver_name: string | null
          driver_phone: string | null
          delivery_address: string | null
          delivery_contact_name: string | null
          delivery_contact_phone: string | null
          status: Database["public"]["Enums"]["gi_status_enum"]
          submitted_at: string | null
          submitted_by: string | null
          approved_at: string | null
          approved_by: string | null
          started_at: string | null
          started_by: string | null
          completed_at: string | null
          completed_by: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          cancellation_reason: string | null
          notes: string | null
          attachments: Json | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          warehouse_id: string
          customer_id?: string | null
          code: string
          document_date?: string
          expected_date?: string | null
          actual_date?: string | null
          sales_order_number?: string | null
          customer_po_number?: string | null
          delivery_note_number?: string | null
          carrier_name?: string | null
          vehicle_number?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          delivery_address?: string | null
          delivery_contact_name?: string | null
          delivery_contact_phone?: string | null
          status?: Database["public"]["Enums"]["gi_status_enum"]
          submitted_at?: string | null
          submitted_by?: string | null
          approved_at?: string | null
          approved_by?: string | null
          started_at?: string | null
          started_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          notes?: string | null
          attachments?: Json | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          warehouse_id?: string
          customer_id?: string | null
          code?: string
          document_date?: string
          expected_date?: string | null
          actual_date?: string | null
          sales_order_number?: string | null
          customer_po_number?: string | null
          delivery_note_number?: string | null
          carrier_name?: string | null
          vehicle_number?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          delivery_address?: string | null
          delivery_contact_name?: string | null
          delivery_contact_phone?: string | null
          status?: Database["public"]["Enums"]["gi_status_enum"]
          submitted_at?: string | null
          submitted_by?: string | null
          approved_at?: string | null
          approved_by?: string | null
          started_at?: string | null
          started_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          notes?: string | null
          attachments?: Json | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gi_header_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_header_warehouse_id_fkey"
            columns: ["warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_header_customer_id_fkey"
            columns: ["customer_id"]
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_header_submitted_by_fkey"
            columns: ["submitted_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_header_approved_by_fkey"
            columns: ["approved_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_header_started_by_fkey"
            columns: ["started_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_header_completed_by_fkey"
            columns: ["completed_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_header_cancelled_by_fkey"
            columns: ["cancelled_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_header_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_header_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      gi_lines: {
        Row: {
          id: string
          gi_header_id: string
          goods_model_id: string
          uom_id: string
          line_number: number
          quantity_requested: number
          quantity_issued: number
          quantity_remaining: number
          pick_location_id: string | null
          lot_number: string | null
          serial_number: string | null
          line_status: string | null
          notes: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          gi_header_id: string
          goods_model_id: string
          uom_id: string
          line_number: number
          quantity_requested: number
          quantity_issued?: number
          pick_location_id?: string | null
          lot_number?: string | null
          serial_number?: string | null
          line_status?: string | null
          notes?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          gi_header_id?: string
          goods_model_id?: string
          uom_id?: string
          line_number?: number
          quantity_requested?: number
          quantity_issued?: number
          pick_location_id?: string | null
          lot_number?: string | null
          serial_number?: string | null
          line_status?: string | null
          notes?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
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
          },
          {
            foreignKeyName: "gi_lines_uom_id_fkey"
            columns: ["uom_id"]
            referencedRelation: "uoms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_lines_pick_location_id_fkey"
            columns: ["pick_location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_lines_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_lines_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      gt_header: {
        Row: {
          id: string
          organization_id: string
          from_warehouse_id: string
          to_warehouse_id: string
          code: string
          document_date: string
          expected_date: string | null
          actual_date: string | null
          status: Database["public"]["Enums"]["gt_status_enum"]
          carrier_name: string | null
          vehicle_number: string | null
          notes: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          completed_at: string | null
          completed_by: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          from_warehouse_id: string
          to_warehouse_id: string
          code: string
          document_date?: string
          expected_date?: string | null
          actual_date?: string | null
          status?: Database["public"]["Enums"]["gt_status_enum"]
          carrier_name?: string | null
          vehicle_number?: string | null
          notes?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          from_warehouse_id?: string
          to_warehouse_id?: string
          code?: string
          document_date?: string
          expected_date?: string | null
          actual_date?: string | null
          status?: Database["public"]["Enums"]["gt_status_enum"]
          carrier_name?: string | null
          vehicle_number?: string | null
          notes?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gt_header_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
          },
          {
            foreignKeyName: "gt_header_confirmed_by_fkey"
            columns: ["confirmed_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gt_header_completed_by_fkey"
            columns: ["completed_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gt_header_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gt_header_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      gt_lines: {
        Row: {
          id: string
          gt_header_id: string
          goods_model_id: string
          uom_id: string
          line_number: number
          from_location_id: string
          to_location_id: string
          lot_number: string | null
          serial_number: string | null
          quantity: number
          quantity_transferred: number | null
          line_status: string | null
          notes: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          gt_header_id: string
          goods_model_id: string
          uom_id: string
          line_number: number
          from_location_id: string
          to_location_id: string
          lot_number?: string | null
          serial_number?: string | null
          quantity: number
          quantity_transferred?: number | null
          line_status?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          gt_header_id?: string
          goods_model_id?: string
          uom_id?: string
          line_number?: number
          from_location_id?: string
          to_location_id?: string
          lot_number?: string | null
          serial_number?: string | null
          quantity?: number
          quantity_transferred?: number | null
          line_status?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gt_lines_gt_header_id_fkey"
            columns: ["gt_header_id"]
            referencedRelation: "gt_header"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gt_lines_goods_model_id_fkey"
            columns: ["goods_model_id"]
            referencedRelation: "goods_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gt_lines_uom_id_fkey"
            columns: ["uom_id"]
            referencedRelation: "uoms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gt_lines_from_location_id_fkey"
            columns: ["from_location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gt_lines_to_location_id_fkey"
            columns: ["to_location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gt_lines_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ic_header: {
        Row: {
          id: string
          organization_id: string
          warehouse_id: string
          code: string
          count_date: string
          status: Database["public"]["Enums"]["ic_status_enum"]
          count_type: string | null
          notes: string | null
          started_at: string | null
          started_by: string | null
          completed_at: string | null
          completed_by: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          warehouse_id: string
          code: string
          count_date?: string
          status?: Database["public"]["Enums"]["ic_status_enum"]
          count_type?: string | null
          notes?: string | null
          started_at?: string | null
          started_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          warehouse_id?: string
          code?: string
          count_date?: string
          status?: Database["public"]["Enums"]["ic_status_enum"]
          count_type?: string | null
          notes?: string | null
          started_at?: string | null
          started_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ic_header_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_header_warehouse_id_fkey"
            columns: ["warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_header_started_by_fkey"
            columns: ["started_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_header_completed_by_fkey"
            columns: ["completed_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_header_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_header_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ic_lines: {
        Row: {
          id: string
          ic_header_id: string
          location_id: string
          goods_model_id: string
          lot_number: string | null
          serial_number: string | null
          line_number: number
          system_quantity: number
          counted_quantity: number | null
          variance_quantity: number
          variance_reason: string | null
          counted_by: string | null
          counted_at: string | null
          line_status: string | null
          notes: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          ic_header_id: string
          location_id: string
          goods_model_id: string
          lot_number?: string | null
          serial_number?: string | null
          line_number: number
          system_quantity?: number
          counted_quantity?: number | null
          variance_reason?: string | null
          counted_by?: string | null
          counted_at?: string | null
          line_status?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          ic_header_id?: string
          location_id?: string
          goods_model_id?: string
          lot_number?: string | null
          serial_number?: string | null
          line_number?: number
          system_quantity?: number
          counted_quantity?: number | null
          variance_reason?: string | null
          counted_by?: string | null
          counted_at?: string | null
          line_status?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_lines_ic_header_id_fkey"
            columns: ["ic_header_id"]
            referencedRelation: "ic_header"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_lines_location_id_fkey"
            columns: ["location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_lines_goods_model_id_fkey"
            columns: ["goods_model_id"]
            referencedRelation: "goods_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_lines_counted_by_fkey"
            columns: ["counted_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_lines_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      putaway_header: {
        Row: {
          id: string
          organization_id: string
          warehouse_id: string
          gr_header_id: string | null
          code: string
          putaway_date: string
          status: Database["public"]["Enums"]["putaway_status_enum"]
          notes: string | null
          started_at: string | null
          started_by: string | null
          completed_at: string | null
          completed_by: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          warehouse_id: string
          gr_header_id?: string | null
          code: string
          putaway_date?: string
          status?: Database["public"]["Enums"]["putaway_status_enum"]
          notes?: string | null
          started_at?: string | null
          started_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          warehouse_id?: string
          gr_header_id?: string | null
          code?: string
          putaway_date?: string
          status?: Database["public"]["Enums"]["putaway_status_enum"]
          notes?: string | null
          started_at?: string | null
          started_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "putaway_header_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_header_warehouse_id_fkey"
            columns: ["warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_header_gr_header_id_fkey"
            columns: ["gr_header_id"]
            referencedRelation: "gr_header"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_header_started_by_fkey"
            columns: ["started_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_header_completed_by_fkey"
            columns: ["completed_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_header_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_header_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      putaway_lines: {
        Row: {
          id: string
          putaway_header_id: string
          goods_model_id: string
          line_number: number
          from_location_id: string
          to_location_id: string
          lot_number: string | null
          serial_number: string | null
          quantity: number
          quantity_putaway: number | null
          line_status: string | null
          notes: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          putaway_header_id: string
          goods_model_id: string
          line_number: number
          from_location_id: string
          to_location_id: string
          lot_number?: string | null
          serial_number?: string | null
          quantity: number
          quantity_putaway?: number | null
          line_status?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          putaway_header_id?: string
          goods_model_id?: string
          line_number?: number
          from_location_id?: string
          to_location_id?: string
          lot_number?: string | null
          serial_number?: string | null
          quantity?: number
          quantity_putaway?: number | null
          line_status?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "putaway_lines_putaway_header_id_fkey"
            columns: ["putaway_header_id"]
            referencedRelation: "putaway_header"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_lines_goods_model_id_fkey"
            columns: ["goods_model_id"]
            referencedRelation: "goods_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_lines_from_location_id_fkey"
            columns: ["from_location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_lines_to_location_id_fkey"
            columns: ["to_location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_lines_created_by_fkey"
            columns: ["created_by"]
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
        gr_confirm: {
            Args: { p_gr_header_id: string };
            Returns: undefined;
        };
        gr_start_receiving: {
            Args: { p_gr_header_id: string };
            Returns: undefined;
        };
        gr_receive_line: {
            Args: {
                p_gr_line_id: string,
                p_quantity_to_receive: number,
                p_location_id: string,
                p_lot_number?: string,
                p_serial_number?: string,
                p_manufacture_date?: string,
                p_expiry_date?: string
            };
            Returns: string;
        };
        gr_complete_receiving: {
            Args: { p_gr_header_id: string, p_skip_putaway?: boolean };
            Returns: undefined;
        };
        gr_cancel: {
            Args: { p_gr_header_id: string, p_cancellation_reason: string };
            Returns: undefined;
        };
        gi_create_and_reserve: {
            Args: { p_gi_header_id: string };
            Returns: undefined;
        };
        gi_submit_for_approval: {
            Args: { p_gi_header_id: string };
            Returns: undefined;
        };
        gi_approve: {
            Args: { p_gi_header_id: string };
            Returns: undefined;
        };
        gi_start_picking: {
            Args: { p_gi_header_id: string };
            Returns: undefined;
        };
        gi_issue_line: {
            Args: {
                p_gi_line_id: string,
                p_quantity_to_issue: number,
                p_location_id: string,
                p_lot_number?: string,
                p_serial_number?: string
            };
            Returns: string;
        };
        gi_complete: {
            Args: { p_gi_header_id: string };
            Returns: undefined;
        };
        gi_cancel: {
            Args: { p_gi_header_id: string, p_cancellation_reason: string };
            Returns: undefined;
        };
        gt_confirm: {
            Args: { p_gt_header_id: string };
            Returns: undefined;
        };
        gt_transfer_line: {
            Args: { p_gt_line_id: string, p_quantity_to_transfer: number };
            Returns: undefined;
        };
        gt_complete: {
            Args: { p_gt_header_id: string };
            Returns: undefined;
        };
        ic_start: {
            Args: { p_ic_header_id: string };
            Returns: undefined;
        };
        ic_count_line: {
            Args: { p_ic_line_id: string, p_counted_quantity: number, p_variance_reason?: string };
            Returns: undefined;
        };
        ic_complete: {
            Args: { p_ic_header_id: string, p_apply_adjustments?: boolean };
            Returns: undefined;
        };
        putaway_start: {
            Args: { p_putaway_header_id: string };
            Returns: undefined;
        };
        putaway_execute_line: {
            Args: { p_putaway_line_id: string, p_quantity_to_putaway: number };
            Returns: undefined;
        };
        putaway_complete: {
            Args: { p_putaway_header_id: string };
            Returns: undefined;
        };
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
      v_dashboard_summary: {
        Row: {
          active_goods_models: number | null
          gi_count_30d: number | null
          gr_count_30d: number | null
          total_quantity_onhand: number | null
        }
      }
      v_warehouse_performance: { Row: {} }
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