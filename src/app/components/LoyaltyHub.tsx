// ============================================================
// TELA: CLUBE DE FIDELIDADE — Studio Mari Moraes
// Arquivo: src/app/components/LoyaltyHub.tsx
//
// Funcionalidades:
//  - Visualizar o programa ativo (Jornada Premium) com métricas
//  - Ver ranking de clientes e seus progressos
//  - Criar novos programas de fidelidade (futuro)
//  - Disparar WhatsApp em massa para clientes em risco
// ============================================================

import { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Chip, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Grid, LinearProgress,
  Divider, IconButton, Tooltip, Switch, FormControlLabel, Alert,
  Tab, Tabs, Badge,
} from '@mui/material';
import {
  Star, Plus, Users, Trophy, AlertTriangle, Zap, Gift,
  MessageCircle, Settings, BarChart3, Play, Pause, ChevronRight,
  Crown, Flame,
} from 'lucide-react';
import { useLoyalty, JORNADA_PREMIUM } from '../hooks/useLoyalty';
import { useWhatsAppCRM } from '../hooks/useWhatsAppCRM';
import { useAppData } from '../hooks/useAppData';
import { LoyaltyProgram, ClientLoyaltyProgress } from '../types/loyalty';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://usqitmgfqtvdxszeusyf.supabase.co',
  'sb_publishable_u9RgR3SAeVLdQTjb7FerLQ_492VkzC1'
);

// ── Helpers ──────────────────────────────────────────────────
const getDaysSince = (dateStr: string | null): number | null => {
  if (!dateStr) return null;
  return Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 86400000);
};

const getExpirationDate = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('pt-BR');
};

// ── Tipos locais ──────────────────────────────────────────────
interface NewProgramForm {
  name: string;
  type: 'COUNT_BASED' | 'POINTS' | 'CASHBACK' | 'SUBSCRIPTION';
  trigger_service: string;
  cycle_goal: number;
  expiration_days: number;
  reward_service: string;
  reward_price: number;
  locked_price: number;
}

const EMPTY_FORM: NewProgramForm = {
  name: '',
  type: 'COUNT_BASED',
  trigger_service: '',
  cycle_goal: 5,
  expiration_days: 15,
  reward_service: '',
  reward_price: 0,
  locked_price: 0,
};

const TYPE_LABELS: Record<string, string> = {
  COUNT_BASED: '🔢 Contagem de Visitas',
  POINTS: '⭐ Pontos',
  CASHBACK: '💰 Cashback',
  SUBSCRIPTION: '📅 Assinatura',
};

// ── Componente Principal ──────────────────────────────────────
export function LoyaltyHub() {
  const { progressList, npsList, fetchLoyaltyData } = useLoyalty();
  const { clients } = useAppData();
  const { sendLembrete, sendCicloCompleto } = useWhatsAppCRM();

  const [tab, setTab] = useState(0);
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([JORNADA_PREMIUM]);
  const [openNewProgram, setOpenNewProgram] = useState(false);
  const [form, setForm] = useState<NewProgramForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLoyaltyData();
    fetchPrograms();
  }, [fetchLoyaltyData]);

  const fetchPrograms = async () => {
    const { data } = await supabase.from('loyalty_programs').select('*').order('created_at');
    if (data && data.length > 0) setPrograms(data);
  };

  // ── Métricas gerais ───────────────────────────────────────
  const metrics = useMemo(() => {
    const cfg = JORNADA_PREMIUM.rules_config;
    const total = progressList.length;
    const active = progressList.filter(p => p.status === 'ACTIVE' && p.current_count > 0).length;
    const rewardReady = progressList.filter(p => p.current_count >= cfg.cycle_goal).length;
    const atRisk = progressList.filter(p => {
      const days = getDaysSince(p.last_visit_date);
      return days !== null && days >= 10 && days <= cfg.expiration_days && p.current_count > 0;
    }).length;
    const expired = progressList.filter(p => p.status === 'EXPIRED').length;

    // NPS Score
    const npsTotal = npsList.length;
    const promoters = npsList.filter(n => n.category === 'PROMOTER').length;
    const detractors = npsList.filter(n => n.category === 'DETRACTOR').length;
    const npsScore = npsTotal > 0 ? Math.round(((promoters - detractors) / npsTotal) * 100) : null;

    return { total, active, rewardReady, atRisk, expired, npsScore, npsTotal };
  }, [progressList, npsList]);

  // ── Lista de clientes enriquecida ─────────────────────────
  const enrichedProgress = useMemo(() => {
    const cfg = JORNADA_PREMIUM.rules_config;
    return progressList
      .map(p => {
        const client = clients.find(c => c.id === p.client_id);
        const days = getDaysSince(p.last_visit_date);
        const isAtRisk = days !== null && days >= 10 && days <= cfg.expiration_days && p.current_count > 0;
        const isReady = p.current_count >= cfg.cycle_goal;
        return { ...p, client, days, isAtRisk, isReady };
      })
      .sort((a, b) => {
        // Ordena: recompensa pronta → em risco → ativos → expirados
        if (a.isReady && !b.isReady) return -1;
        if (!a.isReady && b.isReady) return 1;
        if (a.isAtRisk && !b.isAtRisk) return -1;
        if (!a.isAtRisk && b.isAtRisk) return 1;
        return (b.current_count) - (a.current_count);
      });
  }, [progressList, clients]);

  // ── Salvar novo programa ──────────────────────────────────
  const handleSaveProgram = async () => {
    if (!form.name || !form.trigger_service || !form.reward_service) {
      alert('Preencha pelo menos: nome, serviço gatilho e recompensa.');
      return;
    }
    setSaving(true);
    const newProgram = {
      id: `prog-${Date.now()}`,
      name: form.name,
      type: form.type,
      is_active: false, // inativo por padrão até ativar
      rules_config: {
        trigger_service: form.trigger_service,
        cycle_goal: Number(form.cycle_goal),
        expiration_days: Number(form.expiration_days),
        reward_service: form.reward_service,
        reward_price: Number(form.reward_price),
        locked_price: Number(form.locked_price),
      },
    };
    const { error } = await supabase.from('loyalty_programs').insert([newProgram]);
    if (error) alert('Erro ao salvar: ' + error.message);
    else {
      await fetchPrograms();
      setOpenNewProgram(false);
      setForm(EMPTY_FORM);
    }
    setSaving(false);
  };

  // ── Toggle ativo/inativo de um programa ──────────────────
  const handleToggleProgram = async (prog: LoyaltyProgram) => {
    await supabase
      .from('loyalty_programs')
      .update({ is_active: !prog.is_active })
      .eq('id', prog.id);
    await fetchPrograms();
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>

      {/* ── CABEÇALHO ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Crown size={24} color="#e91e63" />
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Clube de Fidelidade
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {metrics.total} clientes na jornada · {metrics.rewardReady} com recompensa disponível
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => setOpenNewProgram(true)}
          sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
        >
          Novo Programa
        </Button>
      </Box>

      {/* ── CARDS DE MÉTRICAS ── */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: 'Clientes Ativos', value: metrics.active, icon: <Users size={20} />, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Recompensa Pronta', value: metrics.rewardReady, icon: <Gift size={20} />, color: '#e91e63', bg: '#fce4ec' },
          { label: 'Em Risco de Expirar', value: metrics.atRisk, icon: <AlertTriangle size={20} />, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'NPS Score', value: metrics.npsScore !== null ? metrics.npsScore : '—', icon: <Star size={20} />, color: '#22c55e', bg: '#f0fdf4' },
        ].map((m, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card sx={{ borderRadius: 3, border: `1px solid ${m.color}22` }}>
              <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {m.label}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: m.color, lineHeight: 1.1, mt: 0.5 }}>
                      {m.value}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: m.bg, color: m.color }}>
                    {m.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── ABAS ── */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab label="Programas" icon={<Settings size={16} />} iconPosition="start" sx={{ fontWeight: 600, minHeight: 48 }} />
        <Tab
          label="Clientes na Jornada"
          icon={
            <Badge badgeContent={metrics.rewardReady} color="error" max={99}>
              <Users size={16} />
            </Badge>
          }
          iconPosition="start"
          sx={{ fontWeight: 600, minHeight: 48 }}
        />
      </Tabs>

      {/* ══════════════════════════════════════════
          ABA 0 — PROGRAMAS
      ══════════════════════════════════════════ */}
      {tab === 0 && (
        <Box>
          {programs.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Nenhum programa cadastrado. Clique em "Novo Programa" para começar.
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {programs.map((prog) => {
              const cfg = prog.rules_config;
              const isJornadaPremium = prog.id === JORNADA_PREMIUM.id;
              return (
                <Card
                  key={prog.id}
                  sx={{
                    borderRadius: 3,
                    border: prog.is_active ? '2px solid #e91e63' : '1px solid #e0e0e0',
                    transition: 'all 0.2s',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                      {/* Info do programa */}
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Star size={18} color="#e91e63" fill={prog.is_active ? '#e91e63' : 'none'} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{prog.name}</Typography>
                          <Chip
                            label={TYPE_LABELS[prog.type] || prog.type}
                            size="small"
                            sx={{ bgcolor: '#f3e5f5', color: '#7b1fa2', fontWeight: 600, fontSize: 11 }}
                          />
                          {prog.is_active && (
                            <Chip label="Ativo" size="small" color="success" sx={{ fontWeight: 700, fontSize: 11 }} />
                          )}
                        </Box>

                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                          {[
                            { label: 'Serviço gatilho', value: cfg.trigger_service },
                            { label: 'Meta do ciclo', value: `${cfg.cycle_goal} visitas` },
                            { label: 'Expiração', value: `${cfg.expiration_days} dias` },
                            { label: 'Recompensa', value: cfg.reward_service },
                            { label: 'Valor de tabela', value: `R$ ${Number(cfg.reward_price).toFixed(2)}` },
                            { label: 'Valor cobrado', value: `R$ ${Number(cfg.locked_price).toFixed(2)}` },
                          ].map((item, i) => (
                            <Grid item xs={6} sm={4} key={i}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                                {item.label}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {item.value}
                              </Typography>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>

                      {/* Controles */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1.5 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={!!prog.is_active}
                              onChange={() => handleToggleProgram(prog)}
                              color="primary"
                            />
                          }
                          label={<Typography variant="caption" sx={{ fontWeight: 600 }}>{prog.is_active ? 'Ativo' : 'Inativo'}</Typography>}
                          labelPlacement="start"
                        />
                        {isJornadaPremium && (
                          <Chip
                            icon={<Flame size={12} />}
                            label="Programa principal"
                            size="small"
                            sx={{ bgcolor: '#fce4ec', color: '#c2185b', fontSize: 11 }}
                          />
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>
      )}

      {/* ══════════════════════════════════════════
          ABA 1 — CLIENTES NA JORNADA
      ══════════════════════════════════════════ */}
      {tab === 1 && (
        <Box>
          {enrichedProgress.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Nenhuma cliente entrou na Jornada ainda. Registre visitas pela tela de Clientes.
            </Alert>
          )}

          {/* Filtro rápido */}
          {metrics.atRisk > 0 && (
            <Alert
              severity="warning"
              icon={<AlertTriangle size={18} />}
              sx={{ mb: 2, borderRadius: 2 }}
              action={
                <Button
                  size="small"
                  color="inherit"
                  sx={{ fontWeight: 700 }}
                  onClick={() => {
                    // Dispara lembrete para todas as clientes em risco
                    enrichedProgress
                      .filter(p => p.isAtRisk && p.client?.phone)
                      .forEach(p => {
                        if (p.client) {
                          sendLembrete(
                            { name: p.client.name, phone: p.client.phone },
                            p as ClientLoyaltyProgress
                          );
                        }
                      });
                  }}
                >
                  📲 Lembrar todas ({metrics.atRisk})
                </Button>
              }
            >
              {metrics.atRisk} cliente(s) em risco de perder o progresso!
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {enrichedProgress.map((p) => {
              const cfg = JORNADA_PREMIUM.rules_config;
              const pct = Math.round((p.current_count / cfg.cycle_goal) * 100);
              const clientName = p.client?.name || 'Cliente removida';
              const clientPhone = p.client?.phone || '';
              const initial = clientName.charAt(0).toUpperCase();

              return (
                <Card
                  key={p.id}
                  sx={{
                    borderRadius: 3,
                    border: p.isReady
                      ? '2px solid #e91e63'
                      : p.isAtRisk
                      ? '1px solid #f59e0b'
                      : '1px solid transparent',
                    bgcolor: p.isReady ? '#fff9fb' : p.isAtRisk ? '#fffdf5' : 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': { boxShadow: 3 },
                  }}
                >
                  <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {/* Avatar + nome */}
                      <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700, width: 36, height: 36, fontSize: 16 }}>
                        {initial}
                      </Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                            {clientName}
                          </Typography>
                          {p.isReady && (
                            <Chip icon={<Gift size={12} />} label="Recompensa pronta!" size="small"
                              sx={{ bgcolor: '#fce4ec', color: '#c2185b', fontWeight: 700, height: 20, fontSize: 11 }} />
                          )}
                          {p.isAtRisk && !p.isReady && (
                            <Chip icon={<AlertTriangle size={12} />}
                              label={`Expira em ${cfg.expiration_days - (p.days ?? 0)}d`}
                              size="small"
                              sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 600, height: 20, fontSize: 11 }} />
                          )}
                          {p.status === 'EXPIRED' && !p.isReady && (
                            <Chip label="Expirado" size="small" color="error" variant="outlined"
                              sx={{ height: 20, fontSize: 11 }} />
                          )}
                        </Box>

                        {/* Barra de progresso */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{
                              flex: 1,
                              height: 7,
                              borderRadius: 4,
                              bgcolor: '#f5e6f0',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                bgcolor: p.isReady ? '#e91e63' : '#f48fb1',
                              },
                            }}
                          />
                          <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 32, color: p.isReady ? '#e91e63' : 'text.secondary' }}>
                            {p.current_count}/{cfg.cycle_goal}
                          </Typography>
                        </Box>

                        {p.last_visit_date && (
                          <Typography variant="caption" color="text.disabled">
                            Última visita: {new Date(p.last_visit_date).toLocaleDateString('pt-BR')}
                            {p.days !== null && ` (${p.days}d atrás)`}
                          </Typography>
                        )}
                      </Box>

                      {/* Ações WhatsApp */}
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {p.isAtRisk && clientPhone && (
                          <Tooltip title="Enviar lembrete via WhatsApp">
                            <IconButton
                              size="small"
                              onClick={() => sendLembrete(
                                { name: clientName, phone: clientPhone },
                                p as ClientLoyaltyProgress
                              )}
                              sx={{ color: '#128C7E', '&:hover': { bgcolor: '#e8f5e9' } }}
                            >
                              <MessageCircle size={18} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {p.isReady && clientPhone && (
                          <Tooltip title="Avisar sobre a recompensa via WhatsApp">
                            <IconButton
                              size="small"
                              onClick={() => sendCicloCompleto({ name: clientName, phone: clientPhone })}
                              sx={{ color: '#e91e63', '&:hover': { bgcolor: '#fce4ec' } }}
                            >
                              <Gift size={18} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>
      )}

      {/* ══════════════════════════════════════════
          MODAL — NOVO PROGRAMA
      ══════════════════════════════════════════ */}
      <Dialog open={openNewProgram} onClose={() => setOpenNewProgram(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Star size={20} color="#e91e63" />
          Novo Programa de Fidelidade
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>

          <TextField
            label="Nome do programa *"
            fullWidth
            placeholder="Ex: Clube Ouro, Assinatura VIP..."
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />

          <FormControl fullWidth>
            <InputLabel>Tipo de programa *</InputLabel>
            <Select
              value={form.type}
              label="Tipo de programa *"
              onChange={e => setForm({ ...form, type: e.target.value as NewProgramForm['type'] })}
            >
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <MenuItem key={k} value={k}>{v}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>REGRAS DO CICLO</Typography>
          </Divider>

          <TextField
            label="Serviço gatilho *"
            fullWidth
            placeholder="Ex: Lavagem Premium, Corte Feminino..."
            helperText="Qual serviço contabiliza no ciclo de fidelidade?"
            value={form.trigger_service}
            onChange={e => setForm({ ...form, trigger_service: e.target.value })}
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Meta de visitas *"
                type="number"
                fullWidth
                inputProps={{ min: 2, max: 20 }}
                helperText="Quantas visitas completam 1 ciclo"
                value={form.cycle_goal}
                onChange={e => setForm({ ...form, cycle_goal: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Prazo de expiração (dias) *"
                type="number"
                fullWidth
                inputProps={{ min: 1, max: 365 }}
                helperText="Dias máx. entre visitas"
                value={form.expiration_days}
                onChange={e => setForm({ ...form, expiration_days: Number(e.target.value) })}
              />
            </Grid>
          </Grid>

          <Divider>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>RECOMPENSA</Typography>
          </Divider>

          <TextField
            label="Serviço da recompensa *"
            fullWidth
            placeholder="Ex: Hidratação + Escova, Manicure Grátis..."
            value={form.reward_service}
            onChange={e => setForm({ ...form, reward_service: e.target.value })}
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Valor de tabela (R$)"
                type="number"
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
                helperText="Preço real do serviço"
                value={form.reward_price}
                onChange={e => setForm({ ...form, reward_price: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Valor cobrado (R$)"
                type="number"
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
                helperText="O que a cliente paga"
                value={form.locked_price}
                onChange={e => setForm({ ...form, locked_price: Number(e.target.value) })}
              />
            </Grid>
          </Grid>

          {form.reward_price > 0 && form.locked_price > 0 && (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              <Typography variant="body2">
                A cliente terá um desconto de{' '}
                <strong>R$ {(form.reward_price - form.locked_price).toFixed(2)}</strong>{' '}
                ({Math.round(((form.reward_price - form.locked_price) / form.reward_price) * 100)}% off) na {form.cycle_goal + 1}ª visita.
              </Typography>
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => { setOpenNewProgram(false); setForm(EMPTY_FORM); }} sx={{ borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveProgram}
            disabled={saving}
            startIcon={<Star size={16} />}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            {saving ? 'Salvando...' : 'Criar Programa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}