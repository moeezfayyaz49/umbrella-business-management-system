import type { CompanySettings } from '../types';
import type { SettingsFormInputs } from '../schemas';
import { supabase } from '../../../lib/supabase';

const defaultSettings: Omit<CompanySettings, 'id' | 'updated_at'> = {
  company_name: 'My Company',
  address: '123 Default St',
  phone: '000-000-0000',
  email: 'admin@example.com',
  tax_id: 'TAX-123',
  currency: 'USD',
  timezone: 'UTC',
  invoice_prefix: 'INV-',
};

export const settingsService = {
  getSettings: async (): Promise<CompanySettings> => {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      // Create a default if none exists
      const { data: newData, error: insertError } = await supabase
        .from('company_settings')
        .insert([defaultSettings])
        .select()
        .single();

      if (insertError) throw insertError;
      return newData as CompanySettings;
    }

    return data as CompanySettings;
  },

  updateSettings: async (data: SettingsFormInputs): Promise<CompanySettings> => {
    // We only have one settings row, so get its ID first
    const current = await settingsService.getSettings();

    const { data: updatedData, error } = await supabase
      .from('company_settings')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', current.id)
      .select()
      .single();

    if (error) throw error;
    return updatedData as CompanySettings;
  },

  uploadLogo: async (file: File): Promise<string> => {
    // If Supabase storage is configured, we'd use this.
    // For now, since storage bucket isn't explicitly created in our schema.sql, 
    // we'll keep the Data URI fallback so the UI still works.
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};
