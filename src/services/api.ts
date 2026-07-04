// src/services/api.ts

const API_BASE = 'http://localhost:8000';

function getToken(): string | null {
  return localStorage.getItem('pulse_jwt_token');
}

function getHeaders(isMultipart = false): HeadersInit {
  const headers: Record<string, string> = {};
  
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isMultipart = options.body instanceof FormData;
  const headers = getHeaders(isMultipart);
  
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorDetail = 'API Request Failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = response.statusText || `Status ${response.status}`;
    }
    throw new Error(errorDetail);
  }

  // Handle 201/204 or empty responses
  if (response.status === 204) return {} as T;
  
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

// ----------------------------------------------------
// Type Definitions
// ----------------------------------------------------

export interface User {
  id: string;
  email: string;
  display_name: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface BillItem {
  product: string;
  quantity: number;
  unit?: string;
  price: number;
  amount: number;
}

export interface BillData {
  _id?: string;
  id?: string;
  dealer_name: string;
  invoice_no: string;
  date: string;
  items: BillItem[];
  subtotal?: number;
  gst?: number;
  total: number;
  category: string;
  status?: string;
  source?: string;
  bill_image?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface OrganizationSettings {
  org_name: string;
  currency: string;
  timezone: string;
  date_format: string;
  is_onboarded?: boolean;
}

export interface ProfileSettings {
  display_name: string;
  email: string;
  locale: string;
  time_format: string;
}

export interface MonthSpendSummary {
  label: string;
  total_amount: number;
  bill_count: number;
}

export interface DashboardAnalytics {
  total_purchase_amount: number;
  total_bills: number;
  total_products: number;
  total_dealers: number;
  average_bill_amount: number;
  highest_bill_amount: number;
  lowest_bill_amount: number;
  monthly_purchase_summary: MonthSpendSummary[];
  yearly_purchase_summary: MonthSpendSummary[];
}

export interface SpendTrendItem {
  label: string; // E.g. "2026-06"
  total_amount: number;
  bill_count: number;
}

export interface DealerProfileResponse {
  dealer_name: string;                  // Mapped to: Supplier Name
  total_purchase_amount: number;         // Mapped to: Total Invoiced
  number_of_bills: number;               // Mapped to: Invoices Count
  number_of_products_purchased: number;  // Mapped to: Unique Products
  last_purchase_date: string | null;     // Mapped to: Last Purchase
  average_bill_value: number;
  most_purchased_product: string | null;
  monthly_purchase: SpendTrendItem[];
  yearly_purchase: SpendTrendItem[];
}

export interface DealerMetric {
  total_purchase: number;
  average_price: number;
  total_quantity: number;
}

export interface DealerCompareResponse {
  dealer_a: string;
  dealer_b: string;
  metrics_a: DealerMetric;
  metrics_b: DealerMetric;
  price_difference: number;
  savings_opportunity: number;
}

export interface ProductStatsItem {
  product_name: string;
  total_quantity_purchased: number;
  total_amount_spent: number;
  average_price: number;
  min_price: number;
  max_price: number;
  number_of_dealers: number;
  last_purchase_date: string | null;
  purchase_frequency: number; // Average days between purchases
}

export interface ProductRankingsResponse {
  top_most_purchased: ProductStatsItem[];
  top_highest_spending: ProductStatsItem[];
  least_purchased: ProductStatsItem[];
}

export interface ProductDetailResponse {
  product_name: string;
  category: string;
  average_price: number;
  total_quantity_purchased: number;
  number_of_dealers: number;
  overall_trend: string;
  trend_percentage: number;
}

export interface ProductComparisonResponse {
  product_name: string;
  cheapest_dealer: string;
  cheapest_price: number;
  costliest_dealer: string;
  costliest_price: number;
  average_market_price: number;
  price_difference: number;
  potential_savings: number;
  historical_prices: Array<{
    dealer_name: string;
    average_price: number;
    min_price: number;
    max_price: number;
    last_purchase_date: string;
  }>;
}

export interface CategorySpendTrend {
  category_name: string;
  total_spending: number;
  total_quantity: number;
  growth_percentage: number;
}

export interface CategorySpendTrendsResponse {
  categories: CategorySpendTrend[];
  top_category_by_spending: string;
  top_category_by_quantity: string;
}

export interface SavingsOpportunity {
  product_name: string;
  dealer_purchased: string;
  actual_price: number;
  cheapest_dealer: string;
  cheapest_price: number;
  quantity_purchased: number;
  potential_savings: number;
}

export interface SavingsListResponse {
  total_potential_savings: number;
  opportunities: SavingsOpportunity[];
}

export interface ForecastResponse {
  next_month_purchase_amount: number;
  next_month_product_quantity: Array<{ label: string; forecast_value: number }>;
  future_price_trend: Record<string, Array<{ label: string; forecast_value: number }>>;
}

export interface PriceTrendPoint {
  label: string;
  average_price: number;
  min_price: number;
  max_price: number;
}

export interface PriceTrendsResponse {
  product_name: string;
  month_wise_trend: PriceTrendPoint[];
  percentage_increase: number;
  percentage_decrease: number;
  moving_average: number;
  overall_trend: string;
}

export interface AiContextResponse {
  context_type: string;
  context_data: {
    product_name?: string;
    cheapest_dealer?: string;
    cheapest_price?: number;
    insights_summary: string;
    [key: string]: any;
  };
}

export interface ChatResponse {
  response: string;
  query_type: string;
  extracted_parameters: {
    product_name?: string;
    dealer_a?: string;
    dealer_b?: string;
  };
}

export interface BatchUploadResultItem {
  filename: string;
  success: boolean;
  bill_data?: BillData;
  detail?: string;
  validation_errors?: string;
}

export interface BatchUploadResponse {
  processed_count: number;
  results: BatchUploadResultItem[];
}

export interface InsightItem {
  product_name: string;
  value: number;
  description: string;
}

export interface ProductInsightsResponse {
  frequently_purchased: InsightItem[];
  frequently_purchased_together: any[];
  fast_growing: InsightItem[];
  slow_moving: InsightItem[];
  rising_prices: InsightItem[];
  falling_prices: InsightItem[];
}

// ----------------------------------------------------
// API Requests Implementation
// ----------------------------------------------------

export const api = {
  // --- Auth ---
  signup: (payload: { email: string; password: string; display_name: string }) =>
    request<TokenResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (formData: URLSearchParams) =>
    request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }),

  loginJson: (payload: { email: string; password: string }) =>
    request<TokenResponse>('/auth/login/json', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string; debug_token?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (payload: { token: string; new_password: string }) =>
    request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // --- Bill Management ---
  uploadBill: async (file: File): Promise<BillData> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await request<any>('/upload', {
      method: 'POST',
      body: formData,
    });
    if (res && res.bill_data) {
      return res.bill_data;
    }
    return res;
  },

  uploadBatchBills: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return request<BatchUploadResponse>('/upload/batch', {
      method: 'POST',
      body: formData,
    });
  },

  saveBill: (billData: BillData) =>
    request<{ message: string; id: string }>('/save', {
      method: 'POST',
      body: JSON.stringify(billData),
    }),

  getBills: () =>
    request<BillData[]>('/bills', {
      method: 'GET',
    }),

  getBill: (id: string) =>
    request<BillData>(`/bill/${id}`, {
      method: 'GET',
    }),

  updateBill: (id: string, updatedFields: Partial<BillData>) =>
    request<{ message: string }>(`/bill/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedFields),
    }),

  // --- Category Management ---
  getCategories: () =>
    request<Category[]>('/categories', {
      method: 'GET',
    }),

  createCategory: (name: string) =>
    request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  updateCategory: (id: string, name: string) =>
    request<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),

  deleteCategory: (id: string) =>
    request<{ message: string }>(`/categories/${id}`, {
      method: 'DELETE',
    }),

  // --- Settings ---
  getOrgSettings: () =>
    request<OrganizationSettings>('/settings/organization', {
      method: 'GET',
    }),

  updateOrgSettings: (data: OrganizationSettings) =>
    request<OrganizationSettings>('/settings/organization', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getProfileSettings: () =>
    request<ProfileSettings>('/settings/profile', {
      method: 'GET',
    }),

  updateProfileSettings: (data: ProfileSettings) =>
    request<ProfileSettings>('/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // --- Analytics Engine ---
  getDashboardAnalytics: () =>
    request<DashboardAnalytics>('/analytics/dashboard', {
      method: 'GET',
    }),

  getDealers: () =>
    request<DealerProfileResponse[]>('/analytics/dealers', {
      method: 'GET',
    }),

  compareDealers: (dealerA: string, dealerB: string) =>
    request<DealerCompareResponse>(
      `/analytics/dealers/compare?dealer_a=${encodeURIComponent(dealerA)}&dealer_b=${encodeURIComponent(dealerB)}`,
      { method: 'GET' }
    ),

  compareProducts: (productName: string) =>
    request<ProductComparisonResponse>(
      `/analytics/products/compare?product_name=${encodeURIComponent(productName)}`,
      { method: 'GET' }
    ),

  getCategorySpendingTrends: () =>
    request<CategorySpendTrendsResponse>('/analytics/products/categories', {
      method: 'GET',
    }),

  getForecast: () =>
    request<ForecastResponse>('/analytics/forecast', {
      method: 'GET',
    }),

  getSavingsOpportunities: () =>
    request<SavingsListResponse>('/analytics/savings', {
      method: 'GET',
    }),

  getAiContext: (queryType: string, options: { productName?: string; dealerA?: string; dealerB?: string } = {}) => {
    let url = `/analytics/ai-context?query_type=${encodeURIComponent(queryType)}`;
    if (options.productName) url += `&product_name=${encodeURIComponent(options.productName)}`;
    if (options.dealerA) url += `&dealer_a=${encodeURIComponent(options.dealerA)}`;
    if (options.dealerB) url += `&dealer_b=${encodeURIComponent(options.dealerB)}`;
    return request<AiContextResponse>(url, { method: 'GET' });
  },

  getProductRankings: () =>
    request<ProductRankingsResponse>('/analytics/products', {
      method: 'GET',
    }),

  getProductDetails: () =>
    request<ProductDetailResponse[]>('/analytics/products/details', {
      method: 'GET',
    }),

  getProductStats: (productName: string) =>
    request<ProductStatsItem>(`/analytics/products/${encodeURIComponent(productName)}`, {
      method: 'GET',
    }),

  getPriceTrends: (productName: string) =>
    request<PriceTrendsResponse>(`/analytics/price-trends?product_name=${encodeURIComponent(productName)}`, {
      method: 'GET',
    }),

  getInsights: () =>
    request<ProductInsightsResponse>('/analytics/insights', {
      method: 'GET',
    }),

  deleteBill: (id: string) =>
    request<{ success: boolean; message: string; deleted_products_count: number; deleted_dealers_count: number }>(`/bill/${id}`, {
      method: 'DELETE',
    }),

  deleteProduct: (name: string) =>
    request<{ success: boolean; message: string; updated_invoices_count: number; deleted_invoices_count: number; deleted_dealers_count: number }>(`/products/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    }),

  deleteSupplier: (name: string) =>
    request<{ success: boolean; message: string; deleted_invoices_count: number; deleted_products_count: number }>(`/dealers/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    }),

  chat: (message: string) =>
    request<ChatResponse>('/analytics/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
};
