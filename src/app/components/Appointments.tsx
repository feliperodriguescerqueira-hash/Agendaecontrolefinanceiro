import { useState } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import { Calendar, Plus, Trash2, Edit } from 'lucide-react';
import { useAppData, Appointment } from '../hooks/useAppData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Appointments() {
  const { appointments, clients, services, addAppointment, updateAppointment, deleteAppointment } = useAppData();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    clientId: '',
    service: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    price: 0,
    status: 'agendado' as const,
    notes: '',
  });

  const handleOpen = (appointment?: Appointment) => {
    if (appointment) {
      setEditingId(appointment.id);
      setFormData({
        clientId: appointment.clientId,
        service: appointment.service,
        date: appointment.date,
        time: appointment.time,
        price: appointment.price,
        status: appointment.status,
        notes: appointment.notes || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        clientId: '',
        service: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00',
        price: 0,
        status: 'agendado',
        notes: '',
      });
    }
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
      const adjustedData = {
        ...formData,
        date: new Date(formData.date + 'T00:00:00')
      };
      addAppointment({
        id: Date.now().toString(),
        ...adjustedData,
      });
    }
    handleClose();
  };

  const handleServiceChange = (serviceName: string) => {
    const service = services.find((s) => s.name === serviceName);
    setFormData({
      ...formData,
      service: serviceName,
      price: service?.price || 0,
    });
  };

  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateB.getTime() - dateA.getTime();
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado':
        return 'primary';
      case 'concluido':
        return 'success';
      case 'cancelado':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold mb-1">Agendamentos</h2>
          <p className="text-gray-600">Gerencie os agendamentos do salão</p>
        </div>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => handleOpen()}
        >
          Novo Agendamento
        </Button>
      </div>

      <Card>
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <Calendar size={24} />
              <Typography variant="h6">Lista de Agendamentos</Typography>
            </div>
          }
        />
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhum agendamento cadastrado
            </p>
          ) : (
            <div className="space-y-3">
              {sortedAppointments.map((apt) => {
                const client = clients.find((c) => c.id === apt.clientId);
                return (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-medium">{client?.name || 'Cliente não encontrado'}</p>
                        <Chip
                          label={apt.status}
                          color={getStatusColor(apt.status)}
                          size="small"
                        />
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{apt.service}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(apt.date), "dd/MM/yyyy", { locale: ptBR })} às {apt.time}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          R$ {apt.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="small"
                          onClick={() => handleOpen(apt)}
                          startIcon={<Edit size={16} />}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => deleteAppointment(apt.id)}
                          startIcon={<Trash2 size={16} />}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Editar Agendamento' : 'Novo Agendamento'}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-2">
            <FormControl fullWidth>
              <InputLabel>Cliente</InputLabel>
              <Select
                value={formData.clientId}
                label="Cliente"
                onChange={(e) =>
                  setFormData({ ...formData, clientId: e.target.value })
                }
              >
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Serviço</InputLabel>
              <Select
                value={formData.service}
                label="Serviço"
                onChange={(e) => handleServiceChange(e.target.value)}
              >
                {services.map((service) => (
                  <MenuItem key={service.id} value={service.name}>
                    {service.name} - R$ {service.price.toFixed(2)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Data"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              label="Horário"
              type="time"
              value={formData.time}
              onChange={(e) =>
                setFormData({ ...formData, time: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              label="Preço"
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: parseFloat(e.target.value) })
              }
              InputProps={{
                startAdornment: <span className="mr-2">R$</span>,
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'agendado' | 'concluido' | 'cancelado',
                  })
                }
              >
                <MenuItem value="agendado">Agendado</MenuItem>
                <MenuItem value="concluido">Concluído</MenuItem>
                <MenuItem value="cancelado">Cancelado</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Observações"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.clientId || !formData.service}
          >
            {editingId ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
