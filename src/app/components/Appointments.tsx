import { useState, useMemo } from 'react';
import {
  Card, CardContent, CardHeader, Typography, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, FormControl, InputLabel,
  Select, Chip, Box, Divider, IconButton, Autocomplete, Avatar
} from '@mui/material';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, ClipboardList, Trash2, CalendarClock } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AnamnesisForm } from './AnamnesisForm';

export function Appointments() {
  const { appointments = [], clients = [], services = [], anamnesis = [], addAppointment, updateAppointment, deleteAppointment, addFinance } = useAppData();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [anamnesisOpen, setAnamnesisOpen] = useState(false);
  
  const [formData, setFormData] = useState<{
    clientId: string; services: string[]; price: number; date: string; time: string; status: string; notes: string;
  }>({
    clientId: '', services: [], price: 0, date: format(new Date(), 'yyyy-MM-dd'), time: '09:00', status: 'agendado', notes: ''
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

  const extractDateOnly = (dateValue: any) => {
    if (!dateValue) return '';
    if (typeof dateValue === 'string') return dateValue.split('T')[0];
    if (dateValue instanceof Date) return format(dateValue, 'yyyy-MM-dd');
    return String(dateValue).split('T')[0];
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    return eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(endOfMonth(monthStart)) });
  }, [currentDate]);

  const selectedDayApps = useMemo(() => {
    return appointments
      .filter(a => { const d = parseDateSafe(a.date); return d && isSameDay(d, selectedDate); })
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [appointments, selectedDate]);

  const handleOpenNew = (day: Date) => {
    setEditingId(null);
    setFormData({ clientId: '', services: [], price: 0, date: format(day, 'yyyy-MM-dd'), time: '09:00', notes: '', status: 'agendado' });
    setOpen(true);
  };

  const handleEdit = (app: any) => {
    setEditingId(app.id);
    setFormData({ 
      clientId: app.clientId, 
      services: app.service ? app.service.split(',').map((s: string) => s.trim()) : [], 
      price: app.price || 0, 
      date: extractDateOnly(app.date), 
      time: app.time || '09:00', 
      notes: app.notes || '', 
      status: app.status || 'agendado' 
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formData.clientId || formData.services.length === 0) { 
      alert("Selecione uma cliente e pelo menos um serviço!"); 
      return; 
    }
    
    const valorNumerico = Number(formData.price || 0);
    const dataOriginalAgendamento = extractDateOnly(formData.date);
    const client = clients.find(c => c.id === formData.clientId);
    const servicosUnidos = formData.services.join(', ');

    const appPayload = {
      clientId: formData.clientId,
      service: servicosUnidos,
      price: valorNumerico,
      date: dataOriginalAgendamento,
      time: formData.time,
      status: formData.status as 'agendado' | 'concluido' | 'cancelado' | 'reagendado',
      notes: formData.notes
    };

    try {
      if (editingId) { 
        const originalApp = appointments.find(a => a.id === editingId);
        await updateAppointment(editingId, appPayload); 
        
        if (formData.status === 'concluido' && originalApp?.status !== 'concluido' && valorNumerico > 0) {
          await addFinance({
            id: Date.now().toString(),
            type: 'receita',
            description: `Atendimento: ${servicosUnidos} (${client?.name || 'Cliente'})`,
            value: valorNumerico,
            date: dataOriginalAgendamento,
            category: 'Serviços'
          });
        }
      } 
      else { 
        await addAppointment({ id: Date.now().toString(), ...appPayload }); 
        
        if (formData.status === 'concluido' && valorNumerico > 0) {
          await addFinance({
            id: Date.now().toString(),
            type: 'receita',
            description: `Atendimento: ${servicosUnidos} (${client?.name || 'Cliente'})`,
            value: valorNumerico,
            date: dataOriginalAgendamento,
            category: 'Serviços'
          });
        }
      }
      handleClose();
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error);
      alert("Ocorreu um erro ao salvar o agendamento.");
    }
  };

  const handlePrepareReschedule = () => {
    if (!editingId) return;
    
    const appPayload = {
      clientId: formData.clientId,
      service: formData.services.join(', '),
      price: Number(formData.price || 0),
      date: formData.date,
      time: formData.time,
      status: 'reagendado' as const,
      notes: formData.notes
    };
    
    updateAppointment(editingId, appPayload);
    const oldDateStr = formData.date ? format(parseISO(formData.date), 'dd/MM/yyyy') : 'data anterior';
    const autoNote = `[Origem: Reagendado do dia ${oldDateStr} às ${formData.time}]`;
    setEditingId(null);
    setFormData({ ...formData, status: 'agendado', notes: formData.notes ? `${formData.notes}\n${autoNote}` : autoNote });
    alert("O horário anterior foi marcado como 'Reagendado'. Agora, escolha a nova data e horário para a cliente e clique em 'Agendar'!");
  };

  const getStatusColor = (status: string) => {
    switch (status) { case 'concluido': return 'success'; case 'cancelado': return 'error'; case 'reagendado': return 'warning'; default: return 'primary'; }
  };

  const formatPrice = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
      <Card sx={{ flex: 2 }}>
        <CardHeader 
          title="Agenda Mensal" avatar={<CalendarIcon className="text-primary" />}
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={prevMonth}><ChevronLeft /></IconButton>
              <Typography sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</Typography>
              <IconButton onClick={nextMonth}><ChevronRight /></IconButton>
            </Box>
          }
        />
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => ( <Typography key={d} align="center" variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>{d}</Typography> ))}
            {calendarDays.map((day, i) => {
              const dayApps = appointments.filter(a => { const d = parseDateSafe(a.date); return d && isSameDay(d, day); });
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const validApps = dayApps.filter(a => a.status !== 'cancelado');

              return (
                <Box key={i} onClick={() => setSelectedDate(day)} sx={{ aspectRatio: '1/1', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 1, bgcolor: isSelected ? 'primary.light' : isCurrentMonth ? 'white' : '#fafafa', color: isSelected ? 'white' : 'inherit', '&:hover': { bgcolor: isSelected ? 'primary.light' : '#f0f7ff' } }}>
                  <Typography variant="body2" sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}>{format(day, 'd')}</Typography>
                  {validApps.length > 0 && !isSelected && (
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                      {validApps.slice(0, 3).map((a, idx) => ( <Box key={idx} sx={{ width: 4, height: 4, bgcolor: `${getStatusColor(a.status)}.main`, borderRadius: '50%' }} /> ))}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ flex: 1.5, display: 'flex', flexDirection: 'column' }}>
        <CardHeader title={format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} subheader="Compromissos do dia" action={<Button variant="contained" size="small" startIcon={<Plus />} onClick={() => handleOpenNew(selectedDate)}>Novo</Button>} />
        <Divider />
        <CardContent sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: '600px' }}>
          {selectedDayApps.length === 0 ? ( <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>Nenhum agendamento para este dia.</Typography> ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {selectedDayApps.map((app) => {
                const client = clients.find(c => c.id === app.clientId);
                return (
                  <Box key={app.id} onClick={() => handleEdit(app)} sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, cursor: 'pointer', '&:hover': { borderColor: 'primary.main', bgcolor: '#fafafa' }, borderLeft: '4px solid', borderLeftColor: `${getStatusColor(app.status)}.main` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Clock size={16} /> {app.time}</Typography>
                      <Chip label={app.status} size="small" color={getStatusColor(app.status) as any} variant="outlined" sx={{ textTransform: 'capitalize' }} />
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{client?.name || 'Cliente não encontrado'}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ flex: 1, pr: 2 }}>{app.service}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main', whiteSpace: 'nowrap' }}>{formatPrice(app.price || 0)}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 'bold' }}>{editingId ? 'Detalhes do Atendimento' : 'Novo Agendamento'}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {editingId && (
            <Button variant="outlined" startIcon={<ClipboardList />} fullWidth color={existingAnamnesis ? "success" : "secondary"} onClick={() => { if (!formData.clientId) { alert("Selecione uma cliente primeiro!"); return; } setAnamnesisOpen(true); }} sx={{ mb: 1, fontWeight: 'bold', borderWidth: 2 }}>
              {existingAnamnesis ? 'VER Ficha de Anamnese (Preenchida)' : 'CRIAR Ficha de Anamnese'}
            </Button>
          )}

          <Autocomplete
            options={[...clients].sort((a, b) => (a.name || '').localeCompare(b.name || ''))}
            getOptionLabel={(option) => option.name || ""}
            value={clients.find(c => c.id === formData.clientId) || null}
            onChange={(_, newValue) => { setFormData({ ...formData, clientId: newValue ? newValue.id : '' }); }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => ( <TextField {...params} label="Cliente (digite para buscar)" fullWidth placeholder="Ex: Adriana..." /> )}
            renderOption={(props, option) => {
              const primeiraLetra = option.name ? option.name[0].toUpperCase() : '?';
              return (
                <Box component="li" {...props} key={option.id} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: 'primary.main' }}>{primeiraLetra}</Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{option.name || 'Sem nome'}</Typography>
                    <Typography variant="caption" color="text.secondary">{option.phone || 'Sem telefone'}</Typography>
                  </Box>
                </Box>
              );
            }}
          />
          
          <Autocomplete
            multiple
            options={[...services].sort((a, b) => a.name.localeCompare(b.name))}
            getOptionLabel={(option) => option.name}
            value={services.filter(s => formData.services.includes(s.name))}
            onChange={(_, newValue) => {
              const selectedNames = newValue.map(v => v.name);
              const totalPrice = newValue.reduce((sum, item) => sum + Number(item.price || 0), 0);
              setFormData({ ...formData, services: selectedNames, price: totalPrice });
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => <TextField {...params} label="Serviços (Selecione um ou mais)" placeholder="Ex: Pé e Mão..." />}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip size="small" variant="outlined" label={option.name} {...getTagProps({ index })} />
              ))
            }
          />

          <TextField type="number" label="Valor Total (R$)" fullWidth value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} helperText="Você pode ajustar este valor manualmente, se necessário." />

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
          {editingId ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton color="error" onClick={() => { if(confirm('Excluir?')) { deleteAppointment(editingId); handleClose(); } }}><Trash2 size={20} /></IconButton>
              <Button color="warning" variant="outlined" onClick={handlePrepareReschedule} startIcon={<CalendarClock size={18}/>}>Reagendar</Button>
            </Box>
          ) : <Box />}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={handleClose} color="inherit">Sair</Button>
            <Button onClick={handleSubmit} variant="contained">{editingId ? 'Atualizar' : 'Agendar'}</Button>
          </Box>
        </DialogActions>
      </Dialog>

      {formData.clientId && (
        <AnamnesisForm open={anamnesisOpen} onClose={() => setAnamnesisOpen(false)} clientId={formData.clientId} existingData={existingAnamnesis} />
      )}
    </Box>
  );
}