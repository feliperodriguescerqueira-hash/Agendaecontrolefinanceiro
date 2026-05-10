import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';

// Configurações de Conexão
const SUPABASE_URL = 'https://usqitmgfqtvdxszeusyf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_u9RgR3SAeVLdQTjb7FerLQ_492VkzC1';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Interfaces de Dados
export interface Client { id: string; name: string; phone: string; email: string; notes?: string; }
export interface Service { id: string; name: string; duration: number; price: number; category: string; }
export interface Appointment { id: string; clientId: string; service: string; date: string; time: string; price: number; status: 'agendado' | 'concluido' | 'cancelado' | 'reagendado'; notes?: string; }
export interface Finance { id: string; type: 'receita' | 'despesa'; description: string; value: number; date: string; category: string; }

interface AppState {
  clients: Client[];
  services: Service[];
  appointments: Appointment[];
  finances: Finance[];
  isLoading: boolean;
  fetchData: () => Promise<void>;
  addClient: (client: Client) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addMultipleClients: (clients: Client[]) => Promise<void>;
  deleteMultipleClients: (ids: string[]) => Promise<void>;
  addService: (service: Service) => Promise<void>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addAppointment: (appointment: Appointment) => Promise<void>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  addFinance: (finance: Finance) => Promise<void>;
  deleteFinance: (id: string) => Promise<void>;
}

export const useAppData = create<AppState>((set, get) => ({
  clients: [],
  services: [],
  appointments: [],
  finances: [],
  isLoading: false,

  fetchData: async () => {
    set({ isLoading: true });
    console.log("🔄 Iniciando busca de dados no Supabase...");

    try {
      // Busca todas as tabelas em paralelo para maior performance
      const [clientsRes, servicesRes, appsRes, finsRes] = await Promise.all([
        supabase.from('clients').select('*').order('name', { ascending: true }),
        supabase.from('services').select('*').order('name', { ascending: true }),
        supabase.from('appointments').select('*').order('date', { ascending: false }),
        supabase.from('finances').select('*').order('date', { ascending: false })
      ]);

      // Verificação de erros específica para cada tabela no console
      if (clientsRes.error) console.error("❌ Erro na tabela Clients:", clientsRes.error.message);
      if (servicesRes.error) console.error("❌ Erro na tabela Services:", servicesRes.error.message);
      if (appsRes.error) console.error("❌ Erro na tabela Appointments:", appsRes.error.message);
      if (finsRes.error) console.error("❌ Erro na tabela Finances:", finsRes.error.message);

      set({
        clients: clientsRes.data || [],
        services: servicesRes.data || [],
        appointments: appsRes.data || [],
        finances: finsRes.data || [],
        isLoading: false
      });
      
      console.log("✅ Sincronização concluída com sucesso!");
    } catch (err) {
      console.error("💥 Erro crítico na conexão:", err);
      set({ isLoading: false });
    }
  },

  // --- FUNÇÕES DE CLIENTES ---
  addClient: async (client) => {
    await supabase.from('clients').insert([client]);
    await get().fetchData();
  },

  addMultipleClients: async (clientsArray) => {
    await supabase.from('clients').insert(clientsArray);
    await get().fetchData();
  },

  updateClient: async (id, updated) => {
    await supabase.from('clients').update(updated).eq('id', id);
    await get().fetchData();
  },

  deleteClient: async (id) => {
    await supabase.from('clients').delete().eq('id', id);
    await get().fetchData();
  },

  deleteMultipleClients: async (ids) => {
    await supabase.from('clients').delete().in('id', ids);
    await get().fetchData();
  },

  // --- FUNÇÕES DE SERVIÇOS ---
  addService: async (service) => {
    const { error } = await supabase.from('services').insert([service]);
    if (error) alert("Erro ao salvar serviço: " + error.message);
    await get().fetchData();
  },

  updateService: async (id, updated) => {
    const { error } = await supabase.from('services').update(updated).eq('id', id);
    if (error) alert("Erro ao atualizar serviço: " + error.message);
    await get().fetchData();
  },

  deleteService: async (id) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) alert("Erro ao deletar serviço: " + error.message);
    await get().fetchData();
  },

  // --- FUNÇÕES DE AGENDAMENTOS ---
  addAppointment: async (app) => {
    await supabase.from('appointments').insert([app]);
    await get().fetchData();
  },

  updateAppointment: async (id, updated) => {
    await supabase.from('appointments').update(updated).eq('id', id);
    await get().fetchData();
  },

  deleteAppointment: async (id) => {
    await supabase.from('appointments').delete().eq('id', id);
    await get().fetchData();
  },

  // --- FUNÇÕES DE FINANCEIRO ---
  addFinance: async (finance) => {
    await supabase.from('finances').insert([finance]);
    await get().fetchData();
  },

  deleteFinance: async (id) => {
    await supabase.from('finances').delete().eq('id', id);
    await get().fetchData();
  },
}));