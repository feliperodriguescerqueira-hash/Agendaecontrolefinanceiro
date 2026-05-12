import { useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Chip, InputAdornment, TextField, Avatar } from '@mui/material';
import { Search, FileSignature, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AnamnesisForm } from './AnamnesisForm';

export function AnamnesisList() {
  const { anamnesis, clients } = useAppData();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Controle de abertura da ficha
  const [openForm, setOpenForm] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');

  // Cruzar os dados das fichas com os nomes das clientes e filtrar pela busca
  const filteredFichas = anamnesis.map(ficha => {
    const client = clients.find(c => c.id === ficha.client_id);
    return { ...ficha, clientName: client?.name || 'Cliente Excluído' };
  }).filter(ficha => 
    ficha.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenFicha = (clientId: string) => {
    setSelectedClientId(clientId);
    setOpenForm(true);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileSignature size={28} color="#e91e63" /> Fichas Clínicas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Consulte o histórico de anamnese das suas pacientes
          </Typography>
        </Box>

        <TextField
          placeholder="Buscar por paciente..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: { xs: '100%', md: 300 }, bgcolor: 'white' }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment>,
          }}
        />
      </Box>

      {filteredFichas.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="text.secondary">Nenhuma ficha encontrada.</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Para criar uma nova ficha, abra o agendamento da cliente e clique em "Criar Ficha de Anamnese".
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredFichas.map((ficha) => {
            // Verifica se a ficha está assinada
            const isAssinada = ficha.assinatura_paciente && ficha.assinatura_profissional && ficha.termo_aceito;

            return (
              <Grid item xs={12} sm={6} md={4} key={ficha.id}>
                <Card sx={{ borderRadius: 3, borderTop: '4px solid', borderColor: isAssinada ? 'success.main' : 'warning.main', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 } }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 'bold' }}>
                        {ficha.clientName[0]}
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                        {ficha.clientName}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                        <Calendar size={16} /> 
                        Última visita: {format(parseISO(ficha.data_atendimento), "dd/MM/yyyy", { locale: ptBR })}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        {isAssinada ? (
                          <Chip label="Assinada e Validada" size="small" color="success" icon={<CheckCircle2 size={14} />} sx={{ fontWeight: 'bold' }} />
                        ) : (
                          <Chip label="Pendente Assinatura" size="small" color="warning" icon={<AlertCircle size={14} />} />
                        )}
                      </Box>
                    </Box>

                    <Button 
                      variant="contained" 
                      fullWidth 
                      color="primary" 
                      onClick={() => handleOpenFicha(ficha.client_id)}
                      sx={{ borderRadius: 2 }}
                    >
                      Abrir Prontuário
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Reutilizando o componente da Ficha para exibição/edição */}
      {selectedClientId && (
        <AnamnesisForm 
          open={openForm} 
          onClose={() => setOpenForm(false)} 
          clientId={selectedClientId} 
          existingData={anamnesis.find(a => a.client_id === selectedClientId)}
        />
      )}
    </Box>
  );
}