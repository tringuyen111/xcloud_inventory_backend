
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
      branches: {
        Row: {
          address: string | null
          code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: number
          is_active: boolean
          is_deleted: boolean
          manager_id: string | null
          name: string
          notes: string | null
          organization_id: number
          phone: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          is_active?: boolean
          is_deleted?: boolean
          manager_id?: string | null
          name: string
          notes?: string | null
          organization_id: number
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          is_active?: boolean
          is_deleted?: boolean
          manager_id?: string | null
          name?: string
          notes?: string | null
          organization_id?: number
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_manager_id_fkey"
            columns: ["manager_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
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
      document_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          created_at: string
          created_by: string | null
          document_id: number
          document_type: string
          from_status: Database["public"]["Enums"]["doc_status_enum"] | null
          id: number
          notes: string | null
          to_status: Database["public"]["Enums"]["doc_status_enum"]
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          created_by?: string | null
          document_id: number
          document_type: string
          from_status?: Database["public"]["Enums"]["doc_status_enum"] | null
          id?: number
          notes?: string | null
          to_status: Database["public"]["Enums"]["doc_status_enum"]
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          created_by?: string | null
          document_id?: number
          document_type?: string
          from_status?: Database["public"]["Enums"]["doc_status_enum"] | null
          id?: number
          notes?: string | null
          to_status?: Database["public"]["Enums"]["doc_status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "document_status_history_changed_by_fkey"
            columns: ["changed_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      gi_line_details: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          diff: number | null
          gi_line_id: number
          id: number
          is_deleted: boolean
          location_id: number
          lot_id: number | null
          notes: string | null
          qty_issued: number
          qty_requested: number | null
          serial_id: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          diff?: number | null
          gi_line_id: number
          id?: number
          is_deleted?: boolean
          location_id: number
          lot_id?: number | null
          notes?: string | null
          qty_issued: number
          qty_requested?: number | null
          serial_id?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          diff?: number | null
          gi_line_id?: number
          id?: number
          is_deleted?: boolean
          location_id?: number
          lot_id?: number | null
          notes?: string | null
          qty_issued?: number
          qty_requested?: number | null
          serial_id?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gi_line_details_gi_line_id_fkey"
            columns: ["gi_line_id"]
            referencedRelation: "gi_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_line_details_location_id_fkey"
            columns: ["location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_line_details_lot_id_fkey"
            columns: ["lot_id"]
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_line_details_serial_id_fkey"
            columns: ["serial_id"]
            referencedRelation: "serials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_line_details_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      gi_line_items: {
        Row: {
          adjustment_reason:
            | Database["public"]["Enums"]["adjustment_reason_enum"]
            | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          gi_id: number
          id: number
          is_deleted: boolean
          notes: string | null
          product_id: number
          qty_issued: number
          qty_requested: number
          tracking_type: Database["public"]["Enums"]["tracking_type_enum"]
          unit_price: number | null
          uom_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          adjustment_reason?:
            | Database["public"]["Enums"]["adjustment_reason_enum"]
            | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          gi_id: number
          id?: number
          is_deleted?: boolean
          notes?: string | null
          product_id: number
          qty_issued?: number
          qty_requested: number
          tracking_type: Database["public"]["Enums"]["tracking_type_enum"]
          unit_price?: number | null
          uom_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          adjustment_reason?:
            | Database["public"]["Enums"]["adjustment_reason_enum"]
            | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          gi_id?: number
          id?: number
          is_deleted?: boolean
          notes?: string | null
          product_id?: number
          qty_issued?: number
          qty_requested?: number
          tracking_type?: Database["public"]["Enums"]["tracking_type_enum"]
          unit_price?: number | null
          uom_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gi_line_items_gi_id_fkey"
            columns: ["gi_id"]
            referencedRelation: "goods_issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_line_items_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gi_line_items_uom_id_fkey"
            columns: ["uom_id"]
            referencedRelation: "uoms"
            referencedColumns: ["id"]
          }
        ]
      }
      goods_issues: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          expected_date: string | null
          id: number
          is_deleted: boolean
          is_manual: boolean
          issue_mode: Database["public"]["Enums"]["issue_mode_enum"]
          issued_date: string | null
          notes: string | null
          partner_id: number | null
          ref_no: string | null
          status: Database["public"]["Enums"]["doc_status_enum"]
          type: Database["public"]["Enums"]["gi_type_enum"]
          updated_at: string
          updated_by: string | null
          warehouse_id: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          expected_date?: string | null
          id?: number
          is_deleted?: boolean
          is_manual?: boolean
          issue_mode?: Database["public"]["Enums"]["issue_mode_enum"]
          issued_date?: string | null
          notes?: string | null
          partner_id?: number | null
          ref_no?: string | null
          status?: Database["public"]["Enums"]["doc_status_enum"]
          type?: Database["public"]["Enums"]["gi_type_enum"]
          updated_at?: string
          updated_by?: string | null
          warehouse_id: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          expected_date?: string | null
          id?: number
          is_deleted?: boolean
          is_manual?: boolean
          issue_mode?: Database["public"]["Enums"]["issue_mode_enum"]
          issued_date?: string | null
          notes?: string | null
          partner_id?: number | null
          ref_no?: string | null
          status?: Database["public"]["Enums"]["doc_status_enum"]
          type?: Database["public"]["Enums"]["gi_type_enum"]
          updated_at?: string
          updated_by?: string | null
          warehouse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "goods_issues_approved_by_fkey"
            columns: ["approved_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_issues_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_issues_partner_id_fkey"
            columns: ["partner_id"]
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_issues_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_issues_warehouse_id_fkey"
            columns: ["warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          }
        ]
      }
      goods_receipts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          expected_date: string | null
          id: number
          is_deleted: boolean
          is_manual: boolean
          notes: string | null
          partner_id: number | null
          received_date: string | null
          ref_no: string | null
          status: Database["public"]["Enums"]["doc_status_enum"]
          type: Database["public"]["Enums"]["gr_type_enum"]
          updated_at: string
          updated_by: string | null
          warehouse_id: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          expected_date?: string | null
          id?: number
          is_deleted?: boolean
          is_manual?: boolean
          notes?: string | null
          partner_id?: number | null
          received_date?: string | null
          ref_no?: string | null
          status?: Database["public"]["Enums"]["doc_status_enum"]
          type?: Database["public"]["Enums"]["gr_type_enum"]
          updated_at?: string
          updated_by?: string | null
          warehouse_id: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          expected_date?: string | null
          id?: number
          is_deleted?: boolean
          is_manual?: boolean
          notes?: string | null
          partner_id?: number | null
          received_date?: string | null
          ref_no?: string | null
          status?: Database["public"]["Enums"]["doc_status_enum"]
          type?: Database["public"]["Enums"]["gr_type_enum"]
          updated_at?: string
          updated_by?: string | null
          warehouse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipts_approved_by_fkey"
            columns: ["approved_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipts_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipts_partner_id_fkey"
            columns: ["partner_id"]
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipts_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
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
      goods_transfers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          expected_date: string | null
          from_warehouse_id: number
          id: number
          is_deleted: boolean
          notes: string | null
          ref_no: string | null
          status: Database["public"]["Enums"]["doc_status_enum"]
          to_warehouse_id: number
          transferred_date: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          expected_date?: string | null
          from_warehouse_id: number
          id?: number
          is_deleted?: boolean
          notes?: string | null
          ref_no?: string | null
          status?: Database["public"]["Enums"]["doc_status_enum"]
          to_warehouse_id: number
          transferred_date?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          expected_date?: string | null
          from_warehouse_id?: number
          id?: number
          is_deleted?: boolean
          notes?: string | null
          ref_no?: string | null
          status?: Database["public"]["Enums"]["doc_status_enum"]
          to_warehouse_id?: number
          transferred_date?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goods_transfers_approved_by_fkey"
            columns: ["approved_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_transfers_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_transfers_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_transfers_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_transfers_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      gr_line_details: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          diff: number | null
          gr_line_id: number
          id: number
          is_deleted: boolean
          location_id: number
          lot_id: number | null
          notes: string | null
          qty_expected: number | null
          qty_received: number
          serial_id: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          diff?: number | null
          gr_line_id: number
          id?: number
          is_deleted?: boolean
          location_id: number
          lot_id?: number | null
          notes?: string | null
          qty_expected?: number | null
          qty_received: number
          serial_id?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          diff?: number | null
          gr_line_id?: number
          id?: number
          is_deleted?: boolean
          location_id?: number
          lot_id?: number | null
          notes?: string | null
          qty_expected?: number | null
          qty_received?: number
          serial_id?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gr_line_details_gr_line_id_fkey"
            columns: ["gr_line_id"]
            referencedRelation: "gr_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_line_details_location_id_fkey"
            columns: ["location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_line_details_lot_id_fkey"
            columns: ["lot_id"]
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_line_details_serial_id_fkey"
            columns: ["serial_id"]
            referencedRelation: "serials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_line_details_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      gr_line_items: {
        Row: {
          adjustment_reason:
            | Database["public"]["Enums"]["adjustment_reason_enum"]
            | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          gr_id: number
          id: number
          is_deleted: boolean
          notes: string | null
          product_id: number
          qty_expected: number
          qty_received: number
          tracking_type: Database["public"]["Enums"]["tracking_type_enum"]
          unit_price: number | null
          uom_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          adjustment_reason?:
            | Database["public"]["Enums"]["adjustment_reason_enum"]
            | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          gr_id: number
          id?: number
          is_deleted?: boolean
          notes?: string | null
          product_id: number
          qty_expected: number
          qty_received?: number
          tracking_type: Database["public"]["Enums"]["tracking_type_enum"]
          unit_price?: number | null
          uom_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          adjustment_reason?:
            | Database["public"]["Enums"]["adjustment_reason_enum"]
            | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          gr_id?: number
          id?: number
          is_deleted?: boolean
          notes?: string | null
          product_id?: number
          qty_expected?: number
          qty_received?: number
          tracking_type?: Database["public"]["Enums"]["tracking_type_enum"]
          unit_price?: number | null
          uom_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gr_line_items_gr_id_fkey"
            columns: ["gr_id"]
            referencedRelation: "goods_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_line_items_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gr_line_items_uom_id_fkey"
            columns: ["uom_id"]
            referencedRelation: "uoms"
            referencedColumns: ["id"]
          }
        ]
      }
      gt_line_details: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          diff: number | null
          from_location_id: number
          gt_line_id: number
          id: number
          is_deleted: boolean
          lot_id: number | null
          notes: string | null
          qty_requested: number | null
          qty_transferred: number
          serial_id: number | null
          to_location_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          diff?: number | null
          from_location_id: number
          gt_line_id: number
          id?: number
          is_deleted?: boolean
          lot_id?: number | null
          notes?: string | null
          qty_requested?: number | null
          qty_transferred: number
          serial_id?: number | null
          to_location_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          diff?: number | null
          from_location_id?: number
          gt_line_id?: number
          id?: number
          is_deleted?: boolean
          lot_id?: number | null
          notes?: string | null
          qty_requested?: number | null
          qty_transferred?: number
          serial_id?: number | null
          to_location_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gt_line_details_from_location_id_fkey"
            columns: ["from_location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gt_line_details_gt_line_id_fkey"
            columns: ["gt_line_id"]
            referencedRelation: "gt_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gt_line_details_lot_id_fkey"
            columns: ["lot_id"]
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gt_line_details_serial_id_fkey"
            columns: ["serial_id"]
            referencedRelation: "serials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gt_line_details_to_location_id_fkey"
            columns: ["to_location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gt_line_details_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      gt_line_items: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          gt_id: number
          id: number
          is_deleted: boolean
          notes: string | null
          product_id: number
          qty_requested: number
          qty_transferred: number
          tracking_type: Database["public"]["Enums"]["tracking_type_enum"]
          uom_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          gt_id: number
          id?: number
          is_deleted?: boolean
          notes?: string | null
          product_id: number
          qty_requested: number
          qty_transferred?: number
          tracking_type: Database["public"]["Enums"]["tracking_type_enum"]
          uom_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          gt_id?: number
          id?: number
          is_deleted?: boolean
          notes?: string | null
          product_id?: number
          qty_requested?: number
          qty_transferred?: number
          tracking_type?: Database["public"]["Enums"]["tracking_type_enum"]
          uom_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gt_line_items_gt_id_fkey"
            columns: ["gt_id"]
            referencedRelation: "goods_transfers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gt_line_items_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gt_line_items_uom_id_fkey"
            columns: ["uom_id"]
            referencedRelation: "uoms"
            referencedColumns: ["id"]
          }
        ]
      }
      ic_line_details: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          diff: number | null
          ic_line_id: number
          id: number
          is_deleted: boolean
          location_id: number
          lot_id: number | null
          notes: string | null
          qty_counted: number
          qty_system: number | null
          serial_id: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          diff?: number | null
          ic_line_id: number
          id?: number
          is_deleted?: boolean
          location_id: number
          lot_id?: number | null
          notes?: string | null
          qty_counted: number
          qty_system?: number | null
          serial_id?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          diff?: number | null
          ic_line_id?: number
          id?: number
          is_deleted?: boolean
          location_id?: number
          lot_id?: number | null
          notes?: string | null
          qty_counted?: number
          qty_system?: number | null
          serial_id?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_line_details_ic_line_id_fkey"
            columns: ["ic_line_id"]
            referencedRelation: "ic_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_line_details_location_id_fkey"
            columns: ["location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_line_details_lot_id_fkey"
            columns: ["lot_id"]
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_line_details_serial_id_fkey"
            columns: ["serial_id"]
            referencedRelation: "serials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_line_details_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ic_line_items: {
        Row: {
          adjustment_reason:
            | Database["public"]["Enums"]["adjustment_reason_enum"]
            | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          ic_id: number
          id: number
          is_deleted: boolean
          notes: string | null
          product_id: number
          qty_counted: number
          qty_difference: number | null
          qty_system: number
          tracking_type: Database["public"]["Enums"]["tracking_type_enum"]
          uom_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          adjustment_reason?:
            | Database["public"]["Enums"]["adjustment_reason_enum"]
            | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          ic_id: number
          id?: number
          is_deleted?: boolean
          notes?: string | null
          product_id: number
          qty_counted?: number
          qty_difference?: number | null
          qty_system: number
          tracking_type: Database["public"]["Enums"]["tracking_type_enum"]
          uom_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          adjustment_reason?:
            | Database["public"]["Enums"]["adjustment_reason_enum"]
            | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          ic_id?: number
          id?: number
          is_deleted?: boolean
          notes?: string | null
          product_id?: number
          qty_counted?: number
          qty_difference?: number | null
          qty_system?: number
          tracking_type?: Database["public"]["Enums"]["tracking_type_enum"]
          uom_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_line_items_ic_id_fkey"
            columns: ["ic_id"]
            referencedRelation: "inventory_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_line_items_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_line_items_uom_id_fkey"
            columns: ["uom_id"]
            referencedRelation: "uoms"
            referencedColumns: ["id"]
          }
        ]
      }
      inventory_counts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          code: string
          count_date: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: number
          is_deleted: boolean
          notes: string | null
          status: Database["public"]["Enums"]["doc_status_enum"]
          updated_at: string
          updated_by: string | null
          warehouse_id: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          code: string
          count_date: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          is_deleted?: boolean
          notes?: string | null
          status?: Database["public"]["Enums"]["doc_status_enum"]
          updated_at?: string
          updated_by?: string | null
          warehouse_id: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          code?: string
          count_date?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          is_deleted?: boolean
          notes?: string | null
          status?: Database["public"]["Enums"]["doc_status_enum"]
          updated_at?: string
          updated_by?: string | null
          warehouse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_counts_approved_by_fkey"
            columns: ["approved_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_counts_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_counts_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_counts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          }
        ]
      }
      inventory_policies: {
        Row: {
          allow_negative_stock: boolean
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          expiry_warning_days: number
          id: number
          is_deleted: boolean
          is_lot_locked: boolean
          issue_policy: Database["public"]["Enums"]["issue_policy_enum"]
          notes: string | null
          organization_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allow_negative_stock?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          expiry_warning_days?: number
          id?: number
          is_deleted?: boolean
          is_lot_locked?: boolean
          issue_policy?: Database["public"]["Enums"]["issue_policy_enum"]
          notes?: string | null
          organization_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allow_negative_stock?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          expiry_warning_days?: number
          id?: number
          is_deleted?: boolean
          is_lot_locked?: boolean
          issue_policy?: Database["public"]["Enums"]["issue_policy_enum"]
          notes?: string | null
          organization_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_policies_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_policies_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_policies_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      locations: {
        Row: {
          aisle: string | null
          bin: string | null
          capacity_cbm: number | null
          capacity_weight_kg: number | null
          code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: number
          is_active: boolean
          is_deleted: boolean
          is_receiving_area: boolean
          is_shipping_area: boolean
          is_storage_area: boolean
          name: string
          notes: string | null
          rack: string | null
          shelf: string | null
          updated_at: string
          updated_by: string | null
          warehouse_id: number
        }
        Insert: {
          aisle?: string | null
          bin?: string | null
          capacity_cbm?: number | null
          capacity_weight_kg?: number | null
          code: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          is_active?: boolean
          is_deleted?: boolean
          is_receiving_area?: boolean
          is_shipping_area?: boolean
          is_storage_area?: boolean
          name: string
          notes?: string | null
          rack?: string | null
          shelf?: string | null
          updated_at?: string
          updated_by?: string | null
          warehouse_id: number
        }
        Update: {
          aisle?: string | null
          bin?: string | null
          capacity_cbm?: number | null
          capacity_weight_kg?: number | null
          code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          is_active?: boolean
          is_deleted?: boolean
          is_receiving_area?: boolean
          is_shipping_area?: boolean
          is_storage_area?: boolean
          name?: string
          notes?: string | null
          rack?: string | null
          shelf?: string | null
          updated_at?: string
          updated_by?: string | null
          warehouse_id?: number
        }
        Relationships: [
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
          },
          {
            foreignKeyName: "locations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          }
        ]
      }
      lots: {
        Row: {
          created_at: string
          created_by: string | null
          current_quantity: number | null
          deleted_at: string | null
          deleted_by: string | null
          expiry_date: string | null
          id: number
          initial_quantity: number
          is_deleted: boolean
          issued_quantity: number
          lot_number: string
          manufacture_date: string | null
          notes: string | null
          product_id: number
          received_quantity: number
          source: string
          status: Database["public"]["Enums"]["serial_lot_status_enum"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_quantity?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          expiry_date?: string | null
          id?: number
          initial_quantity?: number
          is_deleted?: boolean
          issued_quantity?: number
          lot_number: string
          manufacture_date?: string | null
          notes?: string | null
          product_id: number
          received_quantity?: number
          source?: string
          status?: Database["public"]["Enums"]["serial_lot_status_enum"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_quantity?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          expiry_date?: string | null
          id?: number
          initial_quantity?: number
          is_deleted?: boolean
          issued_quantity?: number
          lot_number?: string
          manufacture_date?: string | null
          notes?: string | null
          product_id?: number
          received_quantity?: number
          source?: string
          status?: Database["public"]["Enums"]["serial_lot_status_enum"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lots_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
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
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          id: number
          is_active: boolean
          is_deleted: boolean
          name: string
          notes: string | null
          phone: string | null
          tax_code: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: number
          is_active?: boolean
          is_deleted?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          tax_code?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: number
          is_active?: boolean
          is_deleted?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          tax_code?: string | null
          updated_at?: string
          updated_by?: string | null
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
      partners: {
        Row: {
          address: string | null
          code: string
          contact_person: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          id: number
          is_active: boolean
          is_deleted: boolean
          name: string
          notes: string | null
          phone: string | null
          search_vector: string | null
          tax_code: string | null
          type: Database["public"]["Enums"]["partner_type_enum"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          code: string
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: number
          is_active?: boolean
          is_deleted?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          search_vector?: string | null
          tax_code?: string | null
          type?: Database["public"]["Enums"]["partner_type_enum"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: number
          is_active?: boolean
          is_deleted?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          search_vector?: string | null
          tax_code?: string | null
          type?: Database["public"]["Enums"]["partner_type_enum"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
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
      permissions: {
        Row: {
          action: Database["public"]["Enums"]["permission_action"]
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean
          module: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["permission_action"]
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          module: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["permission_action"]
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          module?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      product_types: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          id: number
          is_active: boolean
          is_deleted: boolean
          name: string
          notes: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          is_deleted?: boolean
          name: string
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          is_deleted?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_types_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_types_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      product_uom_conversions: {
        Row: {
          conversion_factor: number
          created_at: string
          created_by: string | null
          id: number
          is_default: boolean
          notes: string | null
          product_id: number
          uom_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          conversion_factor: number
          created_at?: string
          created_by?: string | null
          id?: number
          is_default?: boolean
          notes?: string | null
          product_id: number
          uom_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          conversion_factor?: number
          created_at?: string
          created_by?: string | null
          id?: number
          is_default?: boolean
          notes?: string | null
          product_id?: number
          uom_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_uom_conversions_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_uom_conversions_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_uom_conversions_uom_id_fkey"
            columns: ["uom_id"]
            referencedRelation: "uoms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_uom_conversions_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          barcode: string | null
          base_uom_id: number
          code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: number
          images: string[] | null
          is_active: boolean
          is_deleted: boolean
          max_stock_level: number | null
          min_stock_level: number
          name: string
          notes: string | null
          organization_id: number
          product_type_id: number
          reorder_point: number | null
          search_vector: string | null
          shelf_life_days: number | null
          sku: string | null
          tracking_type: Database["public"]["Enums"]["tracking_type_enum"]
          updated_at: string
          updated_by: string | null
          volume_cbm: number | null
          weight_kg: number | null
        }
        Insert: {
          barcode?: string | null
          base_uom_id: number
          code: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          images?: string[] | null
          is_active?: boolean
          is_deleted?: boolean
          max_stock_level?: number | null
          min_stock_level?: number
          name: string
          notes?: string | null
          organization_id: number
          product_type_id: number
          reorder_point?: number | null
          search_vector?: string | null
          shelf_life_days?: number | null
          sku?: string | null
          tracking_type?: Database["public"]["Enums"]["tracking_type_enum"]
          updated_at?: string
          updated_by?: string | null
          volume_cbm?: number | null
          weight_kg?: number | null
        }
        Update: {
          barcode?: string | null
          base_uom_id?: number
          code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          images?: string[] | null
          is_active?: boolean
          is_deleted?: boolean
          max_stock_level?: number | null
          min_stock_level?: number
          name?: string
          notes?: string | null
          organization_id?: number
          product_type_id?: number
          reorder_point?: number | null
          search_vector?: string | null
          shelf_life_days?: number | null
          sku?: string | null
          tracking_type?: Database["public"]["Enums"]["tracking_type_enum"]
          updated_at?: string
          updated_by?: string | null
          volume_cbm?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_base_uom_id_fkey"
            columns: ["base_uom_id"]
            referencedRelation: "uoms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_product_type_id_fkey"
            columns: ["product_type_id"]
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      putaway_line_details: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          diff: number | null
          from_location_id: number
          id: number
          is_deleted: boolean
          lot_id: number | null
          notes: string | null
          putaway_line_id: number
          qty_putaway: number
          qty_to_putaway: number | null
          serial_id: number | null
          to_location_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          diff?: number | null
          from_location_id: number
          id?: number
          is_deleted?: boolean
          lot_id?: number | null
          notes?: string | null
          putaway_line_id: number
          qty_putaway: number
          qty_to_putaway?: number | null
          serial_id?: number | null
          to_location_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          diff?: number | null
          from_location_id?: number
          id?: number
          is_deleted?: boolean
          lot_id?: number | null
          notes?: string | null
          putaway_line_id?: number
          qty_putaway?: number
          qty_to_putaway?: number | null
          serial_id?: number | null
          to_location_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "putaway_line_details_from_location_id_fkey"
            columns: ["from_location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_line_details_lot_id_fkey"
            columns: ["lot_id"]
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_line_details_putaway_line_id_fkey"
            columns: ["putaway_line_id"]
            referencedRelation: "putaway_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_line_details_serial_id_fkey"
            columns: ["serial_id"]
            referencedRelation: "serials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_line_details_to_location_id_fkey"
            columns: ["to_location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_line_details_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      putaway_line_items: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: number
          is_deleted: boolean
          notes: string | null
          product_id: number
          putaway_id: number
          qty_putaway: number
          qty_to_putaway: number
          tracking_type: Database["public"]["Enums"]["tracking_type_enum"]
          uom_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          is_deleted?: boolean
          notes?: string | null
          product_id: number
          putaway_id: number
          qty_putaway?: number
          qty_to_putaway: number
          tracking_type: Database["public"]["Enums"]["tracking_type_enum"]
          uom_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          is_deleted?: boolean
          notes?: string | null
          product_id?: number
          putaway_id?: number
          qty_putaway?: number
          qty_to_putaway?: number
          tracking_type?: Database["public"]["Enums"]["tracking_type_enum"]
          uom_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "putaway_line_items_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_line_items_putaway_id_fkey"
            columns: ["putaway_id"]
            referencedRelation: "putaways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_line_items_uom_id_fkey"
            columns: ["uom_id"]
            referencedRelation: "uoms"
            referencedColumns: ["id"]
          }
        ]
      }
      putaways: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          gr_id: number | null
          id: number
          is_deleted: boolean
          notes: string | null
          putaway_date: string | null
          status: Database["public"]["Enums"]["doc_status_enum"]
          updated_at: string
          updated_by: string | null
          warehouse_id: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          gr_id?: number | null
          id?: number
          is_deleted?: boolean
          notes?: string | null
          putaway_date?: string | null
          status?: Database["public"]["Enums"]["doc_status_enum"]
          updated_at?: string
          updated_by?: string | null
          warehouse_id: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          gr_id?: number | null
          id?: number
          is_deleted?: boolean
          notes?: string | null
          putaway_date?: string | null
          status?: Database["public"]["Enums"]["doc_status_enum"]
          updated_at?: string
          updated_by?: string | null
          warehouse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "putaways_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaways_gr_id_fkey"
            columns: ["gr_id"]
            referencedRelation: "goods_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaways_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaways_warehouse_id_fkey"
            columns: ["warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          }
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          created_by: string | null
          granted_at: string
          granted_by: string | null
          permission_id: number
          role_id: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          granted_at?: string
          granted_by?: string | null
          permission_id: number
          role_id: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          granted_at?: string
          granted_by?: string | null
          permission_id?: number
          role_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            referencedRelation: "roles"
            referencedColumns: ["id"]
          }
        ]
      }
      roles: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean
          is_system: boolean
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          is_system?: boolean
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          is_system?: boolean
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      serials: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          expiry_date: string | null
          id: number
          is_deleted: boolean
          lot_id: number | null
          manufacture_date: string | null
          notes: string | null
          product_id: number
          serial_number: string
          source: string
          status: Database["public"]["Enums"]["serial_lot_status_enum"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          expiry_date?: string | null
          id?: number
          is_deleted?: boolean
          lot_id?: number | null
          manufacture_date?: string | null
          notes?: string | null
          product_id: number
          serial_number: string
          source?: string
          status?: Database["public"]["Enums"]["serial_lot_status_enum"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          expiry_date?: string | null
          id?: number
          is_deleted?: boolean
          lot_id?: number | null
          manufacture_date?: string | null
          notes?: string | null
          product_id?: number
          serial_number?: string
          source?: string
          status?: Database["public"]["Enums"]["serial_lot_status_enum"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "serials_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serials_lot_id_fkey"
            columns: ["lot_id"]
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serials_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serials_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      stock_ledger: {
        Row: {
          changed_at: string
          changed_by: string | null
          created_at: string
          created_by: string | null
          id: number
          location_id: number
          lot_id: number | null
          notes: string | null
          product_id: number
          quantity_after: number | null
          quantity_before: number | null
          quantity_change: number
          serial_id: number | null
          transaction_ref_id: number | null
          transaction_ref_type: string | null
          transaction_type: string
          warehouse_id: number
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: number
          location_id: number
          lot_id?: number | null
          notes?: string | null
          product_id: number
          quantity_after?: number | null
          quantity_before?: number | null
          quantity_change: number
          serial_id?: number | null
          transaction_ref_id?: number | null
          transaction_ref_type?: string | null
          transaction_type: string
          warehouse_id: number
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: number
          location_id?: number
          lot_id?: number | null
          notes?: string | null
          product_id?: number
          quantity_after?: number | null
          quantity_before?: number | null
          quantity_change?: number
          serial_id?: number | null
          transaction_ref_id?: number | null
          transaction_ref_type?: string | null
          transaction_type?: string
          warehouse_id?: number
        }
        Relationships: []
      }
      stock_summary: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: number
          is_deleted: boolean
          last_updated: string
          location_id: number
          lot_id: number | null
          product_id: number
          quantity_available: number | null
          quantity_on_hand: number
          quantity_reserved: number
          serial_id: number | null
          updated_at: string
          updated_by: string | null
          warehouse_id: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          is_deleted?: boolean
          last_updated?: string
          location_id: number
          lot_id?: number | null
          product_id: number
          quantity_available?: number | null
          quantity_on_hand?: number
          quantity_reserved?: number
          serial_id?: number | null
          updated_at?: string
          updated_by?: string | null
          warehouse_id: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          is_deleted?: boolean
          last_updated?: string
          location_id?: number
          lot_id?: number | null
          product_id?: number
          quantity_available?: number | null
          quantity_on_hand?: number
          quantity_reserved?: number
          serial_id?: number | null
          updated_at?: string
          updated_by?: string | null
          warehouse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_summary_location_id_fkey"
            columns: ["location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_summary_lot_id_fkey"
            columns: ["lot_id"]
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_summary_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_summary_serial_id_fkey"
            columns: ["serial_id"]
            referencedRelation: "serials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_summary_warehouse_id_fkey"
            columns: ["warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          }
        ]
      }
      uom_categories: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          id: number
          is_active: boolean
          is_deleted: boolean
          name: string
          notes: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          is_deleted?: boolean
          name: string
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          is_deleted?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
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
          category_id: number
          code: string
          conversion_factor: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: number
          is_active: boolean
          is_base_unit: boolean
          is_deleted: boolean
          name: string
          notes: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category_id: number
          code: string
          conversion_factor?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          is_active?: boolean
          is_base_unit?: boolean
          is_deleted?: boolean
          name: string
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category_id?: number
          code?: string
          conversion_factor?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          is_active?: boolean
          is_base_unit?: boolean
          is_deleted?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uoms_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "uom_categories"
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
      user_organizations: {
        Row: {
          created_at: string
          created_by: string | null
          granted_at: string
          granted_by: string | null
          is_default: boolean
          organization_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          granted_at?: string
          granted_by?: string | null
          is_default?: boolean
          organization_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          granted_at?: string
          granted_by?: string | null
          is_default?: boolean
          organization_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_granted_by_fkey"
            columns: ["granted_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
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
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          created_by: string | null
          role_id: number
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          created_by?: string | null
          role_id: number
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          created_by?: string | null
          role_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_warehouses: {
        Row: {
          created_at: string
          created_by: string | null
          granted_at: string
          granted_by: string | null
          user_id: string
          warehouse_id: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          granted_at?: string
          granted_by?: string | null
          user_id: string
          warehouse_id: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          granted_at?: string
          granted_by?: string | null
          user_id?: string
          warehouse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_warehouses_granted_by_fkey"
            columns: ["granted_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_warehouses_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_warehouses_warehouse_id_fkey"
            columns: ["warehouse_id"]
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          is_deleted: boolean
          last_login_at: string | null
          phone: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          full_name: string
          id: string
          is_active?: boolean
          is_deleted?: boolean
          last_login_at?: string | null
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          is_deleted?: boolean
          last_login_at?: string | null
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          branch_id: number
          code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: number
          is_active: boolean
          is_deleted: boolean
          manager_id: string | null
          name: string
          notes: string | null
          total_capacity_cbm: number | null
          total_capacity_weight_kg: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          branch_id: number
          code: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          is_active?: boolean
          is_deleted?: boolean
          manager_id?: string | null
          name: string
          notes?: string | null
          total_capacity_cbm?: number | null
          total_capacity_weight_kg?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          branch_id?: number
          code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          is_active?: boolean
          is_deleted?: boolean
          manager_id?: string | null
          name?: string
          notes?: string | null
          total_capacity_cbm?: number | null
          total_capacity_weight_kg?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
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
            foreignKeyName: "warehouses_manager_id_fkey"
            columns: ["manager_id"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      convert_uom: {
        Args: {
          p_product_id: number
          p_quantity: number
          p_from_uom_id: number
          p_to_uom_id: number
        }
        Returns: number
      }
      get_dashboard_kpis: {
        Args: {
          p_warehouse_id?: number
        }
        Returns: Json
      }
      get_issue_lots: {
        Args: {
          p_product_id: number
          p_warehouse_id: number
          p_quantity: number
          p_policy?: Database["public"]["Enums"]["issue_policy_enum"]
        }
        Returns: {
          lot_id: number
          lot_number: string
          location_id: number
          location_code: string
          available_qty: number
          suggested_qty: number
          manufacture_date: string
          expiry_date: string
          sort_priority: number
        }[]
      }
      get_user_organizations: {
        Args: {
          p_user_id: string
        }
        Returns: number[]
      }
      get_user_permissions: {
        Args: {
          p_user_id: string
        }
        Returns: string[]
      }
      get_user_warehouses: {
        Args: {
          p_user_id: string
        }
        Returns: number[]
      }
      has_permission: {
        Args: {
          p_user_id: string
          p_permission_code: string
        }
        Returns: boolean
      }
    }
    Enums: {
      adjustment_reason_enum: "DAMAGED" | "LOST" | "ERROR" | "EXPIRED" | "OTHER"
      doc_status_enum:
        | "DRAFT"
        | "CREATED"
        | "IN_PROGRESS"
        | "WAITING_APPROVAL"
        | "APPROVED"
        | "COMPLETED"
        | "CANCELLED"
      gi_type_enum: "SALE" | "RETURN" | "ADJUSTMENT" | "TRANSFER"
      gr_type_enum: "PURCHASE" | "RETURN" | "ADJUSTMENT" | "PRODUCTION"
      issue_mode_enum: "SUMMARY" | "DETAIL"
      issue_policy_enum: "FIFO" | "FEFO" | "MANUAL"
      partner_type_enum: "SUPPLIER" | "CUSTOMER" | "BOTH"
      permission_action:
        | "CREATE"
        | "READ"
        | "UPDATE"
        | "DELETE"
        | "APPROVE"
        | "CANCEL"
      serial_lot_status_enum:
        | "CREATED"
        | "IMPORTED"
        | "AVAILABLE"
        | "IN_STOCK"
        | "PARTIAL"
        | "EMPTY"
        | "USED"
        | "LOST"
        | "EXPIRED"
      status_enum: "ACTIVE" | "INACTIVE"
      tracking_type_enum: "NONE" | "LOT" | "SERIAL"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
