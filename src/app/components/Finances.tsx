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
} from '@mui/material';
import { DollarSign, Plus, Trash2, Edit, TrendingUp, TrendingDown, User, Home } from 'lucide-react';
import { useAppData, Finance } from '../hooks/useAppData';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function Finances() {
  const { finances, addFinance, updateFinance, deleteFinance } = useAppData();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'receita' as 'receita' | 'despesa',
    description: '',
    value: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    category: '',
  });

  const handleOpen = (finance?: Finance) => {
    if (finance) {
      setEditingId(finance.id);
      setFormData({
        type: finance.type,
        description: finance.description,
        value: finance.value,
        date: finance.date,
        category: finance.category,
      });
    } else {
      setEditingId(null);
      setFormData({
        type: 'receita',
        description: '',
        value: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
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
    if (!formData.description || !formData.category) return;

    if (editingId) {
      updateFinance(editingId, formData);
    } else {
      addFinance({
        id: Date.now().toString(),
        ...formData,
      });
    }
    handleClose();
  };

  // CÁLCULOS DO MÊS ATUAL
  const thisMonth = new Date();
  const monthStart = startOfMonth(thisMonth);
  const monthEnd = endOfMonth(thisMonth);

  const thisMonthFinances = finances.filter((f) => {
    const date = new Date(f.date);
    return date >= monthStart && date <= monthEnd;
  });

  const totalRevenue = thisMonthFinances
    .filter((f) => f.type === 'receita')
    .reduce((sum, f) => sum + f.value, 0);

  const totalExpenses = thisMonthFinances
    .filter((f) => f.type === 'despesa')
    .reduce((sum, f) => sum + f.value, 0);

  const balance = totalRevenue - totalExpenses;

  // CÁLCULO DAS COMISSÕES (70% Mari / 30% Salão)
  const mariCommission = totalRevenue * 0.70;
  const salonCommission = totalRevenue * 0.30;

  const sortedFinances = [...finances].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const categoryData = finances.reduce((acc, f) => {
    if (!acc[f.category]) {
      acc[f.category] = { receita: 0, despesa: 0 };
    }
    acc[f.category][f.type] += f.value;
    return acc;
  }, {} as Record<string, { receita: number; despesa: number }>);

  const pieData = Object.entries(categoryData).map(([name, values]) => ({
    name,
    value: values.receita + values.despesa,
  }));

  const COLORS = ['#9c27b0', '#2196f3', '#4caf50', '#ff9800', '#f44336', '#00bcd4'];

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date;
  }).reverse();

  const monthlyData = last6Months.map((month) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const monthFinances = finances.filter((f) => {
      const date = new Date(f.date);
      return date >= monthStart && date <= monthEnd;
    });

    const revenue = monthFinances
      .filter((f) => f.type === 'receita')
      .reduce((sum, f) => sum + f.value, 0);

    const expenses = monthFinances
      .filter((f) => f.type === 'despesa')
      .reduce((sum, f) => sum + f.value, 0);

    return {
      month: format(month, 'MMM', { locale: ptBR }),
      receitas: revenue,
      despesas: expenses,
      saldo: revenue - expenses,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold mb-1">Controle Financeiro</h2>
          <p className="text-gray-600">Gerencie receitas, despesas e comissões</p>
        </div>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => handleOpen()}
        >
          Nova Transação
        </Button>
      </div>

      {/* BLOCO 1: RESUMO GERAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card sx={{ bgcolor: 'white' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Faturamento do Mês</p>
                <p className="font-semibold text-green-600">
                  R$ {totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <TrendingUp size={24} className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: 'white' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Despesas do Mês</p>
                <p className="font-semibold text-red-600">
                  R$ {totalExpenses.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <TrendingDown size={24} className="text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: 'white' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Saldo Líquido</p>
                <p className={`font-semibold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  R$ {balance.toFixed(2)}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <DollarSign size={24} className={balance >= 0 ? 'text-blue-600' : 'text-orange-600'} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BLOCO 2: COMISSÕES */}
      <div>
        <h3 className="font-semibold text-gray-700 mb-3">Divisão de Receitas (Mês Atual)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card sx={{ bgcolor: 'white', borderLeft: '4px solid #9c27b0' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Parte da Mari (70%)</p>
                  <p className="font-semibold text-purple-700">
                    R$ {mariCommission.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50">
                  <User size={24} className="text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: 'white', borderLeft: '4px solid #ff9800' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Caixa do Salão (30%)</p>
                  <p className="font-semibold text-orange-600">
                    R$ {salonCommission.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50">
                  <Home size={24} className="text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader
          title={<Typography variant="h6">Visão Geral - Últimos 6 Meses</Typography>}
        />
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="receitas" stroke="#4caf50" name="Faturamento Total" />
              <Line type="monotone" dataKey="despesas" stroke="#f44336" name="Despesas" />
              <Line type="monotone" dataKey="saldo" stroke="#2196f3" name="Saldo" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title={<Typography variant="h6">Despesas por Categoria</Typography>}
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <DollarSign size={24} />
                <Typography variant="h6">Transações Recentes</Typography>
              </div>
            }
          />
          <CardContent>
            {finances.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhuma transação cadastrada
              </p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {sortedFinances.slice(0, 10).map((finance) => (
                  <div
                    key={finance.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{finance.description}</p>
                      <p className="text-sm text-gray-600">
                        {finance.category} • {format(new Date(finance.date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p
                        className={`font-semibold ${
                          finance.type === 'receita' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {finance.type === 'receita' ? '+' : '-'} R${' '}
                        {finance.value.toFixed(2)}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          size="small"
                          onClick={() => handleOpen(finance)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => deleteFinance(finance.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Editar Transação' : 'Nova Transação'}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-2">
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={formData.type}
                label="Tipo"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as 'receita' | 'despesa',
                  })
                }
              >
                <MenuItem value="receita">Receita</MenuItem>
                <MenuItem value="despesa">Despesa</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Descrição"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
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
              placeholder="Ex: Serviços, Produtos, Aluguel, Salários"
              required
            />

            <TextField
              fullWidth
              label="Valor"
              type="number"
              value={formData.value}
              onChange={(e) =>
                setFormData({ ...formData, value: parseFloat(e.target.value) })
              }
              InputProps={{
                startAdornment: <span className="mr-2">R$</span>,
              }}
              required
            />

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
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.description || !formData.category}
          >
            {editingId ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}