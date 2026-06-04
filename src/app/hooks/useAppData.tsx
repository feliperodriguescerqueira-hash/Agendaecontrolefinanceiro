import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';

// Configurações de Conexão
const SUPABASE_URL = 'https://usqitmgfqtvdxszeusyf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_u9RgR3SAeVLdQTjb7FerLQ_492VkzC1';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Interfaces de Dados
export interface Client { id: string; name: string; phone: string; email: string; notes?: string; }
export interface Service { id: string; name: string; duration: number; price: number; category: string; }
export interface Appointment { 
  id: string; 
  clientId: string; 
  service: string; 
  services?: string[]; // Frontend: Array para gerenciar múltiplos serviços no formulário
  date: string; 
  time: string; 
  price: number; 
  status: 'agendado' | 'concluido' | 'cancelado' | 'reagendado'; 
  notes?: string; 
}
export interface Finance { id: string; type: 'receita' | 'despesa'; description: string; value: number; date: string; category: string; }

// NOVA INTERFACE: Ficha de Anamnese (Modelo Jeane Braz)
export interface Anamnesis {
  id?: string;
  client_id: string;
  data_atendimento: string;
  peso_atual?: number;
  peso_max?: number;
  total_perdido?: number;
  altura?: number;
  imc?: number;
  modalidade_emagrecimento: string[];
  tempo_glp1?: string;
  ativo_glp1: boolean;
  dose_glp1?: string;
  endocrinologista?: string;
  condicoes_saude: string[];
  medicamentos_continuos?: string;
  suplementacao: string[];
  tipo_pele?: string;
  queixas_dermatologicas: string[];
  alteracoes_pos_emagrecimento?: string;
  procedimentos_anteriores: string[];
  cosmeticos_atuais?: string;
  ingestao_agua?: string;
  horas_sono?: string;
  atividade_fisica?: string;
  qualidade_alimentar?: string;
  objetivos: string[];
  expectativa?: string;
  observacoes_esteticista?: string;
  assinatura_paciente?: string;
  assinatura_profissional?: string;
  termo_aceito?: boolean;
}

interface AppState {
  clients: Client[];
  services: Service[];
  appointments: Appointment[];
  finances: Finance[];
  anamnesis: Anamnesis[];
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
  saveAnamnesis: (data: Anamnesis) => Promise<void>;
}

export const useAppData = create<AppState>((set, get) => ({
  clients: [],
  services: [],
  appointments: [],
  finances: [],
  anamnesis: [],
  isLoading: false,

  fetchData: async () => {
    set({ isLoading: true });
    console.log("🔄 Iniciando busca de dados no Supabase...");

    try {
      const [clientsRes, servicesRes, appsRes, finsRes, anamnesisRes] = await Promise.all([
        supabase.from('clients').select('*').order('name', { ascending: true }),
        supabase.from('services').select('*').order('name', { ascending: true }),
        supabase.from('appointments').select('*').order('date', { ascending: false }),
        supabase.from('finances').select('*').order('date', { ascending: false }),
        supabase.from('anamnesis').select('*').order('data_atendimento', { ascending: false })
      ]);

      if (clientsRes.error) console.error("❌ Erro na tabela Clients:", clientsRes.error.message);
      if (servicesRes.error) console.error("❌ Erro na tabela Services:", servicesRes.error.message);
      if (appsRes.error) console.error("❌ Erro na tabela Appointments:", appsRes.error.message);
      if (finsRes.error) console.error("❌ Erro na tabela Finances:", finsRes.error.message);
      if (anamnesisRes.error) console.error("❌ Erro na tabela Anamnesis:", anamnesisRes.error.message);

      set({
        clients: clientsRes.data || [],
        services: servicesRes.data || [],
        appointments: appsRes.data || [],
        finances: finsRes.data || [],
        anamnesis: anamnesisRes.data || [],
        isLoading: false
      });
      
      console.log("✅ Sincronização concluída com sucesso!");
    } catch (err) {
      console.error("💥 Erro crítico na conexão:", err);
      set({ isLoading: false });
    }
  },

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

  // 👇 INTERCEPTORES ADICIONADOS AQUI 👇
  addAppointment: async (app) => {
    // Separa a propriedade "services" (array) do resto do objeto que vai para o banco
    const { services, ...dbApp } = app;
    await supabase.from('appointments').insert([dbApp]);
    await get().fetchData();
  },

  updateAppointment: async (id, updated) => {
    // Separa a propriedade "services" (array) do resto do objeto que vai para o banco
    const { services, ...dbApp } = updated;
    await supabase.from('appointments').update(dbApp).eq('id', id);
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

  saveAnamnesis: async (data) => {
    const { error } = await supabase.from('anamnesis').upsert([data]);
    if (error) {
      alert("Erro ao salvar Ficha de Anamnese: " + error.message);
      console.error(error);
    } else {
      alert("✅ Ficha salva com sucesso!");
    }
    await get().fetchData();
  },
}));