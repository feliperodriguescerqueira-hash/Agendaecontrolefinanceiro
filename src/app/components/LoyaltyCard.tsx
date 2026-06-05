// ============================================================
// COMPONENTE: CARD DE FIDELIDADE — Studio Mari Moraes
// Arquivo: src/app/components/LoyaltyCard.tsx
// Padrão: MUI (mesmo stack do projeto)
// ============================================================

import { useState } from 'react';
import {
  Box, Typography, Button, Chip, CircularProgress,
  Alert, Collapse, LinearProgress, Tooltip, Snackbar,
} from '@mui/material';
import { Star, Zap, AlertTriangle, Gift, MessageCircle } from 'lucide-react';
import { useLoyalty, JORNADA_PREMIUM } from '../hooks/useLoyalty';
import { useWhatsAppCRM } from '../hooks/useWhatsAppCRM';
import { ClientLoyaltyProgress } from '../types/loyalty';

interface Props {
  clientId: string;
  clientName: string;
  clientPhone: string;
}

// Quantos dias desde a última visita?
const getDaysSinceVisit = (progress: ClientLoyaltyProgress | null): number | null => {
  if (!progress?.last_visit_date) return null;
  const diff = new Date().getTime() - new Date(progress.last_visit_date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export function LoyaltyCard({ clientId, clientName, clientPhone }: Props) {
  const { getClientProgress, registerLoyaltyVisit } = useLoyalty();
  const { sendBoasVindas, sendLembrete, sendCicloCompleto } = useWhatsAppCRM();
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'warning' | 'info' }>({
    open: false, msg: '', severity: 'success',
  });

  const progress = getClientProgress(clientId);
  const cfg = JORNADA_PREMIUM.rules_config;
  const count = progress?.current_count ?? 0;
  const isRewardReady = count >= cfg.cycle_goal;
  const isExpired = progress?.status === 'EXPIRED';
  const daysSince = getDaysSinceVisit(progress);
  const isAlertZone = daysSince !== null && daysSince >= 10 && daysSince <= cfg.expiration_days;
  const daysToExpire = daysSince !== null ? cfg.expiration_days - daysSince : null;

  // Percentual para a barra de progresso (0 a 100)
  const progressPct = Math.round((count / cfg.cycle_goal) * 100);

  const handleRegisterVisit = async () => {
    setLoading(true);
    try {
      const result = await registerLoyaltyVisit(clientId);

      if (result.wasReset) {
        setSnack({
          open: true,
          msg: '⚠️ Contador zerado por inatividade. Novo ciclo iniciado com esta visita!',
          severity: 'warning',
        });
      } else if (result.isReward) {
        setSnack({
          open: true,
          msg: `🎁 RECOMPENSA ATIVADA! Cobrar R$ ${cfg.locked_price.toFixed(2)} pelo serviço de ${cfg.reward_service}. Ciclo zerado para novo início!`,
          severity: 'success',
        });
      } else {
        setSnack({
          open: true,
          msg: `✅ Visita registrada! Contador agora em ${result.newCount}/${cfg.cycle_goal}.`,
          severity: 'info',
        });
        // Envia boas-vindas automático na 1ª visita
        if (result.newCount === 1 && clientPhone) {
          sendBoasVindas({ name: clientName, phone: clientPhone });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Cor do card baseada no estado
  const cardBorderColor = isRewardReady
    ? '#e91e63'
    : isAlertZone
    ? '#ff9800'
    : isExpired
    ? '#ef5350'
    : '#f0e6f0';

  return (
    <Box
      sx={{
        borderRadius: 3,
        border: `2px solid ${cardBorderColor}`,
        bgcolor: 'background.paper',
        p: 3,
        mt: 3,
        boxShadow: isRewardReady ? '0 4px 20px rgba(233,30,99,0.18)' : '0 2px 10px rgba(0,0,0,0.06)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* ── CABEÇALHO ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Star size={20} color="#e91e63" fill="#e91e63" />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1 }}>
              Jornada Premium
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Lavagem Premium → {cfg.reward_service} grátis
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {isExpired && !isRewardReady && (
            <Chip label="Expirado" size="small" color="error" variant="outlined" />
          )}
          {isRewardReady && (
            <Chip
              icon={<Gift size={14} />}
              label="Recompensa!"
              size="small"
              sx={{ bgcolor: '#fce4ec', color: '#c2185b', fontWeight: 700, border: '1px solid #e91e63' }}
            />
          )}
          {isAlertZone && !isRewardReady && (
            <Chip
              icon={<AlertTriangle size={14} />}
              label={`Expira em ${daysToExpire}d`}
              size="small"
              sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 600 }}
            />
          )}
        </Box>
      </Box>

      {/* ── BARRA DE PROGRESSO VISUAL ── */}
      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">Progresso do ciclo</Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: isRewardReady ? '#e91e63' : 'text.primary' }}>
            {count}/{cfg.cycle_goal} visitas
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progressPct}
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: '#f5e6f0',
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
              bgcolor: isRewardReady ? '#e91e63' : '#f48fb1',
            },
          }}
        />
      </Box>

      {/* ── ÍCONES DE ETAPAS ── */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, mt: 1 }}>
        {Array.from({ length: cfg.cycle_goal }).map((_, i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              bgcolor: i < count ? '#e91e63' : '#fce4ec',
              transition: 'background 0.4s ease',
            }}
          />
        ))}
      </Box>

      {/* ── MENSAGEM CONTEXTUAL ── */}
      <Collapse in={isRewardReady}>
        <Alert severity="success" icon={<Gift size={18} />} sx={{ mb: 2, borderRadius: 2, bgcolor: '#fce4ec', color: '#880e4f' }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            🎉 Próxima visita: {cfg.reward_service} por apenas R$ {cfg.locked_price.toFixed(2)}!
          </Typography>
          <Typography variant="caption">
            (Valor de tabela: R$ {cfg.reward_price.toFixed(2)} — desconto aplicado automaticamente)
          </Typography>
        </Alert>
      </Collapse>

      <Collapse in={isAlertZone && !isRewardReady}>
        <Alert severity="warning" icon={<AlertTriangle size={18} />} sx={{ mb: 2, borderRadius: 2 }}>
          <Typography variant="body2">
            {daysSince} dias sem visita — risco de perder o progresso em {daysToExpire} dia(s)!
          </Typography>
        </Alert>
      </Collapse>

      {/* ── AÇÕES ── */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1 }}>
        {/* Botão principal */}
        <Button
          variant="contained"
          onClick={handleRegisterVisit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Zap size={16} />}
          sx={{
            flex: 1,
            borderRadius: 2,
            fontWeight: 700,
            bgcolor: isRewardReady ? '#e91e63' : 'primary.main',
            '&:hover': { bgcolor: isRewardReady ? '#c2185b' : 'primary.dark' },
          }}
        >
          {isRewardReady ? '✨ Aplicar Recompensa (R$ 65,00)' : '+ Registrar Lavagem Premium'}
        </Button>

        {/* Botão WhatsApp — contexto 1: lembrete se em zona de alerta */}
        {isAlertZone && progress && clientPhone && (
          <Tooltip title="Enviar lembrete de agendamento">
            <Button
              variant="outlined"
              size="small"
              startIcon={<MessageCircle size={15} />}
              onClick={() => sendLembrete({ name: clientName, phone: clientPhone }, progress)}
              sx={{ borderRadius: 2, color: '#128C7E', borderColor: '#128C7E', '&:hover': { bgcolor: '#e8f5e9' } }}
            >
              Lembrete
            </Button>
          </Tooltip>
        )}

        {/* Botão WhatsApp — contexto 2: avisar que a recompensa está pronta */}
        {isRewardReady && clientPhone && (
          <Tooltip title="Avisar cliente sobre a recompensa via WhatsApp">
            <Button
              variant="outlined"
              size="small"
              startIcon={<MessageCircle size={15} />}
              onClick={() => sendCicloCompleto({ name: clientName, phone: clientPhone })}
              sx={{ borderRadius: 2, color: '#25D366', borderColor: '#25D366', '&:hover': { bgcolor: '#e8f5e9' } }}
            >
              Avisar WhatsApp
            </Button>
          </Tooltip>
        )}
      </Box>

      {/* ── SNACKBAR DE FEEDBACK ── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={7000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack({ ...snack, open: false })}
          severity={snack.severity}
          sx={{ borderRadius: 2, maxWidth: 480 }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
