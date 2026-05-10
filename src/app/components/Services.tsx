import { useState } from 'react';
import { 
  Box, Typography, Button, Card, CardContent, Grid, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  InputAdornment, Chip, Divider 
} from '@mui/material';
import { Plus, Edit, Trash2, Clock, Scissors } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';

export function Services() {
  const { services = [], addService, updateService, deleteService } = useAppData();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', duration: '', category: 'Cabelo' });

  const handleOpen = (service?: any) => {
    if (service) {
      setEditingId(service.id);
      setFormData({ name: service.name, price: service.price.toString(), duration: service.duration.toString(), category: service.category || 'Cabelo' });
    } else {
      setEditingId(null);
      setFormData({ name: '', price: '', duration: '', category: 'Cabelo' });
    }
    setOpen(true);
  };

  const handleSave = () => {
    const data = { ...formData, price: Number(formData.price), duration: Number(formData.duration) };
    if (editingId) {
      updateService(editingId, data);
    } else {
      addService({ id: Date.now().toString(), ...data });
    }
    setOpen(false);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Serviços</Typography>
          <Typography variant="body2" color="text.secondary">Tabela de preços e durações</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus />} onClick={() => handleOpen()} sx={{ borderRadius: 2 }}>
          Novo Serviço
        </Button>
      </Box>

      <Grid container spacing={3}>
        {services.map((s) => (
          <Grid item xs={12} sm={6} lg={4} key={s.id}>
            <Card sx={{ borderRadius: 3, transition: '0.3s', '&:hover': { boxShadow: 4 } }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Chip label={s.category} size="small" color="primary" sx={{ fontWeight: 'bold', opacity: 0.8 }} />
                  <Box>
                    <IconButton size="small" color="primary" onClick={() => handleOpen(s)}><Edit size={18} /></IconButton>
                    <IconButton size="small" color="error" onClick={() => { if(confirm('Excluir?')) deleteService(s.id); }}><Trash2 size={18} /></IconButton>
                  </Box>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>{s.name}</Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                    <Clock size={16} />
                    <Typography variant="body2">{s.duration} min</Typography>
                  </Box>
                  <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    {formatCurrency(s.price)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold' }}>{editingId ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField label="Nome do Serviço" fullWidth value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Preço" fullWidth type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }} />
            <TextField label="Tempo" fullWidth type="number" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} InputProps={{ endAdornment: <InputAdornment position="end">min</InputAdornment> }} />
          </Box>
          <TextField label="Categoria" fullWidth value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}