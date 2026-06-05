// ============================================================
// COMPONENTE: PAINEL NPS — Studio Mari Moraes
// Arquivo: src/app/components/NpsPanel.tsx
// Padrão: MUI (mesmo stack do projeto)
// ============================================================

import { useState } from 'react';
import {
  Box, Typography, Button, TextField, Card, CardContent,
  Chip, LinearProgress, Divider, Tooltip, CircularProgress,
  Alert,
} from '@mui/material';
import { MessageCircle, Star, TrendingUp, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useLoyalty } from '../hooks/useLoyalty';
import { useWhatsAppCRM } from '../hooks/useWhatsAppCRM';
import { NpsFeedback } from '../types/loyalty';

interface Props {
  clientId: string;
  clientName: string;
  clientPhone: string;
}

// ── Cor por nota ──────────────────────────────────────────────
const getScoreColor = (score: number): string => {
  if (score >= 9) return '#22c55e';
  if (score >= 7) return '#f59e0b';
  return '#ef4444';
};

const getScoreBgColor = (score: number): string => {
  if (score >= 9) return '#f0fdf4';
  if (score >= 7) return '#fffbeb';
  return '#fef2f2';
};

const getCategoryLabel = (score: number): string => {
  if (score >= 9) return 'Promotora';
  if (score >= 7) return 'Neutra';
  return 'Detratora';
};

export function NpsPanel({ clientId, clientName, clientPhone }: Props) {
  const { npsList, addNpsFeedback, isLoading } = useLoyalty();
  const { sendNpsDetractor, sendNpsPromoter } = useWhatsAppCRM();

  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Feedbacks apenas desta cliente
  const clientFeedbacks = npsList
    .filter((n) => n.client_id === clientId)
    .slice()
    .reverse();

  // ── Cálculo NPS geral (todos os clientes) ────────────────
  const total = npsList.length;
  const promoters = npsList.filter((n) => n.category === 'PROMOTER').length;
  const neutrals = npsList.filter((n) => n.category === 'NEUTRAL').length;
  const detractors = npsList.filter((n) => n.category === 'DETRACTOR').length;
  const npsScore = total > 0
    ? Math.round(((promoters - detractors) / total) * 100)
    : null;

  const npsScoreColor =
    npsScore === null ? '#9e9e9e'
    : npsScore >= 50 ? '#22c55e'
    : npsScore >= 0 ? '#f59e0b'
    : '#ef4444';

  // ── Salvar avaliação ─────────────────────────────────────
  const handleSave = async () => {
    if (selectedScore === null) return;
    setSaving(true);
    await addNpsFeedback({
      client_id: clientId,
      client_name: clientName,
      client_phone: clientPhone,
      score: selectedScore,
      comment,
    });
    setSaving(false);
    setSaved(true);
    setSelectedScore(null);
    setComment('');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box sx={{ mt: 3 }}>
      {/* ── TÍTULO ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Star size={18} color="#e91e63" />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Experiência do Cliente (NPS)
        </Typography>
      </Box>

      {/* ── DASHBOARD NPS GERAL ── */}
      {total > 0 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {/* Score */}
          <Card sx={{ flex: '0 0 auto', minWidth: 140, borderRadius: 3, border: '1px solid #f0e6f0' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
                <TrendingUp size={14} color="#9e7bb5" />
                <Typography variant="caption" color="text.secondary">NPS Geral</Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 800, color: npsScoreColor, lineHeight: 1 }}
              >
                {npsScore}
              </Typography>
              <Typography variant="caption" color="text.secondary">{total} avaliações</Typography>
            </CardContent>
          </Card>

          {/* Distribuição */}
          <Card sx={{ flex: 1, minWidth: 200, borderRadius: 3, border: '1px solid #f0e6f0' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Distribuição
              </Typography>
              <Box sx={{ position: 'relative', height: 10, borderRadius: 5, overflow: 'hidden', mb: 1, bgcolor: '#f5f5f5' }}>
                <Box sx={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${(promoters / total) * 100}%`, bgcolor: '#22c55e',
                  transition: 'width 0.5s',
                }} />
                <Box sx={{
                  position: 'absolute', left: `${(promoters / total) * 100}%`, top: 0, bottom: 0,
                  width: `${(neutrals / total) * 100}%`, bgcolor: '#f59e0b',
                }} />
                <Box sx={{
                  position: 'absolute', left: `${((promoters + neutrals) / total) * 100}%`, top: 0, bottom: 0,
                  width: `${(detractors / total) * 100}%`, bgcolor: '#ef4444',
                }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#22c55e' }} />
                  <Typography variant="caption">Promotoras: {promoters}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                  <Typography variant="caption">Neutras: {neutrals}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ef4444' }} />
                  <Typography variant="caption">Detratoras: {detractors}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ── FORMULÁRIO DE INPUT ── */}
      <Card sx={{ borderRadius: 3, border: '1px solid #f0e6f0', mb: 3 }}>
        <CardContent>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
            Registrar avaliação de {clientName}
          </Typography>

          {/* Régua de botões 0–10 */}
          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 2 }}>
            {Array.from({ length: 11 }, (_, i) => (
              <Button
                key={i}
                variant={selectedScore === i ? 'contained' : 'outlined'}
                onClick={() => setSelectedScore(i)}
                sx={{
                  minWidth: 38,
                  height: 38,
                  p: 0,
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: 13,
                  ...(selectedScore === i
                    ? { bgcolor: getScoreColor(i), borderColor: getScoreColor(i), '&:hover': { bgcolor: getScoreColor(i) } }
                    : { borderColor: '#e0d0e8', color: 'text.secondary', '&:hover': { bgcolor: getScoreBgColor(i), borderColor: getScoreColor(i) } }),
                }}
              >
                {i}
              </Button>
            ))}
          </Box>

          {selectedScore !== null && (
            <Chip
              label={`${getCategoryLabel(selectedScore)} — nota ${selectedScore}`}
              size="small"
              sx={{
                bgcolor: getScoreBgColor(selectedScore),
                color: getScoreColor(selectedScore),
                fontWeight: 600,
                mb: 1.5,
                border: `1px solid ${getScoreColor(selectedScore)}`,
              }}
            />
          )}

          <TextField
            label="Comentário da cliente (opcional)"
            fullWidth
            multiline
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            sx={{ mb: 2 }}
          />

          {saved && (
            <Alert severity="success" sx={{ mb: 1.5, borderRadius: 2 }}>
              ✅ Avaliação salva com sucesso!
            </Alert>
          )}

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={selectedScore === null || saving}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Star size={14} />}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            {saving ? 'Salvando...' : 'Salvar Avaliação'}
          </Button>
        </CardContent>
      </Card>

      {/* ── HISTÓRICO DE AVALIAÇÕES ── */}
      {clientFeedbacks.length > 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
            HISTÓRICO — {clientFeedbacks.length} avaliação(ões)
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {clientFeedbacks.map((fb) => (
              <Card
                key={fb.id}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${getScoreColor(fb.score)}40`,
                  bgcolor: getScoreBgColor(fb.score),
                }}
              >
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {/* Nota */}
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 800, color: getScoreColor(fb.score), lineHeight: 1 }}
                      >
                        {fb.score}
                      </Typography>
                      <Box>
                        <Chip
                          label={getCategoryLabel(fb.score)}
                          size="small"
                          sx={{
                            bgcolor: 'white',
                            color: getScoreColor(fb.score),
                            fontWeight: 600,
                            border: `1px solid ${getScoreColor(fb.score)}`,
                            mb: 0.5,
                          }}
                        />
                        {fb.comment && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                            "{fb.comment}"
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.disabled">
                          {new Date(fb.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Botão responder via WhatsApp (Detratora ou Promotora) */}
                    {fb.category !== 'NEUTRAL' && clientPhone && (
                      <Tooltip
                        title={
                          fb.category === 'DETRACTOR'
                            ? 'Responder e resolver insatisfação'
                            : 'Agradecer pelo feedback positivo'
                        }
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={
                            fb.category === 'DETRACTOR'
                              ? <ThumbsDown size={13} />
                              : <ThumbsUp size={13} />
                          }
                          onClick={() =>
                            fb.category === 'DETRACTOR'
                              ? sendNpsDetractor({ name: fb.client_name, phone: fb.client_phone }, fb.score)
                              : sendNpsPromoter({ name: fb.client_name, phone: fb.client_phone }, fb.score)
                          }
                          sx={{
                            borderRadius: 2,
                            fontSize: 11,
                            color: '#25D366',
                            borderColor: '#25D366',
                            '&:hover': { bgcolor: '#e8f5e9', borderColor: '#128C7E' },
                          }}
                        >
                          <MessageCircle size={13} style={{ marginRight: 4 }} />
                          Responder
                        </Button>
                      </Tooltip>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {clientFeedbacks.length === 0 && !isLoading && (
        <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 2 }}>
          Nenhuma avaliação registrada para esta cliente ainda.
        </Typography>
      )}
    </Box>
  );
}
