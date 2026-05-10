import { useState, useRef, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Grid,
  Divider,
  Avatar
} from '@mui/material';
import { 
  UserPlus, 
  Upload, 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  FileText 
} from 'lucide-react';
import { useAppData } from '../hooks/useAppData';

export function Clients() {
  const { clients = [], addClient, updateClient, deleteClient } = useAppData();
  
  // Referência para o input de arquivo escondido
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  // --- FILTRO DE PESQUISA ---
  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    const lowerTerm = searchTerm.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(lowerTerm) || 
      (c.phone && c.phone.includes(lowerTerm))
    );
  }, [clients, searchTerm]);

  // --- AÇÕES DO MODAL MANUAL ---
  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ name: '', phone: '', email: '', notes: '' });
    setOpenModal(true);
  };

  const handleEdit = (client: any) => {
    setEditingId(client.id);
    setFormData({
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      notes: client.notes || ''
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => setOpenModal(false);

  const handleSubmit = async () => {
    if (!formData.name) {
      alert("O nome do cliente é obrigatório!");
      return;
    }

    if (editingId) {
      await updateClient(editingId, formData);
    } else {
      await addClient({
        id: Date.now().toString(),
        ...formData
      });
    }
    handleCloseModal();
  };

  // --- IMPORTAÇÃO DE CSV ---
  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      // Separa por linhas e tira linhas em branco
      const lines = text.split('\n').filter(line => line.trim() !== '');
      let importedCount = 0;

      // Pula a linha 0 (Cabeçalho) e itera o resto
      for (let i = 1; i < lines.length; i++) {
        // Divide as colunas por vírgula ou ponto e vírgula
        const columns = lines[i].split(/[;,]/);

        if (columns.length >= 1 && columns[0].trim() !== '') {
          const newClient = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            name: columns[0]?.trim() || '',
            phone: columns[1]?.trim() || '',
            email: columns[2]?.trim() || '',
            notes: columns[3]?.trim() || ''
          };
          
          await addClient(newClient);
          importedCount++;
        }
      }

      alert(`✅ SUCESSO! ${importedCount} clientes foram importados para a nuvem.`);
      
      // Limpa o input para permitir importar o mesmo arquivo de novo se necessário
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      
      {/* CABEÇALHO COM BOTÕES */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Clientes</Typography>
          <Typography variant="body2" color="text.secondary">Gerencie sua base de contatos</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Input escondido para o arquivo CSV */}
          <input 
            type="file" 
            accept=".csv" 
            style={{ display: 'none' }} 
            ref={fileInputRef} 
            onChange={handleFileUpload}
          />
          
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<Upload size={18} />}
            onClick={handleTriggerUpload}
            sx={{ bgcolor: 'white' }}
          >
            Importar CSV
          </Button>
          
          <Button 
            variant="contained" 
            startIcon={<UserPlus size={18} />}
            onClick={handleOpenNew}
          >
            Novo Cliente
          </Button>
        </Box>
      </Box>

      {/* BARRA DE PESQUISA */}
      <Card>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <TextField
            fullWidth
            placeholder="Pesquisar cliente por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} className="text-gray-400" />
                </InputAdornment>
              ),
            }}
            size="small"
          />
        </CardContent>
      </Card>

      {/* LISTA DE CLIENTES (GRID) */}
      {filteredClients.length === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center', bgcolor: 'transparent', boxShadow: 'none' }}>
          <UserPlus size={48} className="text-gray-300" style={{ margin: '0 auto', marginBottom: 16 }} />
          <Typography variant="h6" color="text.secondary">Nenhum cliente encontrado</Typography>
          <Typography variant="body2" color="text.secondary">
            Clique em "Novo Cliente" ou importe uma lista CSV para começar.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {filteredClients.map((client) => (
            <Grid item xs={12} sm={6} md={4} key={client.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', '&:hover': { boxShadow: 3 } }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 'bold' }}>
                        {client.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {client.name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" color="primary" onClick={() => handleEdit(client)}>
                        <Edit size={16} />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => { if(confirm('Excluir este cliente?')) deleteClient(client.id); }}>
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                      <Phone size={16} />
                      <Typography variant="body2">{client.phone || 'Sem telefone'}</Typography>
                    </Box>
                    
                    {client.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                        <Mail size={16} />
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{client.email}</Typography>
                      </Box>
                    )}

                    {client.notes && (
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, color: 'text.secondary', mt: 1 }}>
                        <FileText size={16} style={{ marginTop: 2 }} />
                        <Typography variant="body2" sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
                          {client.notes}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* MODAL DE ADICIONAR / EDITAR CLIENTE */}
      <Dialog open={openModal} onClose={handleCloseModal} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {editingId ? 'Editar Cliente' : 'Novo Cliente'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField 
            label="Nome Completo *" 
            fullWidth 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            autoFocus
          />
          <TextField 
            label="Telefone (WhatsApp)" 
            fullWidth 
            placeholder="(11) 99999-9999"
            value={formData.phone} 
            onChange={(e) => setFormData({...formData, phone: e.target.value})} 
          />
          <TextField 
            label="E-mail" 
            type="email"
            fullWidth 
            placeholder="cliente@email.com"
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
          />
          <TextField 
            label="Observações / Restrições" 
            fullWidth 
            multiline 
            rows={3} 
            placeholder="Ex: Alérgica a amônia, prefere horários na parte da tarde..."
            value={formData.notes} 
            onChange={(e) => setFormData({...formData, notes: e.target.value})} 
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseModal} color="inherit">Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingId ? 'Atualizar' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}