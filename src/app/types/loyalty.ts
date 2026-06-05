// ============================================================
// TIPOS DO MÓDULO DE FIDELIDADE — Studio Mari Moraes
// Arquivo: src/app/types/loyalty.ts
// ============================================================

export type LoyaltyStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
export type NpsCategory = 'PROMOTER' | 'NEUTRAL' | 'DETRACTOR';

export interface LoyaltyProgram {
  id: string;
  name: string;
  type: 'COUNT_BASED' | 'POINTS' | 'CASHBACK' | 'SUBSCRIPTION';
  rules_config: {
    trigger_service: string;   // "Lavagem Premium"
    cycle_goal: number;        // 4 visitas
    expiration_days: number;   // 15 dias
    reward_service: string;    // "Hidratação + Escova"
    reward_price: number;      // R$ 85,00 (valor de tabela)
    locked_price: number;      // R$ 65,00 (valor cobrado)
  };
  is_active: boolean;
}

export interface ClientLoyaltyProgress {
  id: string;
  client_id: string;
  program_id: string;
  current_count: number;          // 0 a 4
  last_visit_date: string | null; // ISO string
  status: LoyaltyStatus;
}

export interface NpsFeedback {
  id: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  score: number;        // 0 a 10
  comment: string;
  category: NpsCategory;
  created_at: string;   // ISO string
}

// Resultado retornado ao registrar uma visita
export interface VisitResult {
  isReward: boolean;    // true se esta é a 5ª visita (recompensa)
  wasReset: boolean;    // true se o contador foi zerado por expiração
  newCount: number;     // valor atual do contador após o registro
}
