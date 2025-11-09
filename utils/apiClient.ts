import { SupabaseClient } from '@supabase/supabase-js';
import { masterDataClient, transactionsClient, inventoryClient } from '../lib/supabase';
import { Database } from '../types/supabase';

// Define base types from Supabase schema
type Organization = Database['master']['Tables']['organizations']['Row'];
type Branch = Database['master']['Tables']['branches']['Row'];
type Warehouse = Database['master']['Tables']['warehouses']['Row'];
type Location = Database['master']['Tables']['locations']['Row'];
type Partner = Database['master']['Tables']['partners']['Row'];
type UomCategory = Database['master']['Tables']['uom_categories']['Row'];
type Uom = Database['master']['Tables']['uoms']['Row'];
type GoodsType = Database['master']['Tables']['goods_types']['Row'];
type GoodsModel = Database['master']['Tables']['goods_models']['Row'];
type OnhandItem = Database['inventory']['Tables']['onhand']['Row'];
type GoodsReceipt = Database['transactions']['Tables']['gr_header']['Row'];
type GoodsIssue = Database['transactions']['Tables']['gi_header']['Row'];
type GoodsTransfer = Database['transactions']['Tables']['gt_header']['Row'];
type Putaway = Database['transactions']['Tables']['putaway_header']['Row'];

/**
 * A generic factory to create standard CRUD methods for a Supabase table.
 * @param client The schema-specific Supabase client.
 * @param tableName The name of the table within the schema.
 */
// FIX: Changed client type from SupabaseClient to any.
// The passed clients (masterDataClient, etc.) are of type PostgrestClient,
// which is not assignable to SupabaseClient. Using `any` accepts all schema-specific clients.
const createApiMethods = <T extends { id: string }>(client: any, tableName: string) => {
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
        get: async (id: string): Promise<T> => {
            const { data, error } = await client.from(tableName).select('*').eq('id', id).single();
            if (error) handleError(error, 'get');
            return data as T;
        },
        create: async (item: Partial<T>): Promise<T> => {
            const { data, error } = await client.from(tableName).insert(item as any).select().single();
            if (error) handleError(error, 'create');
            return data as T;
        },
        update: async (id: string, item: Partial<T>): Promise<T> => {
            const { data, error } = await client.from(tableName).update(item as any).eq('id', id).select().single();
            if (error) handleError(error, 'update');
            return data as T;
        },
        delete: async (id: string): Promise<{ success: boolean }> => {
            const { error } = await client.from(tableName).delete().eq('id', id);
            if (error) handleError(error, 'delete');
            return { success: true };
        },
    };
};

// --- API Client Definitions using the new factory ---

// Inventory Schema
export const inventoryAPI = createApiMethods<OnhandItem>(inventoryClient, 'onhand');

// Transactions Schema
export const goodsReceiptAPI = createApiMethods<GoodsReceipt>(transactionsClient, 'gr_header');
export const goodsIssueAPI = createApiMethods<GoodsIssue>(transactionsClient, 'gi_header');
export const goodsTransferAPI = createApiMethods<GoodsTransfer>(transactionsClient, 'gt_header');
export const putawayAPI = createApiMethods<Putaway>(transactionsClient, 'putaway_header');

// Master Data (master schema)
export const goodsTypeAPI = createApiMethods<GoodsType>(masterDataClient, 'goods_types');
export const goodsModelAPI = createApiMethods<GoodsModel>(masterDataClient, 'goods_models');
export const uomAPI = createApiMethods<Uom>(masterDataClient, 'uoms');
export const uomCategoryAPI = createApiMethods<UomCategory>(masterDataClient, 'uom_categories');
export const partnerAPI = createApiMethods<Partner>(masterDataClient, 'partners');
export const organizationAPI = createApiMethods<Organization>(masterDataClient, 'organizations');
export const branchAPI = createApiMethods<Branch>(masterDataClient, 'branches');
export const warehouseAPI = createApiMethods<Warehouse>(masterDataClient, 'warehouses');
export const locationAPI = createApiMethods<Location>(masterDataClient, 'locations');