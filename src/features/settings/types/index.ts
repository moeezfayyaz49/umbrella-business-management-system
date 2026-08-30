export interface CompanySettings {
  id: string;
  company_name: string;
  address: string;
  phone: string;
  additional_phones?: string[];
  email: string;
  tax_id: string;
  currency: string;
  timezone: string;
  company_logo_url?: string;
  invoice_prefix: string;
  updated_at: string;
}

/** Primary phone plus any additional numbers, joined for display. */
export function formatCompanyPhones(
  settings?: Pick<CompanySettings, 'phone' | 'additional_phones'> | null,
  fallback = ''
): string {
  const phones = [
    settings?.phone,
    ...(settings?.additional_phones ?? []),
  ].map((p) => p?.trim()).filter(Boolean) as string[];

  return phones.length > 0 ? phones.join(' • ') : fallback;
}
