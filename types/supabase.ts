// types/supabase.ts

/**
 * This file contains TypeScript interfaces that represent the shape of data
 * in the Supabase database tables, based on the schema analysis.
 * Centralizing them here ensures consistency and type safety across the app.
 */

export interface Organization {
  id: number;
  code: string;
  name: string;
  tax_id?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

export interface Branch {
  id: number;
  org_id: number;
  code: string;
  name: string;
  address?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

export interface Warehouse {
  id: number;
  branch_id: number;
  code: string;
  name: string;
  warehouse_type?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export interface Location {
  id: number;
  warehouse_id: number;
  code: string;
  aisle?: string | null;
  rack?: string | null;
  shelf?: string | null;
  bin?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export interface UomCategory {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

export interface Uom {
  id: number;
  category_id: number;
  code: string;
  name: string;
  is_base: boolean;
  ratio_to_base: number;
  created_at?: string;
  updated_at?: string;
};

export interface Partner {
  id: number;
  org_id: number;
  code: string;
  name: string;
  partner_type: 'SUPPLIER' | 'CUSTOMER' | 'CARRIER' | 'OTHER';
  tax_id?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export interface GoodsType {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface GoodsModel {
  id: number;
  goods_type_id: number;
  code: string;
  name: string;
  description?: string | null;
  specifications?: Record<string, any> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}