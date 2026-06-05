// ============================================================
// HOOK DE MENSAGENS WHATSAPP — Studio Mari Moraes
// Arquivo: src/app/hooks/useWhatsAppCRM.ts
// ============================================================

import { ClientLoyaltyProgress } from '../types/loyalty';
import { JORNADA_PREMIUM } from './useLoyalty';

interface ClientContact {
  name: string;
  phone: string; // Ex: "21999998888" ou "(21) 99999-8888"
}

// Remove qualquer caracter não-numérico e adiciona DDI 55 se necessário
const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55')) return digits;
  return '55' + digits;
};

const buildWhatsAppUrl = (phone: string, message: string): string =>
  `https://api.whatsapp.com/send?phone=${formatPhone(phone)}&text=${encodeURIComponent(message)}`;

const getExpirationLimitDate = (lastVisitDate: string): string => {
  const date = new Date(lastVisitDate);
  date.setDate(date.getDate() + JORNADA_PREMIUM.rules_config.expiration_days);
  return date.toLocaleDateString('pt-BR');
};

export const useWhatsAppCRM = () => {

  // ── Script 1: Boas-vindas à Jornada (1ª visita do ciclo) ──
  const sendBoasVindas = (client: ClientContact) => {
    const msg =
      `Olá, ${client.name}! Tudo bem? 😊\n\n` +
      `Ficamos muito felizes com a sua visita hoje no Studio da Mari Moraes. ` +
      `Você acabou de entrar na nossa *Jornada Premium*! 💕\n\n` +
      `Mantendo suas lavagens em dia a cada 15 dias, ` +
      `a sua *5ª visita* será um upgrade gratuito para nossa ` +
      `*Hidratação Completa + Escova*. ✨\n\n` +
      `Seu contador já está em *1/4*. Até a próxima semana!`;
    window.open(buildWhatsAppUrl(client.phone, msg), '_blank');
  };

  // ── Script 2: Lembrete de Recorrência (cliente há ~10 dias sem visita) ──
  const sendLembrete = (client: ClientContact, progress: ClientLoyaltyProgress) => {
    const limitDate = progress.last_visit_date
      ? getExpirationLimitDate(progress.last_visit_date)
      : '(data não disponível)';
    const msg =
      `Oi, ${client.name}! 💇‍♀️\n\n` +
      `Passando para lembrar que seu cabelo merece aquele cuidado especial. ` +
      `Seu progresso na *Jornada Premium* está em ` +
      `*${progress.current_count}/4*.\n\n` +
      `Para não perder o seu histórico e garantir o seu upgrade de ` +
      `Hidratação na 5ª visita, lembre-se de agendar sua próxima lavagem ` +
      `até o dia *${limitDate}*.\n\n` +
      `Vamos agendar? 🗓️`;
    window.open(buildWhatsAppUrl(client.phone, msg), '_blank');
  };

  // ── Script 3: Ciclo Concluído — Recompensa disponível ─────
  const sendCicloCompleto = (client: ClientContact) => {
    const cfg = JORNADA_PREMIUM.rules_config;
    const msg =
      `Parabéns, ${client.name}! 🎉\n\n` +
      `Você completou suas 4 etapas da *Jornada Premium*!\n\n` +
      `A sua próxima visita será totalmente especial: ` +
      `você fará nossa *${cfg.reward_service}* ` +
      `(R$ ${cfg.reward_price.toFixed(2)}) pagando apenas o valor fixo ` +
      `da sua lavagem de sempre *(R$ ${cfg.locked_price.toFixed(2)})*. 💕\n\n` +
      `Já garanta o seu horário na nossa agenda para desfrutar do seu mimo!`;
    window.open(buildWhatsAppUrl(client.phone, msg), '_blank');
  };

  // ── Script NPS — Detrator (nota 0-6) ─────────────────────
  const sendNpsDetractor = (client: ClientContact, score: number) => {
    const msg =
      `Olá, ${client.name}.\n\n` +
      `Vimos a sua nota *${score}* e o seu comentário sobre o seu último atendimento. ` +
      `Para a Mari Moraes, sua experiência é fundamental. ` +
      `Gostaríamos de entender melhor o ocorrido para corrigir imediatamente. ` +
      `Podemos conversar por ligação? 📞`;
    window.open(buildWhatsAppUrl(client.phone, msg), '_blank');
  };

  // ── Script NPS — Promotor (nota 9-10) ────────────────────
  const sendNpsPromoter = (client: ClientContact, score: number) => {
    const msg =
      `Que alegria, ${client.name}! 🌟\n\n` +
      `Ver sua nota *${score}* nos motiva a continuar entregando o melhor. ` +
      `Muito obrigado pelo carinho e pela confiança no Studio Mari Moraes! ❤️`;
    window.open(buildWhatsAppUrl(client.phone, msg), '_blank');
  };

  return {
    sendBoasVindas,
    sendLembrete,
    sendCicloCompleto,
    sendNpsDetractor,
    sendNpsPromoter,
  };
};
