import { SupabaseClient } from '@supabase/supabase-js';
import { masterDataClient, transactionsClient, inventoryClient, supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

// Define base types from Supabase schema
type Organization = Database['public']['Tables']['organizations']['Row'];
type Branch = Database['public']['Tables']['branches']['Row'];
type Warehouse = Database['public']['Tables']['warehouses']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];
type Partner = Database['public']['Tables']['partners']['Row'];
type UomCategory = Database['public']['Tables']['uom_categories']['Row'];
type Uom = Database['public']['Tables']['uoms']['Row'];
type ProductType = Database['public']['Tables']['product_types']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type StockSummaryItem = Database['public']['Tables']['stock_summary']['Row'];
type GoodsReceipt = Database['public']['Tables']['goods_receipts']['Row'];
type GoodsIssue = Database['public']['Tables']['goods_issues']['Row'];
type GoodsTransfer = Database['public']['Tables']['goods_transfers']['Row'];
type InventoryCount = Database['public']['Tables']['inventory_counts']['Row'];
type Putaway = Database['public']['Tables']['putaways']['Row'];

/**
 * A generic factory to create standard CRUD methods for a Supabase table.
 * @param client The schema-specific Supabase client.
 * @param tableName The name of the table within the schema.
 */
const createApiMethods = <T extends { id: number | string }>(client: SupabaseClient, tableName: string) => {
    const handleError = (error: any, context: string) => {
        console.error(`Supabase error in ${context} on table ${tableName}:`, error);
        throw new Error(error.message || `An unknown error occurred in ${context}.`);
    };

    return {
        list: async (): Promise<T[]> => {
            const { data, error } = await client.from(tableName).select('*');
            if (error) handleError(error, 'list');
            return (data as T[]) || [];
        },
        get: async (id: string | number): Promise<T> => {
            const { data, error } = await client.from(tableName).select('*').eq('id', id).single();
            if (error) handleError(error, 'get');
            return data as T;
        },
        create: async (item: Partial<T>): Promise<T> => {
            const { data, error } = await client.from(tableName).insert(item as any).select().single();
            if (error) handleError(error, 'create');
            return data as T;
        },
        update: async (id: string | number, item: Partial<T>): Promise<T> => {
            const { data, error } = await client.from(tableName).update(item as any).eq('id', id).select().single();
            if (error) handleError(error, 'update');
            return data as T;
        },
        delete: async (id: string | number): Promise<{ success: boolean }> => {
            const { error } = await client.from(tableName).delete().eq('id', id);
            if (error) handleError(error, 'delete');
            return { success: true };
        },
    };
};

// --- API Client Definitions using the new factory ---

// Inventory Schema
export const inventoryAPI = createApiMethods<StockSummaryItem>(inventoryClient, 'stock_summary');

// Transactions Schema
export const goodsReceiptAPI = createApiMethods<GoodsReceipt>(transactionsClient, 'goods_receipts');
export const goodsIssueAPI = createApiMethods<GoodsIssue>(transactionsClient, 'goods_issues');
export const goodsTransferAPI = createApiMethods<GoodsTransfer>(transactionsClient, 'goods_transfers');
export const inventoryCountAPI = createApiMethods<InventoryCount>(transactionsClient, 'inventory_counts');
export const putawayAPI = createApiMethods<Putaway>(transactionsClient, 'putaways');

// Master Data (public schema)
// FIX: Renamed exports to match component imports (e.g., productTypeAPI -> goodsTypeAPI).
export const goodsTypeAPI = createApiMethods<ProductType>(masterDataClient, 'product_types');
export const goodsModelAPI = createApiMethods<Product>(masterDataClient, 'products');
export const uomAPI = createApiMethods<Uom>(masterDataClient, 'uoms');
export const uomCategoryAPI = createApiMethods<UomCategory>(masterDataClient, 'uom_categories');
export const partnerAPI = createApiMethods<Partner>(masterDataClient, 'partners');
export const organizationAPI = createApiMethods<Organization>(masterDataClient, 'organizations');
export const branchAPI = createApiMethods<Branch>(masterDataClient, 'branches');
export const warehouseAPI = createApiMethods<Warehouse>(masterDataClient, 'warehouses');
export const locationAPI = createApiMethods<Location>(masterDataClient, 'locations');