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
} from '@mui/material';
import { Users, Plus, Trash2, Edit, Phone, Mail } from 'lucide-react';
import { useAppData, Client } from '../hooks/useAppData';

export function Clients() {
  const { clients, addClient, updateClient, deleteClient } = useAppData();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  const handleOpen = (client?: Client) => {
    if (client) {
      setEditingId(client.id);
      setFormData({
        name: client.name,
        phone: client.phone,
        email: client.email,
        notes: client.notes || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
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
    if (!formData.name || !formData.phone) return;

    if (editingId) {
      updateClient(editingId, formData);
    } else {
      addClient({
        id: Date.now().toString(),
        ...formData,
      });
    }
    handleClose();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold mb-1">Clientes</h2>
          <p className="text-gray-600">Gerencie sua base de clientes</p>
        </div>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => handleOpen()}
        >
          Novo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <Users size={24} />
              <Typography variant="h6">Lista de Clientes ({clients.length})</Typography>
            </div>
          }
        />
        <CardContent>
          {clients.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhum cliente cadastrado
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium mb-1">{client.name}</h3>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone size={14} />
                          <span>{client.phone}</span>
                        </div>
                        {client.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail size={14} />
                            <span>{client.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {client.notes && (
                    <p className="text-sm text-gray-600 mb-3">{client.notes}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="small"
                      onClick={() => handleOpen(client)}
                      startIcon={<Edit size={16} />}
                    >
                      Editar
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => deleteClient(client.id)}
                      startIcon={<Trash2 size={16} />}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Editar Cliente' : 'Novo Cliente'}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-2">
            <TextField
              fullWidth
              label="Nome"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <TextField
              fullWidth
              label="Telefone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
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
            disabled={!formData.name || !formData.phone}
          >
            {editingId ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
