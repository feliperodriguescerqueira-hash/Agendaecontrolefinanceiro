import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';

// URL Corrigida (com o 'x' no lugar do 'z') 🎉
const SUPABASE_URL = 'https://usqitmgfqtvdxszeusyf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_u9RgR3SAeVLdQTjb7FerLQ_492VkzC1';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
  addService: (service: Service) => Promise<void>;
  addAppointment: (appointment: Appointment) => Promise<void>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  addFinance: (finance: Finance) => Promise<void>;
  deleteFinance: (id: string) => Promise<void>;
}

const initialServices: Service[] = [
  { id: '1', name: 'Corte Feminino', duration: 60, price: 80, category: 'Cabelo' },
  { id: '2', name: 'Corte Masculino', duration: 30, price: 40, category: 'Cabelo' },
  { id: '3', name: 'Coloração', duration: 120, price: 200, category: 'Cabelo' },
  { id: '4', name: 'Manicure', duration: 45, price: 35, category: 'Unhas' },
  { id: '5', name: 'Pedicure', duration: 60, price: 45, category: 'Unhas' },
  { id: '6', name: 'Design de Sobrancelhas', duration: 30, price: 30, category: 'Estética' },
  { id: '7', name: 'Limpeza de Pele', duration: 90, price: 150, category: 'Estética' },
  { id: '8', name: 'Massagem Relaxante', duration: 60, price: 120, category: 'Estética' },
];

export const useAppData = create<AppState>((set, get) => ({
  clients: [],
  services: initialServices,
  appointments: [],
  finances: [],
  isLoading: false,

  fetchData: async () => {
    set({ isLoading: true });
    const { data: clients } = await supabase.from('clients').select('*');
    const { data: apps } = await supabase.from('appointments').select('*');
    const { data: fins } = await supabase.from('finances').select('*');
    set({
      clients: clients || [],
      appointments: apps || [],
      finances: fins || [],
      isLoading: false
    });
  },

  addClient: async (client) => {
    const { error } = await supabase.from('clients').insert([client]);
    
    if (error) {
      alert("⚠️ ERRO AO SALVAR: " + error.message);
    } else {
      alert("✅ SUCESSO! Cliente salvo na Nuvem com sucesso!");
    }
    
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

  addService: async (service) => {
    set((state) => ({ services: [...state.services, service] }));
  },

  addAppointment: async (app) => {
    const { error } = await supabase.from('appointments').insert([app]);
    if (error) alert("Erro agendamento: " + error.message);

    if (app.status === 'concluido') {
      const client = get().clients.find(c => c.id === app.clientId);
      const finance = {
        id: Date.now().toString() + 'f',
        type: 'receita' as const,
        description: `${app.service} - ${client?.name || 'Cliente'}`,
        value: Number(app.price),
        date: app.date,
        category: 'Serviços'
      };
      await supabase.from('finances').insert([finance]);
    }
    await get().fetchData();
  },

  updateAppointment: async (id, updated) => {
    const current = get().appointments.find(a => a.id === id);
    if (updated.status === 'concluido' && current?.status !== 'concluido') {
      const client = get().clients.find(c => c.id === (updated.clientId || current?.clientId));
      const finance = {
        id: Date.now().toString() + 'f',
        type: 'receita' as const,
        description: `${updated.service || current?.service} - ${client?.name || 'Cliente'}`,
        value: Number(updated.price ?? current?.price),
        date: updated.date || current?.date,
        category: 'Serviços'
      };
      await supabase.from('finances').insert([finance]);
    }
    await supabase.from('appointments').update(updated).eq('id', id);
    await get().fetchData();
  },

  deleteAppointment: async (id) => {
    await supabase.from('appointments').delete().eq('id', id);
    await get().fetchData();
  },

  addFinance: async (finance) => {
    await supabase.from('finances').insert([finance]);
    await get().fetchData();
  },

  deleteFinance: async (id) => {
    await supabase.from('finances').delete().eq('id', id);
    await get().fetchData();
  },
}));