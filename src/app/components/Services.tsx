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
  Chip,
} from '@mui/material';
import { Scissors, Plus, Trash2, Edit, Clock } from 'lucide-react';
import { useAppData, Service } from '../hooks/useAppData';

export function Services() {
  const { services, addService, updateService, deleteService } = useAppData();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    duration: 60,
    price: 0,
    category: '',
  });

  const handleOpen = (service?: Service) => {
    if (service) {
      setEditingId(service.id);
      setFormData({
        name: service.name,
        duration: service.duration,
        price: service.price,
        category: service.category,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        duration: 60,
        price: 0,
        category: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.category) return;

    if (editingId) {
      updateService(editingId, formData);
    } else {
      addService({
        id: Date.now().toString(),
        ...formData,
      });
    }
    handleClose();
  };

  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Cabelo: '#9c27b0',
      Unhas: '#f44336',
      Estética: '#2196f3',
    };
    return colors[category] || '#757575';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold mb-1">Serviços</h2>
          <p className="text-gray-600">Gerencie os serviços oferecidos</p>
        </div>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => handleOpen()}
        >
          Novo Serviço
        </Button>
      </div>

      {Object.entries(groupedServices).map(([category, categoryServices]) => (
        <Card key={category}>
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <Scissors size={24} style={{ color: getCategoryColor(category) }} />
                <Typography variant="h6">{category}</Typography>
              </div>
            }
          />
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryServices.map((service) => (
                <div
                  key={service.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium mb-2">{service.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Chip
                          label={service.category}
                          size="small"
                          style={{
                            backgroundColor: `${getCategoryColor(service.category)}20`,
                            color: getCategoryColor(service.category),
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Clock size={14} />
                        <span>{service.duration} minutos</span>
                      </div>
                      <p className="font-semibold text-green-600">
                        R$ {service.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="small"
                      onClick={() => handleOpen(service)}
                      startIcon={<Edit size={16} />}
                    >
                      Editar
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => deleteService(service.id)}
                      startIcon={<Trash2 size={16} />}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Editar Serviço' : 'Novo Serviço'}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-2">
            <TextField
              fullWidth
              label="Nome do Serviço"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <TextField
              fullWidth
              label="Categoria"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              placeholder="Ex: Cabelo, Unhas, Estética"
              required
            />
            <TextField
              fullWidth
              label="Duração (minutos)"
              type="number"
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: parseInt(e.target.value) })
              }
              required
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
              required
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || !formData.category}
          >
            {editingId ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
