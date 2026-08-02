import type { Client, ClientLedgerEntry } from '../types';
import type { ClientFormInputs } from '../schemas';
import { supabase } from '../../../lib/supabase';

export const clientService = {
  getClients: async (searchQuery?: string): Promise<Client[]> => {
    let query = supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Client[];
  },

  getClient: async (id: string): Promise<Client> => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Client;
  },

  createClient: async (clientData: ClientFormInputs): Promise<Client> => {
    const { data, error } = await supabase
      .from('clients')
      .insert([clientData])
      .select()
      .single();

    if (error) throw error;
    return data as Client;
  },

  updateClient: async (id: string, clientData: ClientFormInputs): Promise<Client> => {
    const { data, error } = await supabase
      .from('clients')
      .update({
        ...clientData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Client;
  },

  deleteClient: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  getClientLedger: async (clientId: string): Promise<ClientLedgerEntry[]> => {
    // 1. Fetch the client to get the opening balance
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('opening_balance')
      .eq('id', clientId)
      .single();

    if (clientError) throw clientError;

    // 2. Fetch the ledger entries for this client
    const { data: entries, error: entriesError } = await supabase
      .from('client_ledger_entries')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });

    if (entriesError) throw entriesError;

    // 3. Compute running balance on the fly
    let runningBalance = Number(client.opening_balance || 0);
    const computedEntries = (entries || []).map(entry => {
      runningBalance = runningBalance + Number(entry.debit || 0) - Number(entry.credit || 0);
      return {
        ...entry,
        running_balance: runningBalance
      } as ClientLedgerEntry;
    });

    return computedEntries;
  },

  createLedgerEntry: async (entryData: Partial<ClientLedgerEntry>): Promise<ClientLedgerEntry> => {
    const { data, error } = await supabase
      .from('client_ledger_entries')
      .insert([entryData])
      .select()
      .single();

    if (error) throw error;
    return data as ClientLedgerEntry;
  },

  updateLedgerEntry: async (id: string, entryData: Partial<ClientLedgerEntry>): Promise<ClientLedgerEntry> => {
    const { data, error } = await supabase
      .from('client_ledger_entries')
      .update(entryData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ClientLedgerEntry;
  },

  deleteLedgerEntry: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('client_ledger_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
