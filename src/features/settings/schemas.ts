import { z } from 'zod';

export const settingsSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  additional_phones: z.array(z.string()),
  email: z.string().email('Invalid email address').or(z.literal('')),
  tax_id: z.string().optional(),
  currency: z.string().min(1, 'Currency is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  company_logo_url: z.string().optional(),
  invoice_prefix: z.string().min(1, 'Invoice prefix is required'),
});

export type SettingsFormInputs = z.infer<typeof settingsSchema>;
