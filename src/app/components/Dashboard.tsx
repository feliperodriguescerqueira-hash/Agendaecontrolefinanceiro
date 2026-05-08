import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import { Calendar, DollarSign, Users, Scissors } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Dashboard() {
  const { appointments, clients, finances } = useAppData();

  const today = new Date();
  const todayAppointments = appointments.filter(
    (apt) => format(new Date(apt.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  );

  const thisMonthRevenue = finances
    .filter((f) => {
      const date = new Date(f.date);
      return (
        f.type === 'receita' &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    })
    .reduce((sum, f) => sum + f.value, 0);

  const thisMonthExpenses = finances
    .filter((f) => {
      const date = new Date(f.date);
      return (
        f.type === 'despesa' &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    })
    .reduce((sum, f) => sum + f.value, 0);

  const stats = [
    {
      title: 'Agendamentos Hoje',
      value: todayAppointments.length,
      icon: Calendar,
      color: '#9c27b0',
    },
    {
      title: 'Total de Clientes',
      value: clients.length,
      icon: Users,
      color: '#2196f3',
    },
    {
      title: 'Receita do Mês',
      value: `R$ ${thisMonthRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: '#4caf50',
    },
    {
      title: 'Despesas do Mês',
      value: `R$ ${thisMonthExpenses.toFixed(2)}`,
      icon: Scissors,
      color: '#f44336',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold mb-1">Dashboard</h2>
        <p className="text-gray-600">
          {format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} sx={{ bgcolor: 'white' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">{stat.title}</p>
                  <p className="font-semibold">{stat.value}</p>
                </div>
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <stat.icon size={24} style={{ color: stat.color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title={<Typography variant="h6">Agendamentos de Hoje</Typography>}
          />
          <CardContent>
            {todayAppointments.length === 0 ? (
              <p className="text-gray-500">Nenhum agendamento para hoje</p>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((apt) => {
                  const client = clients.find((c) => c.id === apt.clientId);
                  return (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{client?.name || 'Cliente'}</p>
                        <p className="text-sm text-gray-600">{apt.service}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{apt.time}</p>
                        <p className="text-sm text-gray-600">
                          R$ {apt.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title={<Typography variant="h6">Resumo Financeiro</Typography>}
          />
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-green-700">Receitas do Mês</p>
                  <p className="font-semibold text-green-800">
                    R$ {thisMonthRevenue.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="text-green-600" size={32} />
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm text-red-700">Despesas do Mês</p>
                  <p className="font-semibold text-red-800">
                    R$ {thisMonthExpenses.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="text-red-600" size={32} />
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-blue-700">Saldo do Mês</p>
                  <p className="font-semibold text-blue-800">
                    R$ {(thisMonthRevenue - thisMonthExpenses).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="text-blue-600" size={32} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
