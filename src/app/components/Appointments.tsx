import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Box,
  Divider,
  IconButton
} from '@mui/material';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, ClipboardList, Trash2, CalendarClock } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Appointments() {
  const { appointments = [], clients = [], services = [], addAppointment, updateAppointment, deleteAppointment } = useAppData();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    clientId: '',
    service: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    notes: '',
    status: 'agendado'
  });

  const parseDateSafe = (dateValue: any) => {
    try {
      if (!dateValue) return null;
      if (dateValue instanceof Date) return dateValue;
      return parseISO(String(dateValue).split('T')[0]);
    } catch (e) { return null; }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    return eachDayOfInterval({
      start: startOfWeek(monthStart),
      end: endOfWeek(endOfMonth(monthStart)),
    });
  }, [currentDate]);

  const selectedDayApps = useMemo(() => {
    return appointments
      .filter(a => {
        const d = parseDateSafe(a.date);
        return d && isSameDay(d, selectedDate);
      })
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [appointments, selectedDate]);

  const handleOpenNew = (day: Date) => {
    setEditingId(null);
    setFormData({
      clientId: '',
      service: '',
      date: format(day, 'yyyy-MM-dd'),
      time: '09:00',
      notes: '',
      status: 'agendado'
    });
    setOpen(true);
  };

  const handleEdit = (app: any) => {
    setEditingId(app.id);
    setFormData({
      clientId: app.clientId,
      service: app.service,
      date: app.date,
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

  const handleSubmit = () => {
    if (!formData.clientId || !formData.service) return;
    
    if (editingId) {
      updateAppointment(editingId, formData);
    } else {
      addAppointment({
        id: Date.now().toString(),
        ...formData,
        price: services.find(s => s.name === formData.service)?.price || 0
      });
    }
    handleClose();
  };

  // FUNÇÃO MÁGICA DE REAGENDAMENTO
  const handlePrepareReschedule = () => {
    if (!editingId) return;

    // 1. Atualiza o agendamento ANTIGO para o status "reagendado" no banco de dados
    updateAppointment(editingId, { ...formData, status: 'reagendado' });

    // 2. Prepara o texto da observação automática
    const oldDateStr = formData.date ? format(parseISO(formData.date), 'dd/MM/yyyy') : 'data anterior';
    const autoNote = `[Origem: Reagendado do dia ${oldDateStr} às ${formData.time}]`;

    // 3. Transforma a janela atual num "Novo Agendamento" preenchido
    setEditingId(null); // Tira do modo edição (para criar um novo ao salvar)
    setFormData({
      ...formData,
      status: 'agendado', // O novo volta a ser "agendado"
      notes: formData.notes ? `${formData.notes}\n${autoNote}` : autoNote
    });

    // Dá um feedback visual para a Mari
    alert("O horário anterior foi marcado como 'Reagendado'. Agora, escolha a nova data e horário para a cliente e clique em 'Agendar'!");
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
    <Box sx={{ p: { xs: 1, md: 3 }, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
      
      <Card sx={{ flex: 2 }}>
        <CardHeader 
          title="Agenda Mensal" 
          avatar={<CalendarIcon className="text-primary" />}
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={prevMonth}><ChevronLeft /></IconButton>
              <Typography sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}>
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </Typography>
              <IconButton onClick={nextMonth}><ChevronRight /></IconButton>
            </Box>
          }
        />
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
              <Typography key={d} align="center" variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>{d}</Typography>
            ))}
            
            {calendarDays.map((day, i) => {
              const dayApps = appointments.filter(a => {
                const d = parseDateSafe(a.date);
                return d && isSameDay(d, day);
              });
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentDate);
              
              // Mostra pontinhos para os agendamentos (ignora os cancelados no pontinho)
              const validApps = dayApps.filter(a => a.status !== 'cancelado');

              return (
                <Box 
                  key={i} 
                  onClick={() => setSelectedDate(day)}
                  sx={{ 
                    aspectRatio: '1/1', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 1,
                    bgcolor: isSelected ? 'primary.light' : isCurrentMonth ? 'white' : '#fafafa',
                    color: isSelected ? 'white' : 'inherit',
                    position: 'relative',
                    '&:hover': { bgcolor: isSelected ? 'primary.light' : '#f0f7ff' }
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
                    {format(day, 'd')}
                  </Typography>
                  {validApps.length > 0 && !isSelected && (
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                      {validApps.slice(0, 3).map((a, idx) => (
                        <Box key={idx} sx={{ width: 4, height: 4, bgcolor: `${getStatusColor(a.status)}.main`, borderRadius: '50%' }} />
                      ))}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ flex: 1.5, display: 'flex', flexDirection: 'column' }}>
        <CardHeader 
          title={format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          subheader="Compromissos do dia"
          action={
            <Button variant="contained" size="small" startIcon={<Plus />} onClick={() => handleOpenNew(selectedDate)}>
              Novo
            </Button>
          }
        />
        <Divider />
        <CardContent sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: '600px' }}>
          {selectedDayApps.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
              Nenhum agendamento para este dia.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {selectedDayApps.map((app) => {
                const client = clients.find(c => c.id === app.clientId);
                return (
                  <Box 
                    key={app.id} 
                    onClick={() => handleEdit(app)}
                    sx={{ 
                      p: 2, border: '1px solid #eee', borderRadius: 2, cursor: 'pointer',
                      '&:hover': { borderColor: 'primary.main', bgcolor: '#fafafa' },
                      borderLeft: '4px solid',
                      borderLeftColor: `${getStatusColor(app.status)}.main`
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Clock size={16} /> {app.time}
                      </Typography>
                      <Chip label={app.status} size="small" color={getStatusColor(app.status)} variant="outlined" sx={{ textTransform: 'capitalize' }} />
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{client?.name || 'Cliente não encontrado'}</Typography>
                    <Typography variant="body2" color="text.secondary">{app.service}</Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {editingId ? 'Detalhes do Atendimento' : 'Novo Agendamento'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          
          {editingId && (
            <Button 
              variant="outlined" 
              startIcon={<ClipboardList />} 
              fullWidth
              onClick={() => alert('Ficha de Anamnese será integrada aqui!')}
              sx={{ mb: 1 }}
            >
              Ficha de Anamnese
            </Button>
          )}

          <FormControl fullWidth>
            <InputLabel>Cliente</InputLabel>
            <Select
              value={formData.clientId}
              label="Cliente"
              onChange={(e) => setFormData({...formData, clientId: e.target.value})}
            >
              {clients.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel>Serviço</InputLabel>
            <Select
              value={formData.service}
              label="Serviço"
              onChange={(e) => setFormData({...formData, service: e.target.value})}
            >
              {services.map(s => <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField type="date" label="Data" fullWidth InputLabelProps={{ shrink: true }} value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            <TextField type="time" label="Hora" fullWidth InputLabelProps={{ shrink: true }} value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
          </Box>

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              label="Status"
              onChange={(e) => setFormData({...formData, status: e.target.value})}
            >
              <MenuItem value="agendado">Agendado</MenuItem>
              <MenuItem value="concluido">Concluído</MenuItem>
              <MenuItem value="reagendado">Reagendado</MenuItem>
              <MenuItem value="cancelado">Cancelado</MenuItem>
            </Select>
          </FormControl>

          <TextField label="Observações" fullWidth multiline rows={3} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
        </DialogContent>
        <DialogActions sx={{ p: 2, flexWrap: 'wrap', gap: 1, justifyContent: 'space-between' }}>
          {/* BOTÕES DO LADO ESQUERDO: EXCLUIR E REAGENDAR */}
          {editingId ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton color="error" onClick={() => { if(confirm('Excluir permanentemente?')) { deleteAppointment(editingId); handleClose(); } }} title="Excluir">
                <Trash2 size={20} />
              </IconButton>
              <Button color="warning" variant="outlined" onClick={handlePrepareReschedule} startIcon={<CalendarClock size={18}/>}>
                Reagendar
              </Button>
            </Box>
          ) : <Box />}
          
          {/* BOTÕES DO LADO DIREITO: SAIR E SALVAR */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={handleClose} color="inherit">Sair</Button>
            <Button onClick={handleSubmit} variant="contained">{editingId ? 'Atualizar' : 'Agendar'}</Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}