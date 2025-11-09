

const API_BASE_URL = 'https://zebldzhybnmhttcsgdat.supabase.co/functions/v1/make-server-09bd407a';
// This is a public key, safe to expose in the frontend.
const PUBLIC_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYmxkemh5Ym5taHR0Y3NnZGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1ODg5NzQsImV4cCI6MjA3ODE2NDk3NH0.HQVvmC3M_mVA31xkrMxax5YgFM7Rju_5Zlm4XOZA3SE';

interface ApiCallOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

/**
 * Generic API call handler
 * @param endpoint - The API endpoint to call (e.g., '/inventory')
 * @param options - Request options (method, body, headers)
 * @returns The JSON response from the API
 */
export async function apiCall<T>(endpoint: string, options: ApiCallOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PUBLIC_ANON_KEY}`,
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// --- API Helper Objects ---

const createApiMethods = <T>(resource: string) => ({
  list: (): Promise<T[]> => apiCall<T[]>(`/${resource}`),
  get: (id: string): Promise<T> => apiCall<T>(`/${resource}/${id}`),
  create: (data: Partial<T>): Promise<T> => apiCall<T>(`/${resource}`, { method: 'POST', body: data }),
  update: (id: string, data: Partial<T>): Promise<T> => apiCall<T>(`/${resource}/${id}`, { method: 'PUT', body: data }),
  delete: (id: string): Promise<{ success: boolean }> => apiCall<{ success: boolean }>(`/${resource}/${id}`, { method: 'DELETE' }),
});

// Dashboard API (special case)
export const dashboardAPI = {
  getSummary: () => apiCall<any>('/dashboard/summary'),
};

// Resource-specific APIs
export const inventoryAPI = createApiMethods('inventory');
export const goodsReceiptAPI = createApiMethods('goods-receipt');
export const goodsIssueAPI = createApiMethods('goods-issue');
export const goodsTransferAPI = createApiMethods('goods-transfer');
export const putawayAPI = createApiMethods('putaway');
export const goodsTypeAPI = createApiMethods('goods-type');
export const goodsModelAPI = createApiMethods('goods-model');
export const uomAPI = createApiMethods('uom');
export const uomCategoryAPI = createApiMethods('uom_category');
export const partnerAPI = createApiMethods('partner');
export const organizationAPI = createApiMethods('organization');
export const branchAPI = createApiMethods('branch');
export const warehouseAPI = createApiMethods('warehouse');
export const locationAPI = createApiMethods('location');