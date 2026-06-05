// ============================================================
// HOOK DE FIDELIDADE — Studio Mari Moraes
// Arquivo: src/app/hooks/useLoyalty.ts
// Padrão: Zustand + Supabase (igual ao useAppData.tsx existente)
// ============================================================

import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';
import {
  ClientLoyaltyProgress,
  NpsFeedback,
  LoyaltyProgram,
  NpsCategory,
  VisitResult,
} from '../types/loyalty';

// Reutiliza a mesma conexão Supabase do projeto
const SUPABASE_URL = 'https://usqitmgfqtvdxszeusyf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_u9RgR3SAeVLdQTjb7FerLQ_492VkzC1';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── PROGRAMA ATIVO: JORNADA PREMIUM ────────────────────────
export const JORNADA_PREMIUM: LoyaltyProgram = {
  id: 'prog-jornada-premium-001',
  name: 'Jornada Premium',
  type: 'COUNT_BASED',
  is_active: true,
  rules_config: {
    trigger_service: 'Lavagem Premium',
    cycle_goal: 4,
    expiration_days: 15,
    reward_service: 'Hidratação + Escova',
    reward_price: 85,
    locked_price: 65,
  },
};

// ─── HELPER: Verifica expiração por recorrência ──────────────
const applyExpirationRule = (
  progress: ClientLoyaltyProgress,
  expirationDays: number
): ClientLoyaltyProgress => {
  if (!progress.last_visit_date || progress.current_count === 0) return progress;

  const lastVisit = new Date(progress.last_visit_date);
  const today = new Date();
  const diffDays = Math.floor(
    (today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays > expirationDays) {
    return { ...progress, current_count: 0, status: 'EXPIRED' };
  }
  return progress;
};

// ─── HELPER: Calcula a categoria NPS ─────────────────────────
const calcNpsCategory = (score: number): NpsCategory => {
  if (score >= 9) return 'PROMOTER';
  if (score >= 7) return 'NEUTRAL';
  return 'DETRACTOR';
};

// ─── INTERFACE DO STORE ────────────────────────────────────
interface LoyaltyState {
  progressList: ClientLoyaltyProgress[];
  npsList: NpsFeedback[];
  isLoading: boolean;

  // Busca dados do Supabase (chamar no mount)
  fetchLoyaltyData: () => Promise<void>;

  // Retorna o progresso de um cliente com a regra de expiração aplicada
  getClientProgress: (clientId: string) => ClientLoyaltyProgress | null;

  // Registra uma visita de Lavagem Premium para o cliente
  registerLoyaltyVisit: (clientId: string) => Promise<VisitResult>;

  // Salva uma avaliação NPS
  addNpsFeedback: (
    data: Omit<NpsFeedback, 'id' | 'created_at' | 'category'>
  ) => Promise<void>;
}

// ─── STORE ZUSTAND ───────────────────────────────────────────
export const useLoyalty = create<LoyaltyState>((set, get) => ({
  progressList: [],
  npsList: [],
  isLoading: false,

  // ── fetchLoyaltyData ─────────────────────────────────────
  fetchLoyaltyData: async () => {
    set({ isLoading: true });
    try {
      const [progressRes, npsRes] = await Promise.all([
        supabase
          .from('client_loyalty_progress')
          .select('*')
          .order('last_visit_date', { ascending: false }),
        supabase
          .from('nps_feedbacks')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (progressRes.error) {
        console.error('❌ Erro em client_loyalty_progress:', progressRes.error.message);
      }
      if (npsRes.error) {
        console.error('❌ Erro em nps_feedbacks:', npsRes.error.message);
      }

      set({
        progressList: progressRes.data || [],
        npsList: npsRes.data || [],
        isLoading: false,
      });
    } catch (err) {
      console.error('💥 Erro ao buscar dados de fidelidade:', err);
      set({ isLoading: false });
    }
  },

  // ── getClientProgress ────────────────────────────────────
  getClientProgress: (clientId: string) => {
    const raw = get().progressList.find((p) => p.client_id === clientId);
    if (!raw) return null;
    return applyExpirationRule(raw, JORNADA_PREMIUM.rules_config.expiration_days);
  },

  // ── registerLoyaltyVisit ─────────────────────────────────
  registerLoyaltyVisit: async (clientId: string): Promise<VisitResult> => {
    const { progressList, fetchLoyaltyData } = get();
    const existing = progressList.find((p) => p.client_id === clientId);
    const cfg = JORNADA_PREMIUM.rules_config;

    // ── CASO 1: Primeira visita ──────────────────────────────
    if (!existing) {
      const newProgress: Omit<ClientLoyaltyProgress, 'id'> = {
        client_id: clientId,
        program_id: JORNADA_PREMIUM.id,
        current_count: 1,
        last_visit_date: new Date().toISOString(),
        status: 'ACTIVE',
      };
      const { error } = await supabase
        .from('client_loyalty_progress')
        .insert([newProgress]);
      if (error) console.error('❌ Erro ao criar progresso:', error.message);
      await fetchLoyaltyData();
      return { isReward: false, wasReset: false, newCount: 1 };
    }

    // ── Aplica regra de expiração antes de qualquer cálculo ──
    const checked = applyExpirationRule(existing, cfg.expiration_days);
    const wasReset = checked.current_count !== existing.current_count;

    // ── CASO 2: É a visita da recompensa (5ª) ────────────────
    if (checked.current_count >= cfg.cycle_goal) {
      const { error } = await supabase
        .from('client_loyalty_progress')
        .update({
          current_count: 0,
          status: 'ACTIVE',
          last_visit_date: new Date().toISOString(),
        })
        .eq('id', existing.id);
      if (error) console.error('❌ Erro ao resetar ciclo:', error.message);
      await fetchLoyaltyData();
      return { isReward: true, wasReset, newCount: 0 };
    }

    // ── CASO 3: Incremento normal ─────────────────────────────
    const newCount = checked.current_count + 1;
    const newStatus = newCount >= cfg.cycle_goal ? 'COMPLETED' : 'ACTIVE';

    const { error } = await supabase
      .from('client_loyalty_progress')
      .update({
        current_count: newCount,
        status: newStatus,
        last_visit_date: new Date().toISOString(),
      })
      .eq('id', existing.id);
    if (error) console.error('❌ Erro ao atualizar progresso:', error.message);
    await fetchLoyaltyData();
    return { isReward: false, wasReset, newCount };
  },

  // ── addNpsFeedback ───────────────────────────────────────
  addNpsFeedback: async (data) => {
    const newFeedback: Omit<NpsFeedback, 'id'> = {
      ...data,
      category: calcNpsCategory(data.score),
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('nps_feedbacks').insert([newFeedback]);
    if (error) console.error('❌ Erro ao salvar NPS:', error.message);
    await get().fetchLoyaltyData();
  },
}));
