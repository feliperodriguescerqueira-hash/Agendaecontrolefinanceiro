// ============================================================
// TELA DE CLIENTES — Studio Mari Moraes (COM FIDELIDADE + NPS)
// Arquivo: src/app/components/Clients.tsx
// 
// DIFF em relação ao original:
//  + Import de useLoyalty (fetchLoyaltyData no mount)
//  + Botão "Ver Jornada" no card do cliente
//  + Drawer lateral com LoyaltyCard + NpsPanel
// ============================================================

import { useState, useMemo, useEffect } from 'react';
import { 
  Box, Typography, Button, Card, CardContent, Grid, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  Checkbox, Tooltip, Avatar, Chip, Drawer, Divider,
} from '@mui/material';
import { Plus, Edit, Trash2, Phone, Mail, UploadCloud, Star, X } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useLoyalty } from '../hooks/useLoyalty';
import { LoyaltyCard } from './LoyaltyCard';
import { NpsPanel } from './NpsPanel';

export function Clients() {
  const { clients = [], addClient, updateClient, deleteClient, deleteMultipleClients } = useAppData();
  const { fetchLoyaltyData, getClientProgress } = useLoyalty();
  
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', notes: '' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ── ESTADO DO DRAWER DE FIDELIDADE ─────────────────────────
  const [loyaltyDrawerOpen, setLoyaltyDrawerOpen] = useState(false);
  const [activeClient, setActiveClient] = useState<{ id: string; name: string; phone: string } | null>(null);

  // Busca os dados de fidelidade ao montar a tela
  useEffect(() => {
    fetchLoyaltyData();
  }, [fetchLoyaltyData]);

  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => a.name.localeCompare(b.name));
  }, [clients]);

  const handleSelectAll = () => {
    if (selectedIds.length === sortedClients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedClients.map(c => c.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteSelected = async () => {
    if (confirm(`⚠️ Tem certeza que deseja excluir ${selectedIds.length} clientes? Essa ação não pode ser desfeita.`)) {
      try {
        await deleteMultipleClients(selectedIds);
        setSelectedIds([]);
      } catch (error) {
        console.error('Erro ao excluir clientes selecionados:', error);
      }
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

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateClient(editingId, formData);
      } else {
        await addClient({ id: crypto.randomUUID(), ...formData });
      }
      setOpen(false);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    }
  };

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
          try {
            await addClient({ id: crypto.randomUUID(), name, phone: phone || '', email: email || '' });
          } catch (error) {
            console.error(`Erro ao importar linha ${i + 1} do CSV:`, error);
          }
        }
      }
      alert('Importação concluída!');
    };
    reader.readAsText(file);
  };

  // ── Abre o Drawer de Fidelidade/NPS para um cliente ────────
  const handleOpenLoyalty = (client: { id: string; name: string; phone: string }) => {
    setActiveClient(client);
    setLoyaltyDrawerOpen(true);
  };

  // ── Pequeno indicador de status no card ───────────────────
  const getLoyaltyChip = (clientId: string) => {
    const progress = getClientProgress(clientId);
    if (!progress) return null;
    if (progress.current_count >= 4) {
      return <Chip label="🎁 Recompensa!" size="small" sx={{ bgcolor: '#fce4ec', color: '#c2185b', fontWeight: 700, height: 20, fontSize: 11 }} />;
    }
    if (progress.status === 'EXPIRED') {
      return <Chip label="Expirado" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: 11 }} />;
    }
    return <Chip label={`⭐ ${progress.current_count}/4`} size="small" sx={{ bgcolor: '#f3e5f5', color: '#7b1fa2', fontWeight: 600, height: 20, fontSize: 11 }} />;
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

      {/* BARRA DE AÇÕES EM MASSA */}
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

      {/* LISTA DE CLIENTES */}
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
                    {/* ── Indicador de fidelidade no card ── */}
                    <Box sx={{ mt: 0.5 }}>
                      {getLoyaltyChip(client.id)}
                    </Box>
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

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', pt: 2 }}>
                  {/* ── BOTÃO JORNADA (NOVO) ── */}
                  <Tooltip title="Ver Jornada Premium e NPS">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Star size={14} />}
                      onClick={() => handleOpenLoyalty({ id: client.id, name: client.name, phone: client.phone || '' })}
                      sx={{
                        borderRadius: 2,
                        fontSize: 12,
                        color: '#e91e63',
                        borderColor: '#f8bbd0',
                        '&:hover': { bgcolor: '#fce4ec', borderColor: '#e91e63' },
                      }}
                    >
                      Jornada
                    </Button>
                  </Tooltip>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Editar">
                      <IconButton size="small" color="primary" onClick={() => handleOpen(client)}><Edit size={18} /></IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton size="small" color="error" onClick={() => { if(confirm('Excluir cliente?')) deleteClient(client.id).catch((error) => console.error('Erro ao excluir cliente:', error)); }}><Trash2 size={18} /></IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── DRAWER DE FIDELIDADE + NPS ── */}
      <Drawer
        anchor="right"
        open={loyaltyDrawerOpen}
        onClose={() => setLoyaltyDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 440 },
            p: 3,
            borderRadius: '16px 0 0 16px',
          }
        }}
      >
        {activeClient && (
          <>
            {/* Cabeçalho do Drawer */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 'bold', width: 36, height: 36 }}>
                  {activeClient.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {activeClient.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {activeClient.phone || 'Sem telefone'}
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setLoyaltyDrawerOpen(false)} size="small">
                <X size={20} />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 0 }} />

            {/* ── Card de Fidelidade ── */}
            <LoyaltyCard
              clientId={activeClient.id}
              clientName={activeClient.name}
              clientPhone={activeClient.phone}
            />

            <Divider sx={{ my: 1 }} />

            {/* ── Painel NPS ── */}
            <NpsPanel
              clientId={activeClient.id}
              clientName={activeClient.name}
              clientPhone={activeClient.phone}
            />
          </>
        )}
      </Drawer>

      {/* MODAL CADASTRO/EDIÇÃO (inalterado) */}
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
