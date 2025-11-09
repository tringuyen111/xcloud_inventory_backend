import { apiCall } from '../lib/api';
import { Database } from '../types/supabase';

// Define base types from Supabase schema to ensure consistency.
// These can be replaced with more specific API response types if they diverge.
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
 * Generic factory to create standard CRUD methods for a resource endpoint.
 * @param resource The name of the resource (e.g., 'organization', 'goods-receipt').
 */
const createApiMethods = <T>(resource: string) => ({
  list: (): Promise<T[]> => apiCall(`/${resource}`),
  get: (id: string): Promise<T> => apiCall(`/${resource}/${id}`),
  create: (data: Partial<T>): Promise<T> => apiCall(`/${resource}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<T>): Promise<T> => apiCall(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<{ success: boolean }> => apiCall(`/${resource}/${id}`, { method: 'DELETE' }),
});

// --- API Client Definitions ---

export const inventoryAPI = createApiMethods<OnhandItem>('inventory');
export const goodsReceiptAPI = createApiMethods<GoodsReceipt>('goods-receipt');
export const goodsIssueAPI = createApiMethods<GoodsIssue>('goods-issue');
export const goodsTransferAPI = createApiMethods<GoodsTransfer>('goods-transfer');
export const putawayAPI = createApiMethods<Putaway>('putaway');
export const goodsTypeAPI = createApiMethods<GoodsType>('goods-type');
export const goodsModelAPI = createApiMethods<GoodsModel>('goods-model');
export const uomAPI = createApiMethods<Uom>('uom');
export const uomCategoryAPI = createApiMethods<UomCategory>('uom-category'); // Assuming endpoint name from doc
export const partnerAPI = createApiMethods<Partner>('partner');
export const organizationAPI = createApiMethods<Organization>('organization');
export const branchAPI = createApiMethods<Branch>('branch');
export const warehouseAPI = createApiMethods<Warehouse>('warehouse');
export const locationAPI = createApiMethods<Location>('location');

// Dashboard API is a special case as it has a unique endpoint.
export const dashboardAPI = {
  getSummary: () => apiCall<any>('/dashboard/summary'),
};
