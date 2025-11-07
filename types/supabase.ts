
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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: number
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: number | null
          table_name: string
          user_agent: string | null
          user_id: number | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: number
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: number | null
          table_name: string
          user_agent?: string | null
          user_id?: number | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: number
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: number | null
          table_name?: string
          user_agent?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      branches: {
        Row: {
          address: string | null
          city: string | null
          code: string
          country: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          email: string | null
          id: number
          is_active: boolean | null
          manager_name: string | null
          name: string
          notes: string | null
          org_id: number
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: number
          is_active?: boolean | null
          manager_name?: string | null
          name: string
          notes?: string | null
          org_id: number
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: number
          is_active?: boolean | null
          manager_name?: string | null
          name?: string
          notes?: string | null
          org_id?: number
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
          updated_by?: string | null
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
      document_sequences: {
        Row: {
          created_at: string
          document_type: string
          id: number
          last_sequence: number
          updated_at: string
          year_month: string
        }
        Insert: {
          created_at?: string
          document_type: string
          id?: number
          last_sequence?: number
          updated_at?: string
          year_month: string
        }
        Update: {
          created_at?: string
          document_type?: string
          id?: number
          last_sequence?: number
          updated_at?: string
          year_month?: string
        }
        Relationships: []
      }
      gi_line_details: {
        Row: {
          allocation_method: string
          created_at: string
          created_by: number | null
          goods_model_id: number
          id: number
          gi_line_id: number
          location_id: number
          lot: string | null
          onhand_id: number | null
          quantity_allocated: number
          serial: string | null
          warehouse_id: number
        }
        Insert: {
          allocation_method: string
          created_at?: string
          created_by?: number | null
          goods_model_id: number
          id?: number
          gi_line_id: number
          location_id: number
          lot?: string | null
          onhand_id?: number | null
          quantity_allocated: number
          serial?: string | null
          warehouse_id: number
        }
        Update: {
          allocation_method?: string
          created_at?: string
          created_by?: number | null
          goods_model_id?: number
          id?: number
          gi_line_id?: number
          location_id?: number
          lot?: string | null
          onhand_id?: number | null
          quantity_allocated?: number
          serial?: string | null
          warehouse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "gi_line_details_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_line_details_goods_model_id_fkey"
            columns: ["goods_model_id"]
            referencedRelation: "goods_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_line_details_gi_line_id_fkey"
            columns: ["gi_line_id"]
            referencedRelation: "gi_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_line_details_location_id_fkey"
            columns: ["location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_line_details_onhand_id_fkey"
            columns: ["onhand_id"]
            referencedRelation: "onhand"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_line_details_warehouse_id_fkey"
            columns: ["warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          }
        ]
      }
      gi_lines: {
        Row: {
          created_at: string | null
          goods_model_id: number
          id: number
          gi_id: number
          location_id: number | null
          lot_number: string | null
          notes: string | null
          quantity_allocated_summary: number | null
          quantity_difference: number | null
          quantity_picked: number | null
          quantity_planned: number
          required_qty: number
          serial_number: string | null
          tracking_type: Database["public"]["Enums"]["tracking_type_enum"]
          uom_id: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          goods_model_id: number
          id?: number
          gi_id: number
          location_id?: number | null
          lot_number?: string | null
          notes?: string | null
          quantity_allocated_summary?: number | null
          quantity_difference?: number | null
          quantity_picked?: number | null
          quantity_planned: number
          required_qty: number
          serial_number?: string | null
          tracking_type: Database["public"]["Enums"]["tracking_type_enum"]
          uom_id: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          goods_model_id?: number
          id?: number
          gi_id?: number
          location_id?: number | null
          lot_number?: string | null
          notes?: string | null
          quantity_allocated_summary?: number | null
          quantity_difference?: number | null
          quantity_picked?: number | null
          quantity_planned?: number
          required_qty?: number
          serial_number?: string | null
          tracking_type?: Database["public"]["Enums"]["tracking_type_enum"]
          uom_id?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gi_lines_goods_model_id_fkey"
            columns: ["goods_model_id"]
            referencedRelation: "goods_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_lines_gi_id_fkey"
            columns: ["gi_id"]
            referencedRelation: "goods_issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_lines_location_id_fkey"
            columns: ["location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_lines_uom_id_fkey"
            columns: ["uom_id"]
            referencedRelation: "uoms"
            referencedColumns: ["id"]
          }
        ]
      }
      goods_issues: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          delivery_address: string | null
          id: number
          issue_date: string
          issue_mode: Database["public"]["Enums"]["issue_mode_enum"]
          notes: string | null
          partner_id: number | null
          partner_name: string | null
          reference_number: string | null
          status: Database["public"]["Enums"]["gi_status_enum"]
          transaction_type: Database["public"]["Enums"]["gi_transaction_type_enum"]
          updated_at: string | null
          updated_by: string | null
          warehouse_id: number
          warehouse_to_id: number | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          delivery_address?: string | null
          id?: number
          issue_date: string
          issue_mode: Database["public"]["Enums"]["issue_mode_enum"]
          notes?: string | null
          partner_id?: number | null
          partner_name?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["gi_status_enum"]
          transaction_type: Database["public"]["Enums"]["gi_transaction_type_enum"]
          updated_at?: string | null
          updated_by?: string | null
          warehouse_id: number
          warehouse_to_id?: number | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          delivery_address?: string | null
          id?: number
          issue_date?: string
          issue_mode?: Database["public"]["Enums"]["issue_mode_enum"]
          notes?: string | null
          partner_id?: number | null
          partner_name?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["gi_status_enum"]
          transaction_type?: Database["public"]["Enums"]["gi_transaction_type_enum"]
          updated_at?: string | null
          updated_by?: string | null
          warehouse_id?: number
          warehouse_to_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "goods_issues_partner_id_fkey"
            columns: ["partner_id"]
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_issues_warehouse_id_fkey"
            columns: ["warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_issues_to_warehouse_id_fkey"
            columns: ["warehouse_to_id"]
            referencedRelation: "warehouses"
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
          tracking_type?: Database["public"]["Enums"]["tracking_type_enum"]
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
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          id: number
          notes: string | null
          partner_id: number | null
          partner_name: string | null
          partner_reference: string | null
          receipt_date: string | null
          reference_number: string | null
          status: Database["public"]["Enums"]["gr_status_enum"]
          supplier_id: number | null
          transaction_type: Database["public"]["Enums"]["gr_transaction_type_enum"]
          updated_at: string | null
          updated_by: string | null
          warehouse_from_id: number | null
          warehouse_id: number
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: number
          notes?: string | null
          partner_id?: number | null
          partner_name?: string | null
          partner_reference?: string | null
          receipt_date?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["gr_status_enum"]
          supplier_id?: number | null
          transaction_type: Database["public"]["Enums"]["gr_transaction_type_enum"]
          updated_at?: string | null
          updated_by?: string | null
          warehouse_from_id?: number | null
          warehouse_id: number
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: number
          notes?: string | null
          partner_id?: number | null
          partner_name?: string | null
          partner_reference?: string | null
          receipt_date?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["gr_status_enum"]
          supplier_id?: number | null
          transaction_type?: Database["public"]["Enums"]["gr_transaction_type_enum"]
          updated_at?: string | null
          updated_by?: string | null
          warehouse_from_id?: number | null
          warehouse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipts_partner_id_fkey"
            columns: ["partner_id"]
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipts_supplier_id_fkey"
            columns: ["supplier_id"]
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipts_warehouse_from_id_fkey"
            columns: ["warehouse_from_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            referencedRelation: "warehouses"
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
      gr_line_tracking_details: {
        Row: {
          created_at: string
          expiry_date: string | null
          gr_line_id: number
          id: number
          number: string
          planned_qty: number | null
          received_qty: number | null
          status: string
          tracking_type: Database["public"]["Enums"]["tracking_type_enum"]
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          gr_line_id: number
          id?: number
          number: string
          planned_qty?: number | null
          received_qty?: number | null
          status: string
          tracking_type: Database["public"]["Enums"]["tracking_type_enum"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          gr_line_id?: number
          id?: number
          number?: string
          planned_qty?: number | null
          received_qty?: number | null
          status?: string
          tracking_type?: Database["public"]["Enums"]["tracking_type_enum"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gr_line_tracking_details_gr_line_id_fkey"
            columns: ["gr_line_id"]
            referencedRelation: "gr_lines"
            referencedColumns: ["id"]
          }
        ]
      }
      gr_lines: {
        Row: {
          created_at: string | null
          expiry_date: string | null
          goods_model_id: number
          id: number
          gr_id: number
          location_id: number | null
          lot_number: string | null
          manufacturing_date: string | null
          notes: string | null
          quantity_difference: number | null
          quantity_planned: number
          quantity_received: number | null
          serial_number: string | null
          tracking_type: Database["public"]["Enums"]["tracking_type_enum"]
          uom_id: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          expiry_date?: string | null
          goods_model_id: number
          id?: number
          gr_id: number
          location_id?: number | null
          lot_number?: string | null
          manufacturing_date?: string | null
          notes?: string | null
          quantity_difference?: number | null
          quantity_planned: number
          quantity_received?: number | null
          serial_number?: string | null
          tracking_type: Database["public"]["Enums"]["tracking_type_enum"]
          uom_id: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          expiry_date?: string | null
          goods_model_id?: number
          id?: number
          gr_id?: number
          location_id?: number | null
          lot_number?: string | null
          manufacturing_date?: string | null
          notes?: string | null
          quantity_difference?: number | null
          quantity_planned?: number
          quantity_received?: number | null
          serial_number?: string | null
          tracking_type?: Database["public"]["Enums"]["tracking_type_enum"]
          uom_id?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gr_lines_goods_model_id_fkey"
            columns: ["goods_model_id"]
            referencedRelation: "goods_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_lines_gr_id_fkey"
            columns: ["gr_id"]
            referencedRelation: "goods_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_lines_location_id_fkey"
            columns: ["location_id"]
            referencedRelation: "locations"
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
      locations: {
        Row: {
          code: string
          constrained_goods_model_ids: number[] | null
          constraint_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean
          name: string | null
          updated_at: string | null
          updated_by: string | null
          warehouse_id: number
        }
        Insert: {
          code: string
          constrained_goods_model_ids?: number[] | null
          constraint_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string | null
          updated_at?: string | null
          updated_by?: string | null
          warehouse_id: number
        }
        Update: {
          code?: string
          constrained_goods_model_ids?: number[] | null
          constraint_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string | null
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
      onhand: {
        Row: {
          available_quantity: number | null
          created_at: string | null
          expiry_date: string | null
          goods_model_id: number
          id: number
          location_id: number | null
          lot_number: string | null
          manufacturing_date: string | null
          notes: string | null
          quantity: number | null
          received_date: string | null
          reserved_quantity: number | null
          serial_number: string | null
          updated_at: string | null
          warehouse_id: number
        }
        Insert: {
          available_quantity?: number | null
          created_at?: string | null
          expiry_date?: string | null
          goods_model_id: number
          id?: number
          location_id?: number | null
          lot_number?: string | null
          manufacturing_date?: string | null
          notes?: string | null
          quantity?: number | null
          received_date?: string | null
          reserved_quantity?: number | null
          serial_number?: string | null
          updated_at?: string | null
          warehouse_id: number
        }
        Update: {
          available_quantity?: number | null
          created_at?: string | null
          expiry_date?: string | null
          goods_model_id?: number
          id?: number
          location_id?: number | null
          lot_number?: string | null
          manufacturing_date?: string | null
          notes?: string | null
          quantity?: number | null
          received_date?: string | null
          reserved_quantity?: number | null
          serial_number?: string | null
          updated_at?: string | null
          warehouse_id?: number
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
          from_location_id: number | null
          goods_model_id: number
          id: number
          lot: string | null
          moved_at: string
          moved_by: number
          movement_code: string
          movement_type: Database["public"]["Enums"]["movement_type_enum"]
          quantity_after: number
          quantity_before: number
          quantity_change: number
          reference_id: number
          ref_id: number | null
          ref_line_id: number | null
          serial: string | null
          to_location_id: number | null
          warehouse_id: number
        }
        Insert: {
          from_location_id?: number | null
          goods_model_id: number
          id?: number
          lot?: string | null
          moved_at?: string
          moved_by: number
          movement_code: string
          movement_type: Database["public"]["Enums"]["movement_type_enum"]
          quantity_after: number
          quantity_before: number
          quantity_change: number
          reference_id: number
          ref_id?: number | null
          ref_line_id?: number | null
          serial?: string | null
          to_location_id?: number | null
          warehouse_id: number
        }
        Update: {
          from_location_id?: number | null
          goods_model_id?: number
          id?: number
          lot?: string | null
          moved_at?: string
          moved_by?: number
          movement_code?: string
          movement_type?: Database["public"]["Enums"]["movement_type_enum"]
          quantity_after?: number
          quantity_before?: number
          quantity_change?: number
          reference_id?: number
          ref_id?: number | null
          ref_line_id?: number | null
          serial?: string | null
          to_location_id?: number | null
          warehouse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "onhand_movements_from_location_id_fkey"
            columns: ["from_location_id"]
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
            foreignKeyName: "onhand_movements_to_location_id_fkey"
            columns: ["to_location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onhand_movements_warehouse_id_fkey"
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
          created_at: string | null
          created_by: string | null
          email: string | null
          id: number
          is_active: boolean | null
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
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: number
          is_active?: boolean | null
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
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: number
          is_active?: boolean | null
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
          created_at: string | null
          created_by: string | null
          email: string | null
          id: number
          is_active: boolean
          name: string
          notes: string | null
          org_id: number
          partner_type: string
          phone: string | null
          tax_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: number
          is_active?: boolean
          name: string
          notes?: string | null
          org_id: number
          partner_type: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: number
          is_active?: boolean
          name?: string
          notes?: string | null
          org_id?: number
          partner_type?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      transaction_status_history: {
        Row: {
          action: string | null
          changed_at: string
          changed_by: number | null
          device_info: Json | null
          from_status: string | null
          id: number
          notes: string | null
          to_status: string
          transaction_id: number
          transaction_type: string
        }
        Insert: {
          action?: string | null
          changed_at?: string
          changed_by?: number | null
          device_info?: Json | null
          from_status?: string | null
          id?: number
          notes?: string | null
          to_status: string
          transaction_id: number
          transaction_type: string
        }
        Update: {
          action?: string | null
          changed_at?: string
          changed_by?: number | null
          device_info?: Json | null
          from_status?: string | null
          id?: number
          notes?: string | null
          to_status?: string
          transaction_id?: number
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_status_history_changed_by_fkey"
            columns: ["changed_by"]
            referencedRelation: "users"
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
      user_organizations: {
        Row: {
          created_at: string | null
          org_id: number
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          org_id: number
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          org_id?: number
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_org_id_fkey"
            columns: ["org_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_organizations_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          branch_id: number | null
          created_at: string
          created_by: number | null
          email: string
          full_name: string
          id: number
          is_active: boolean
          last_login_at: string | null
          organization_id: number | null
          password_hash: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role_enum"]
          updated_at: string
          username: string
        }
        Insert: {
          branch_id?: number | null
          created_at?: string
          created_by?: number | null
          email: string
          full_name: string
          id?: number
          is_active?: boolean
          last_login_at?: string | null
          organization_id?: number | null
          password_hash: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role_enum"]
          updated_at?: string
          username: string
        }
        Update: {
          branch_id?: number | null
          created_at?: string
          created_by?: number | null
          email?: string
          full_name?: string
          id?: number
          is_active?: boolean
          last_login_at?: string | null
          organization_id?: number | null
          password_hash?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role_enum"]
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_branch_id_fkey"
            columns: ["branch_id"]
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          branch_id: number
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean
          manager_name: string | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
          updated_by: string | null
          warehouse_type: Database["public"]["Enums"]["warehouse_type_enum"]
        }
        Insert: {
          address?: string | null
          branch_id: number
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          manager_name?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          updated_by?: string | null
          warehouse_type?: Database["public"]["Enums"]["warehouse_type_enum"]
        }
        Update: {
          address?: string | null
          branch_id?: number
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          manager_name?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          updated_by?: string | null
          warehouse_type?: Database["public"]["Enums"]["warehouse_type_enum"]
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
      create_goods_receipt_with_lines: {
        Args: {
          p_warehouse_id: number
          p_receipt_date: string
          p_transaction_type: string
          p_status: string
          p_partner_name: string
          p_partner_reference: string
          p_notes: string
          p_lines: Json
        }
        Returns: number
      }
      get_gi_list: {
        Args: {
          page_index: number
          page_size: number
          filter_warehouse_id: number
          filter_status: string
          filter_ref_no: string
        }
        Returns: Json
      }
      get_schema_details: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      gi_status_enum:
        | "DRAFT"
        | "CREATED"
        | "PICKING"
        | "PICKED"
        | "COMPLETED"
        | "CANCELLED"
      gi_transaction_type_enum:
        | "SALES"
        | "PRODUCTION"
        | "RETURN_TO_SUPPLIER"
        | "TRANSFER_OUT"
        | "INTERNAL_USE"
        | "ADJUSTMENT_OUT"
        | "SCRAP"
        | "OTHER"
      gr_status_enum:
        | "DRAFT"
        | "CREATED"
        | "RECEIVING"
        | "PARTIAL_RECEIVED"
        | "APPROVED"
        | "COMPLETED"
      gr_transaction_type_enum:
        | "PURCHASE"
        | "PRODUCTION"
        | "RETURN_FROM_CUSTOMER"
        | "TRANSFER_IN"
        | "ADJUSTMENT_IN"
        | "OTHER"
      gt_status_enum:
        | "CREATED"
        | "IN_TRANSIT"
        | "RECEIVING"
        | "PARTIAL_RECEIVED"
        | "PENDING_APPROVAL"
        | "COMPLETED"
      ic_status_enum:
        | "DRAFT"
        | "CREATED"
        | "COUNTING"
        | "COUNTED"
        | "COMPLETED"
      issue_mode_enum: "SUMMARY" | "DETAIL"
      movement_type_enum: "GR" | "GI" | "GT" | "IC_ADJUSTMENT" | "PUTAWAY"
      partner_type_enum: "SUPPLIER" | "CUSTOMER" | "CARRIER" | "OTHER"
      tracking_type_enum: "NONE" | "LOT" | "SERIAL"
      user_role_enum:
        | "SYSTEM_ADMIN"
        | "ORG_MANAGER"
        | "BRANCH_MANAGER"
        | "WAREHOUSE_MANAGER"
        | "WAREHOUSE_STAFF"
      warehouse_type_enum: "DC" | "STORE" | "3PL" | "PRODUCTION" | "TRANSIT"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Export individual types
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
export type GoodsIssue = Database['public']['Tables']['goods_issues']['Row'];
export type GILine = Database['public']['Tables']['gi_lines']['Row'];
export type GILineDetail = Database['public']['Tables']['gi_line_details']['Row'];
export type GRLineTrackingDetail = Database['public']['Tables']['gr_line_tracking_details']['Row'];
export type OnhandMovement = Database['public']['Tables']['onhand_movements']['Row'];
export type Onhand = Database['public']['Tables']['onhand']['Row'];
export type TransactionStatusHistory = Database['public']['Tables']['transaction_status_history']['Row'];
export type UserProfile = Database['public']['Tables']['profiles']['Row'];
