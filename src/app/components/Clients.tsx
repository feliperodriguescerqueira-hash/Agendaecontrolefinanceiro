import { useState, useMemo } from 'react';
import { 
  Box, Typography, Button, Card, CardContent, Grid, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  Checkbox, Tooltip, Avatar, Chip
} from '@mui/material';
import { Plus, Edit, Trash2, Phone, Mail, UploadCloud, CheckSquare } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';

export function Clients() {
  const { clients = [], addClient, updateClient, deleteClient, deleteMultipleClients } = useAppData();
  
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', notes: '' });
  
  // Controle de Seleção em Massa
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 🔤 ORGANIZAR EM ORDEM ALFABÉTICA (A-Z)
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => a.name.localeCompare(b.name));
  }, [clients]);

  // Funções de Seleção
  const handleSelectAll = () => {
    if (selectedIds.length === sortedClients.length) {
      setSelectedIds([]); // Desmarca todos
    } else {
      setSelectedIds(sortedClients.map(c => c.id)); // Marca todos
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Excluir em Massa
  const handleDeleteSelected = async () => {
    if (confirm(`⚠️ Tem certeza que deseja excluir ${selectedIds.length} clientes? Essa ação não pode ser desfeita.`)) {
      await deleteMultipleClients(selectedIds);
      setSelectedIds([]); // Limpa a seleção após apagar
    }
  };

  const handleOpen = (client?: any) => {
    if (client) {
      setEditingId(client.id);
      setFormData({ name: client.name, phone: client.phone || '', email: client.email || '', notes: client.notes || '' });
    } else {
      setEditingId(null);
      setFormData({ name: '', phone: '', email: '', notes: '' });
    }
    setOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      updateClient(editingId, formData);
    } else {
      addClient({ id: Date.now().toString(), ...formData });
    }
    setOpen(false);
  };

  // Importação de CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [name, phone, email] = line.split(',');
        if (name) {
          await addClient({ id: Date.now().toString() + i, name, phone: phone || '', email: email || '' });
        }
      }
      alert('Importação concluída!');
    };
    reader.readAsText(file);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      
      {/* CABEÇALHO */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Clientes</Typography>
          <Typography variant="body2" color="text.secondary">Total: {clients.length} cadastrados</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button component="label" variant="outlined" startIcon={<UploadCloud />} sx={{ borderRadius: 2 }}>
            Importar CSV
            <input type="file" hidden accept=".csv" onChange={handleFileUpload} />
          </Button>
          <Button variant="contained" startIcon={<Plus />} onClick={() => handleOpen()} sx={{ borderRadius: 2 }}>
            Novo Cliente
          </Button>
        </Box>
      </Box>

      {/* BARRA DE AÇÕES EM MASSA (Só aparece se tiver gente cadastrada) */}
      {sortedClients.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, p: 1, bgcolor: selectedIds.length > 0 ? 'primary.light' : 'white', borderRadius: 2, border: '1px solid #e0e0e0', transition: 'all 0.3s' }}>
          <Checkbox 
            checked={selectedIds.length === sortedClients.length && sortedClients.length > 0}
            indeterminate={selectedIds.length > 0 && selectedIds.length < sortedClients.length}
            onChange={handleSelectAll}
            color="primary"
          />
          <Typography sx={{ flexGrow: 1, fontWeight: selectedIds.length > 0 ? 'bold' : 'normal', color: selectedIds.length > 0 ? 'primary.dark' : 'text.primary' }}>
            {selectedIds.length > 0 ? `${selectedIds.length} selecionados` : 'Selecionar Todos'}
          </Typography>
          
          {selectedIds.length > 0 && (
            <Button variant="contained" color="error" startIcon={<Trash2 />} onClick={handleDeleteSelected} sx={{ borderRadius: 2 }}>
              Excluir Selecionados
            </Button>
          )}
        </Box>
      )}

      {/* LISTA DE CLIENTES EM CARDS */}
      <Grid container spacing={3}>
        {sortedClients.map((client) => (
          <Grid item xs={12} sm={6} lg={4} xl={3} key={client.id}>
            <Card sx={{ 
              borderRadius: 3, 
              border: selectedIds.includes(client.id) ? '2px solid #e91e63' : '1px solid transparent',
              transition: 'all 0.2s', 
              '&:hover': { boxShadow: 4 } 
            }}>
              <CardContent sx={{ p: 2, position: 'relative' }}>
                
                {/* CHECKBOX INDIVIDUAL */}
                <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                  <Checkbox 
                    checked={selectedIds.includes(client.id)} 
                    onChange={() => handleSelectOne(client.id)}
                    color="primary"
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, mt: 1 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 'bold' }}>
                    {client.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ pr: 4 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>{client.name}</Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, color: 'text.secondary', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone size={16} />
                    <Typography variant="body2">{client.phone || 'Sem telefone'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Mail size={16} />
                    <Typography variant="body2" noWrap>{client.email || 'Sem e-mail'}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, borderTop: '1px solid #f0f0f0', pt: 2 }}>
                  <Tooltip title="Editar">
                    <IconButton size="small" color="primary" onClick={() => handleOpen(client)}><Edit size={18} /></IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir">
                    <IconButton size="small" color="error" onClick={() => { if(confirm('Excluir cliente?')) deleteClient(client.id); }}><Trash2 size={18} /></IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold' }}>{editingId ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField label="Nome Completo" fullWidth value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          <TextField label="WhatsApp / Telefone" fullWidth value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
          <TextField label="E-mail" fullWidth value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          <TextField label="Observações (Alergias, preferências...)" fullWidth multiline rows={3} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}