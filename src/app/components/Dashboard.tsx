import { useState, useMemo } from 'react';
import {
  Card, CardContent, CardHeader, Typography, Box, Grid, Divider, Button, 
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, FormControl, InputLabel, Select, MenuItem, Tooltip, Autocomplete, Avatar
} from '@mui/material';
import { 
  Calendar, DollarSign, CheckCircle, Clock, MessageCircle, 
  CalendarClock, Wallet, ClipboardList, Trash2
} from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AnamnesisForm } from './AnamnesisForm';

export function Dashboard() {
  const { appointments = [], clients = [], services = [], finances = [], anamnesis = [], updateAppointment, deleteAppointment, addFinance } = useAppData();
  const today = new Date();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [anamnesisOpen, setAnamnesisOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    clientId: '', service: '', price: 0, date: '', time: '', status: '', notes: ''
  });

  const existingAnamnesis = useMemo(() => {
    if (!formData.clientId) return null;
    return anamnesis.find(a => a.client_id === formData.clientId) || null;
  }, [anamnesis, formData.clientId]);

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

  const todayAppointments = useMemo(() => {
    return appointments
      .filter(a => {
        const d = parseDateSafe(a.date);
        return d && isSameDay(d, today);
      })
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [appointments, today]);

  const concluidosHoje = todayAppointments.filter(a => a.status === 'concluido').length;

  const todayFinances = useMemo(() => {
    return finances.filter(f => {
      const d = parseDateSafe(f.date);
      return d && isSameDay(d, today);
    });
  }, [finances, today]);

  const { receitaHoje, despesaHoje } = useMemo(() => {
    return todayFinances.reduce((acc, curr) => {
      if (curr.type === 'receita') acc.receitaHoje += Number(curr.value || 0);
      if (curr.type === 'despesa') acc.despesaHoje += Number(curr.value || 0);
      return acc;
    }, { receitaHoje: 0, despesaHoje: 0 });
  }, [todayFinances]);

  const saldoHoje = receitaHoje - despesaHoje;

  const handleWhatsApp = (e: any, clientId: string) => {
    e.stopPropagation(); 
    const client = clients.find(c => c.id === clientId);
    if (client?.phone) {
      const cleanPhone = client.phone.replace(/\D/g, ''); 
      window.open(`https://wa.me/55${cleanPhone}`, '_blank');
    } else {
      alert('Este cliente não tem telefone cadastrado.');
    }
  };

  // 👇 SISTEMA DE CONCLUSÃO BLINDADO
  const handleComplete = async (e: any, app: any) => {
    e.stopPropagation(); 
    const valorNumerico = Number(app.price || 0);

    if (confirm(`Deseja marcar o serviço "${app.service}" como concluído? O valor de ${formatPrice(valorNumerico)} será lançado no financeiro automaticamente.`)) {
      try {
        // 1. Muda o status
        await updateAppointment(app.id, { ...app, status: 'concluido', price: valorNumerico });
        
        // 2. Lança a receita se for maior que zero
        if (valorNumerico > 0) {
          const client = clients.find(c => c.id === app.clientId);
          await addFinance({
            id: Date.now().toString(),
            type: 'receita',
            description: `Atendimento: ${app.service} (${client?.name || 'Cliente'})`,
            value: valorNumerico,
            date: app.date,
            category: 'Serviços'
          });
        }
      } catch (error) {
        console.error("Erro ao concluir agendamento:", error);
        alert("Ocorreu um erro ao salvar no banco de dados. Tente novamente.");
      }
    }
  };

  const openEditModal = (app: any) => {
    setEditingId(app.id);
    setFormData({
      clientId: app.clientId,
      service: app.service,
      price: Number(app.price || 0),
      date: app.date,
      time: app.time || '09:00',
      status: app.status || 'agendado',
      notes: app.notes || ''
    });
    setEditModalOpen(true);
  };

  // 👇 EDIÇÃO MANUAL BLINDADA
  const handleSaveEdit = async () => {
    if (editingId) {
      try {
        const originalApp = appointments.find(a => a.id === editingId);
        const valorNumerico = Number(formData.price || 0);

        await updateAppointment(editingId, { ...formData, price: valorNumerico });
        
        if (formData.status === 'concluido' && originalApp?.status !== 'concluido' && valorNumerico > 0) {
          const client = clients.find(c => c.id === formData.clientId);
          await addFinance({
            id: Date.now().toString(),
            type: 'receita',
            description: `Atendimento: ${formData.service} (${client?.name || 'Cliente'})`,
            value: valorNumerico,
            date: formData.date,
            category: 'Serviços'
          });
        }
        setEditModalOpen(false);
      } catch (error) {
        console.error("Erro ao salvar edição:", error);
        alert("Ocorreu um erro ao atualizar o agendamento.");
      }
    }
  };

  const goToFinances = () => {
    const spans = Array.from(document.querySelectorAll('.MuiListItemText-primary'));
    const financeSpan = spans.find(el => el.textContent === 'Financeiro');
    if (financeSpan) {
      const btn = financeSpan.closest('.MuiListItemButton-root') as HTMLElement;
      if (btn) btn.click();
    }
  };

  const handlePrepareReschedule = () => {
    if (!editingId) return;
    updateAppointment(editingId, { ...formData, status: 'reagendado' });
    const oldDateStr = formData.date ? format(parseISO(formData.date), 'dd/MM/yyyy') : 'data anterior';
    const autoNote = `[Origem: Reagendado do dia ${oldDateStr} às ${formData.time}]`;
    setEditingId(null);
    setFormData({ ...formData, status: 'agendado', notes: formData.notes ? `${formData.notes}\n${autoNote}` : autoNote });
    alert("Marcado como 'Reagendado'. Agora escolha a nova data/hora e clique em 'Atualizar'!");
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
      
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Olá, Mari! 👋</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
          {format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </Typography>
      </Box>

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

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
            <CardHeader title="Agendamentos de Hoje" subheader="Clique sobre o card para editar ou abrir a Ficha de Anamnese" sx={{ pb: 1 }} />
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
                      <Card 
                        key={app.id} 
                        variant="outlined" 
                        onClick={() => openEditModal(app)}
                        sx={{ 
                          display: 'flex', flexWrap: 'wrap', alignItems: 'center', p: 2, gap: 2, cursor: 'pointer',
                          bgcolor: isConcluido ? '#f5f5f5' : isCancelado ? '#fff0f0' : 'white',
                          opacity: (isConcluido || isCancelado) ? 0.7 : 1,
                          borderLeft: '4px solid', borderLeftColor: `${getStatusColor(app.status)}.main`,
                          transition: 'all 0.2s', '&:hover': { bgcolor: '#f0f7ff', borderColor: 'primary.main', transform: 'scale(1.01)' }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 80 }}>
                          <Clock size={20} className={isConcluido ? 'text-gray-400' : 'text-primary'} />
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: isConcluido ? 'text.secondary' : 'text.primary' }}>
                            {app.time}
                          </Typography>
                        </Box>

                        <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {client?.name || 'Cliente Removido'}
                            </Typography>
                            <Chip label={app.status} size="small" color={getStatusColor(app.status) as any} variant="outlined" sx={{ textTransform: 'capitalize', height: 20, fontSize: '0.7rem' }} />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {app.service} • <span style={{ fontWeight: 'bold' }}>{formatPrice(Number(app.price || 0))}</span>
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          {client?.phone && (
                            <Tooltip title="Chamar no WhatsApp">
                              <IconButton size="small" sx={{ color: '#25D366', bgcolor: '#e8f5e9', '&:hover': { bgcolor: '#c8e6c9' } }} onClick={(e) => handleWhatsApp(e, client.id)}>
                                <MessageCircle size={20} />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {(!isConcluido && !isCancelado) && (
                            <Button variant="contained" color="success" size="small" startIcon={<CheckCircle size={16} />} onClick={(e) => handleComplete(e, app)} sx={{ ml: 1 }}>
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

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Balanço do Dia" subheader="Movimentações de hoje" sx={{ pb: 1 }} />
            <Divider />
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" color="text.secondary">Receitas (Hoje)</Typography>
                <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 'bold' }}>{formatPrice(receitaHoje)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" color="text.secondary">Despesas (Hoje)</Typography>
                <Typography variant="h6" sx={{ color: 'error.main', fontWeight: 'bold' }}>- {formatPrice(despesaHoje)}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8f9fa', p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Saldo do Dia</Typography>
                <Typography variant="h5" sx={{ color: saldoHoje >= 0 ? 'primary.main' : 'error.main', fontWeight: 'bold' }}>{formatPrice(saldoHoje)}</Typography>
              </Box>

              <Button variant="outlined" fullWidth sx={{ mt: 2 }} onClick={goToFinances}>
                Ver Relatório Mensal Completo
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* DIÁLOGO: EDIÇÃO COMPLETA */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Detalhes do Atendimento</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          <Button 
            variant="outlined" startIcon={<ClipboardList />} fullWidth
            color={existingAnamnesis ? "success" : "secondary"}
            onClick={() => { if (!formData.clientId) return; setAnamnesisOpen(true); }}
            sx={{ mb: 1, fontWeight: 'bold', borderWidth: 2 }}
          >
            {existingAnamnesis ? 'VER Ficha de Anamnese' : 'CRIAR Ficha de Anamnese'}
          </Button>

          <Autocomplete
            options={[...clients].sort((a, b) => (a.name || '').localeCompare(b.name || ''))}
            getOptionLabel={(option) => option.name || ""}
            value={clients.find(c => c.id === formData.clientId) || null}
            onChange={(_, newValue) => setFormData({ ...formData, clientId: newValue ? newValue.id : '' })}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => <TextField {...params} label="Cliente" fullWidth />}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.id} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: 'primary.main' }}>
                  {option.name ? option.name[0].toUpperCase() : '?'}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{option.name}</Typography>
                </Box>
              </Box>
            )}
          />
          
          <FormControl fullWidth>
            <InputLabel>Serviço</InputLabel>
            <Select value={formData.service} label="Serviço" onChange={(e) => {
              const sObj = services.find(s => s.name === e.target.value);
              setFormData({ ...formData, service: e.target.value, price: sObj ? sObj.price : 0 });
            }}>
              {services.map(s => <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>

          <TextField type="number" label="Valor do Serviço (R$)" fullWidth value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField type="date" label="Data" fullWidth InputLabelProps={{ shrink: true }} value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            <TextField type="time" label="Hora" fullWidth InputLabelProps={{ shrink: true }} value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
          </Box>

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select value={formData.status} label="Status" onChange={(e) => setFormData({...formData, status: e.target.value})}>
              <MenuItem value="agendado">Agendado</MenuItem>
              <MenuItem value="concluido">Concluído</MenuItem>
              <MenuItem value="reagendado">Reagendado</MenuItem>
              <MenuItem value="cancelado">Cancelado</MenuItem>
            </Select>
          </FormControl>

          <TextField label="Observações" fullWidth multiline rows={3} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />

        </DialogContent>
        <DialogActions sx={{ p: 2, flexWrap: 'wrap', gap: 1, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton color="error" onClick={() => { if(confirm('Excluir agendamento?')) { deleteAppointment(editingId as string); setEditModalOpen(false); } }}><Trash2 size={20} /></IconButton>
            <Button color="warning" variant="outlined" onClick={handlePrepareReschedule} startIcon={<CalendarClock size={18}/>}>Reagendar</Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setEditModalOpen(false)} color="inherit">Sair</Button>
            <Button onClick={handleSaveEdit} variant="contained">Atualizar</Button>
          </Box>
        </DialogActions>
      </Dialog>

      {formData.clientId && (
        <AnamnesisForm open={anamnesisOpen} onClose={() => setAnamnesisOpen(false)} clientId={formData.clientId} existingData={existingAnamnesis} />
      )}
    </Box>
  );
}