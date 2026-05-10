import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Grid,
  Divider,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip
} from '@mui/material';
import { 
  Calendar, 
  DollarSign, 
  TrendingDown, 
  CheckCircle, 
  Clock, 
  MessageCircle,
  CalendarClock,
  Wallet
} from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Dashboard() {
  const { appointments = [], clients = [], finances = [], updateAppointment } = useAppData();
  const today = new Date();

  // Estados para Edição Rápida (Reagendamento)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<any>(null);
  const [editForm, setEditForm] = useState({ date: '', time: '', status: '' });

  // --- FUNÇÕES AUXILIARES ---
  const parseDateSafe = (dateValue: any) => {
    try {
      if (!dateValue) return null;
      if (dateValue instanceof Date) return dateValue;
      return parseISO(String(dateValue).split('T')[0]);
    } catch (e) { return null; }
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // --- CÁLCULOS DO DASHBOARD (VISÃO DIÁRIA) ---
  
  const todayAppointments = useMemo(() => {
    return appointments
      .filter(a => {
        const d = parseDateSafe(a.date);
        return d && isSameDay(d, today);
      })
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [appointments, today]);

  // Quantos serviços já foram finalizados hoje?
  const concluidosHoje = todayAppointments.filter(a => a.status === 'concluido').length;

  const todayFinances = useMemo(() => {
    return finances.filter(f => {
      const d = parseDateSafe(f.date);
      return d && isSameDay(d, today);
    });
  }, [finances, today]);

  const { receitaHoje, despesaHoje } = useMemo(() => {
    return todayFinances.reduce((acc, curr) => {
      if (curr.type === 'receita') acc.receitaHoje += curr.value;
      if (curr.type === 'despesa') acc.despesaHoje += curr.value;
      return acc;
    }, { receitaHoje: 0, despesaHoje: 0 });
  }, [todayFinances]);

  const saldoHoje = receitaHoje - despesaHoje;

  // --- AÇÕES RÁPIDAS ---
  
  const handleWhatsApp = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client?.phone) {
      const cleanPhone = client.phone.replace(/\D/g, ''); 
      window.open(`https://wa.me/55${cleanPhone}`, '_blank');
    } else {
      alert('Este cliente não tem telefone cadastrado.');
    }
  };

  const handleComplete = (app: any) => {
    if (confirm(`Deseja marcar o serviço "${app.service}" como concluído? O valor será lançado no financeiro automaticamente.`)) {
      updateAppointment(app.id, { ...app, status: 'concluido' });
    }
  };

  const openEditModal = (app: any) => {
    setEditingApp(app);
    setEditForm({
      date: app.date,
      time: app.time,
      status: app.status
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingApp) {
      updateAppointment(editingApp.id, {
        ...editingApp,
        date: editForm.date,
        time: editForm.time,
        status: editForm.status
      });
    }
    setEditModalOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido': return 'success';
      case 'cancelado': return 'error';
      case 'reagendado': return 'warning';
      default: return 'primary';
    }
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      
      {/* CABEÇALHO */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Olá, Mari! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
          {format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </Typography>
      </Box>

      {/* CARDS SUPERIORES DE RESUMO (Focados no Dia) */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #9c27b0', height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#f3e5f5', borderRadius: '50%', color: '#9c27b0' }}><Calendar /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Agendamentos (Hoje)</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{todayAppointments.length}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #2196f3', height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#e3f2fd', borderRadius: '50%', color: '#2196f3' }}><CheckCircle /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Concluídos (Hoje)</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{concluidosHoje}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #4caf50', height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#e8f5e9', borderRadius: '50%', color: '#4caf50' }}><DollarSign /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Receita (Hoje)</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>{formatPrice(receitaHoje)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #ff9800', height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#fff3e0', borderRadius: '50%', color: '#ff9800' }}><Wallet /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Saldo (Hoje)</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#e65100' }}>{formatPrice(saldoHoje)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ÁREA PRINCIPAL: LISTA DE HOJE E RESUMO FINANCEIRO */}
      <Grid container spacing={3}>
        
        {/* ESQUERDA: Agendamentos de Hoje (Interativo) */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
            <CardHeader 
              title="Agendamentos de Hoje" 
              subheader="Sua rotina e próximos atendimentos"
              sx={{ pb: 1 }}
            />
            <Divider />
            <CardContent sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
              {todayAppointments.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary', p: 4 }}>
                  <Calendar size={48} opacity={0.2} style={{ marginBottom: 16 }} />
                  <Typography variant="body1">Sua agenda está livre hoje!</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {todayAppointments.map((app) => {
                    const client = clients.find(c => c.id === app.clientId);
                    const isConcluido = app.status === 'concluido';
                    const isCancelado = app.status === 'cancelado';

                    return (
                      <Card key={app.id} variant="outlined" sx={{ 
                        display: 'flex', flexWrap: 'wrap', alignItems: 'center', p: 2, gap: 2,
                        bgcolor: isConcluido ? '#f5f5f5' : isCancelado ? '#fff0f0' : 'white',
                        opacity: (isConcluido || isCancelado) ? 0.7 : 1,
                        borderLeft: '4px solid',
                        borderLeftColor: `${getStatusColor(app.status)}.main`
                      }}>
                        
                        {/* Bloco de Horário */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 80 }}>
                          <Clock size={20} className={isConcluido ? 'text-gray-400' : 'text-primary'} />
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: isConcluido ? 'text.secondary' : 'text.primary' }}>
                            {app.time}
                          </Typography>
                        </Box>

                        {/* Bloco de Info do Cliente */}
                        <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {client?.name || 'Cliente Removido'}
                            </Typography>
                            <Chip label={app.status} size="small" color={getStatusColor(app.status)} variant="outlined" sx={{ textTransform: 'capitalize', height: 20, fontSize: '0.7rem' }} />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {app.service} • <span style={{ fontWeight: 'bold' }}>{formatPrice(app.price || 0)}</span>
                          </Typography>
                        </Box>

                        {/* Bloco de Ações Rápidas */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          
                          {/* Botão WhatsApp */}
                          {client?.phone && (
                            <Tooltip title="Chamar no WhatsApp">
                              <IconButton size="small" sx={{ color: '#25D366', bgcolor: '#e8f5e9', '&:hover': { bgcolor: '#c8e6c9' } }} onClick={() => handleWhatsApp(client.id)}>
                                <MessageCircle size={20} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Botão Reagendar/Editar Rápido */}
                          <Tooltip title="Editar / Reagendar">
                            <IconButton size="small" color="primary" sx={{ bgcolor: 'primary.light', color: 'white', '&:hover': { bgcolor: 'primary.main' } }} onClick={() => openEditModal(app)}>
                              <CalendarClock size={20} /> 
                            </IconButton>
                          </Tooltip>

                          {/* Botão Concluir Serviço */}
                          {(!isConcluido && !isCancelado) && (
                            <Button 
                              variant="contained" 
                              color="success" 
                              size="small" 
                              startIcon={<CheckCircle size={16} />}
                              onClick={() => handleComplete(app)}
                              sx={{ ml: 1 }}
                            >
                              Concluir
                            </Button>
                          )}
                        </Box>

                      </Card>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* DIREITA: Resumo Financeiro Simplificado (DIÁRIO) */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Balanço do Dia" subheader="Movimentações de hoje" sx={{ pb: 1 }} />
            <Divider />
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" color="text.secondary">Receitas (Hoje)</Typography>
                <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                  {formatPrice(receitaHoje)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" color="text.secondary">Despesas (Hoje)</Typography>
                <Typography variant="h6" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                  - {formatPrice(despesaHoje)}
                </Typography>
              </Box>

              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8f9fa', p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Saldo do Dia</Typography>
                <Typography variant="h5" sx={{ color: saldoHoje >= 0 ? 'primary.main' : 'error.main', fontWeight: 'bold' }}>
                  {formatPrice(saldoHoje)}
                </Typography>
              </Box>

              <Button variant="outlined" fullWidth sx={{ mt: 2 }} onClick={() => document.getElementById('tab-Financeiro')?.click()}>
                Ver Relatório Mensal Completo
              </Button>

            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* DIÁLOGO: EDIÇÃO RÁPIDA (REAGENDAR) */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Edição Rápida</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField type="date" label="Data" fullWidth InputLabelProps={{ shrink: true }} value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} />
            <TextField type="time" label="Hora" fullWidth InputLabelProps={{ shrink: true }} value={editForm.time} onChange={(e) => setEditForm({...editForm, time: e.target.value})} />
          </Box>

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select value={editForm.status} label="Status" onChange={(e) => setEditForm({...editForm, status: e.target.value})}>
              <MenuItem value="agendado">Agendado</MenuItem>
              <MenuItem value="concluido">Concluído</MenuItem>
              <MenuItem value="reagendado">Reagendado</MenuItem>
              <MenuItem value="cancelado">Cancelado</MenuItem>
            </Select>
          </FormControl>

        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditModalOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleSaveEdit} variant="contained">Salvar Alterações</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}