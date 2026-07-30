import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  IconButton,
  Grid,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem
} from '@mui/material';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, Wallet, Plus, Trash2 } from 'lucide-react';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';

export function Finances() {
  const { finances = [], addFinance, deleteFinance } = useAppData();
  const [currentDate, setCurrentDate] = useState(new Date());

  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'receita',
    description: '',
    value: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category: 'Serviços'
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const parseDateSafe = (dateValue: any) => {
    try {
      if (!dateValue) return null;
      if (dateValue instanceof Date) return dateValue;
      return parseISO(String(dateValue).split('T')[0]);
    } catch (e) { return null; }
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => {
    setOpenModal(false);
    setFormData({
      type: 'receita',
      description: '',
      value: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      category: 'Serviços'
    });
  };

  const handleSubmit = async () => {
    if (!formData.description || !formData.value) return;

    try {
      await addFinance({
        id: crypto.randomUUID(),
        type: formData.type as 'receita' | 'despesa',
        description: formData.description,
        value: Number(formData.value),
        date: formData.date,
        category: formData.category
      });
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
    }
  };

  const monthlyFinances = useMemo(() => {
    return finances.filter(f => {
      const d = parseDateSafe(f.date);
      return d && isSameMonth(d, currentDate);
    });
  }, [finances, currentDate]);

  const { receitaMensal, despesaMensal } = useMemo(() => {
    return monthlyFinances.reduce((acc, curr) => {
      if (curr.type === 'receita') acc.receitaMensal += curr.value;
      if (curr.type === 'despesa') acc.despesaMensal += curr.value;
      return acc;
    }, { receitaMensal: 0, despesaMensal: 0 });
  }, [monthlyFinances]);
  
  const saldoMensal = receitaMensal - despesaMensal;

  const { receitaSemanal } = useMemo(() => {
    const startWeek = startOfWeek(new Date());
    const endWeek = endOfWeek(new Date());
    
    const weeklyFins = finances.filter(f => {
      const d = parseDateSafe(f.date);
      return d && d >= startWeek && d <= endWeek;
    });

    return weeklyFins.reduce((acc, curr) => {
      if (curr.type === 'receita') acc.receitaSemanal += curr.value;
      return acc;
    }, { receitaSemanal: 0 });
  }, [finances]);

  const TAXA_COMISSAO = 0.5; 
  const comissaoSemanal = receitaSemanal * TAXA_COMISSAO;

  const chartData = useMemo(() => {
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
    });

    return daysInMonth.map(day => {
      const dayFins = monthlyFinances.filter(f => {
        const d = parseDateSafe(f.date);
        return d && isSameDay(d, day);
      });

      const receitas = dayFins.filter(f => f.type === 'receita').reduce((sum, f) => sum + f.value, 0);
      const despesas = dayFins.filter(f => f.type === 'despesa').reduce((sum, f) => sum + f.value, 0);

      return {
        dia: format(day, 'dd/MM'),
        Receitas: receitas,
        Despesas: despesas
      };
    });
  }, [monthlyFinances, currentDate]);

  const recentTransactions = [...monthlyFinances].sort((a, b) => {
    const dateA = parseDateSafe(a.date)?.getTime() || 0;
    const dateB = parseDateSafe(b.date)?.getTime() || 0;
    return dateB - dateA;
  });

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      
      {/* CABEÇALHO */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Dashboard Financeiro</Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'white', p: 0.5, borderRadius: 2, boxShadow: 1 }}>
            <IconButton onClick={prevMonth} size="small"><ChevronLeft /></IconButton>
            <Typography sx={{ textTransform: 'capitalize', fontWeight: 'bold', minWidth: 100, textAlign: 'center' }}>
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </Typography>
            <IconButton onClick={nextMonth} size="small"><ChevronRight /></IconButton>
          </Box>
          <Button variant="contained" startIcon={<Plus />} onClick={handleOpenModal}>
            Nova Transação
          </Button>
        </Box>
      </Box>

      {/* CARDS DE RESUMO - Ajustados para lg={3} (mais espaço em telas médias) */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ bgcolor: '#e8f5e9', border: '1px solid #c8e6c9', height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#4caf50', borderRadius: '50%', color: 'white' }}><TrendingUp /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Receita (Mês)</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>{formatPrice(receitaMensal)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ bgcolor: '#ffebee', border: '1px solid #ffcdd2', height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#f44336', borderRadius: '50%', color: 'white' }}><TrendingDown /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Despesas (Mês)</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#c62828' }}>{formatPrice(despesaMensal)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ bgcolor: '#e3f2fd', border: '1px solid #bbdefb', height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#2196f3', borderRadius: '50%', color: 'white' }}><Wallet /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Saldo Líquido (Mês)</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1565c0' }}>{formatPrice(saldoMensal)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ bgcolor: '#fff3e0', border: '1px solid #ffe0b2', height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#ff9800', borderRadius: '50%', color: 'white' }}><DollarSign /></Box>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>Comissão (Semana)</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#e65100' }}>{formatPrice(comissaoSemanal)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ÁREA INFERIOR - Quebra automática em telas menores (lg em vez de md) */}
      <Grid container spacing={3}>
        
        {/* Gráfico */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ p: 2, height: '100%', minHeight: 400 }}>
            <CardHeader title="Visão Diária" subheader="Composição das receitas e despesas ao longo do mês" sx={{ p: 1, pb: 2 }} />
            <Box sx={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => `R$ ${value}`} tick={{ fontSize: 12 }} width={70} />
                  <ChartTooltip formatter={(value: number) => formatPrice(value)} cursor={{ fill: '#f5f5f5' }} />
                  <Legend />
                  <Bar dataKey="Receitas" fill="#4caf50" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesas" fill="#f44336" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        {/* Transações Recentes - Totalmente refeito para evitar atropelamento de texto */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 400 }}>
            <CardHeader title="Transações do Mês" subheader="Lista de receitas e despesas" sx={{ p: 2, pb: 1 }} />
            <Divider />
            <CardContent sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 400, p: 0, '&:last-child': { pb: 0 } }}>
              {recentTransactions.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ p: 4 }}>
                  Nenhuma transação registrada neste mês.
                </Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {recentTransactions.map((t) => (
                    <Box key={t.id}>
                      <ListItem sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, py: 2, px: 3 }}>
                        
                        {/* Lado Esquerdo do Item: Textos */}
                        <Box sx={{ flex: '1 1 auto', minWidth: '150px' }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', wordBreak: 'break-word' }}>
                            {t.description}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {`${t.category} • ${format(parseISO(t.date), 'dd/MM/yyyy')}`}
                          </Typography>
                        </Box>

                        {/* Lado Direito do Item: Valor e Lixeira */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: t.type === 'receita' ? 'success.main' : 'error.main' }}>
                            {t.type === 'receita' ? '+' : '-'} {formatPrice(t.value)}
                          </Typography>
                          <IconButton edge="end" size="small" color="error" onClick={() => { if(confirm('Excluir transação?')) deleteFinance(t.id).catch((error) => console.error('Erro ao excluir transação:', error)); }}>
                            <Trash2 size={18} />
                          </IconButton>
                        </Box>

                      </ListItem>
                      <Divider component="li" />
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* DIÁLOGO: NOVA TRANSAÇÃO */}
      <Dialog open={openModal} onClose={handleCloseModal} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Nova Transação</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          
          <FormControl fullWidth>
            <InputLabel>Tipo</InputLabel>
            <Select value={formData.type} label="Tipo" onChange={(e) => setFormData({...formData, type: e.target.value})}>
              <MenuItem value="receita">Receita (Entrada)</MenuItem>
              <MenuItem value="despesa">Despesa (Saída)</MenuItem>
            </Select>
          </FormControl>

          <TextField label="Descrição" fullWidth placeholder="Ex: Compra de Shampoo" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          <TextField type="number" label="Valor (R$)" fullWidth value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})} />
          <TextField type="date" label="Data" fullWidth InputLabelProps={{ shrink: true }} value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />

          <FormControl fullWidth>
            <InputLabel>Categoria</InputLabel>
            <Select value={formData.category} label="Categoria" onChange={(e) => setFormData({...formData, category: e.target.value})}>
              <MenuItem value="Serviços">Serviços</MenuItem>
              <MenuItem value="Produtos">Produtos</MenuItem>
              <MenuItem value="Contas Fixas">Contas Fixas</MenuItem>
              <MenuItem value="Impostos">Impostos</MenuItem>
              <MenuItem value="Outros">Outros</MenuItem>
            </Select>
          </FormControl>

        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseModal} color="inherit">Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}