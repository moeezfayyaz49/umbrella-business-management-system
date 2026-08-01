export interface CompanySettings {
  id: string;
  company_name: string;
  address: string;
  phone: string;
  email: string;
  tax_id: string;
  currency: string;
  timezone: string;
  company_logo_url?: string;
  invoice_prefix: string;
  updated_at: string;
}
