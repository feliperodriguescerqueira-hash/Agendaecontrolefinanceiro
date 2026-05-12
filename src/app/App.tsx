import { useState, useEffect } from 'react';
import { 
  Box, Typography, IconButton, List, ListItem, ListItemIcon, 
  ListItemText, Tooltip, Divider, Avatar, ListItemButton 
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Menu, LayoutDashboard, Calendar as CalendarIcon, Users, DollarSign, Scissors, ClipboardList } from 'lucide-react';

// Importando as nossas telas
import { Dashboard } from './components/Dashboard';
import { Appointments } from './components/Appointments';
import { Clients } from './components/Clients';
import { Services } from './components/Services';
import { Finances } from './components/Finances';
import { AnamnesisList } from './components/AnamnesisList'; // 👇 Nova Tela Importada
import { useAppData } from './hooks/useAppData';

// 🎨 TEMA ROSA DA MARI
const mariTheme = createTheme({
  palette: {
    primary: { main: '#e91e63', light: '#f8bbd0', dark: '#c2185b', contrastText: '#ffffff' },
    background: { default: '#f4f6f8' },
  },
});

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { fetchData } = useAppData();

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  // --- FUNÇÃO QUE RENDERIZA A TELA ---
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'appointments': return <Appointments />;
      case 'clients': return <Clients />;
      case 'services': return <Services />;
      case 'finances': return <Finances />;
      case 'anamnesis': return <AnamnesisList />; // 👇 Rota da Ficha Adicionada
      default: return <Dashboard />;
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={24} /> },
    { id: 'appointments', label: 'Agenda', icon: <CalendarIcon size={24} /> },
    { id: 'clients', label: 'Clientes', icon: <Users size={24} /> },
    { id: 'services', label: 'Serviços', icon: <Scissors size={24} /> },
    { id: 'anamnesis', label: 'Fichas Clínicas', icon: <ClipboardList size={24} /> }, // 👇 Botão Adicionado no Menu
    { id: 'finances', label: 'Financeiro', icon: <DollarSign size={24} /> },
  ];

  return (
    <ThemeProvider theme={mariTheme}>
      <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: '#f4f6f8' }}>
        
        {/* SIDEBAR */}
        <Box sx={{
            width: isSidebarOpen ? 260 : 72,
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            bgcolor: 'white', 
            borderRight: '1px solid #e0e0e0',
            display: 'flex', flexDirection: 'column', zIndex: 10,
          }}>
          <Box sx={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'space-between' : 'center', px: isSidebarOpen ? 2 : 0, borderBottom: '1px solid #f0f0f0' }}>
            {isSidebarOpen && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}><Scissors size={20} /></Avatar>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main', whiteSpace: 'nowrap' }}>
                  Studio Mari Moraes
                </Typography>
              </Box>
            )}
            <IconButton onClick={() => setIsSidebarOpen(!isSidebarOpen)} color="primary"><Menu size={24} /></IconButton>
          </Box>

          <List sx={{ pt: 2, px: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {menuItems.map((item) => (
              <Tooltip key={item.id} title={!isSidebarOpen ? item.label : ''} placement="right" arrow>
                <ListItem disablePadding>
                  <ListItemButton 
                    onClick={() => setCurrentPage(item.id)} 
                    sx={{ 
                      justifyContent: isSidebarOpen ? 'flex-start' : 'center', borderRadius: 2,
                      bgcolor: currentPage === item.id ? 'primary.main' : 'transparent', 
                      color: currentPage === item.id ? 'white' : 'text.secondary', 
                      '&:hover': { bgcolor: currentPage === item.id ? 'primary.dark' : '#f5f5f5' } 
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 0, mr: isSidebarOpen ? 2 : 0, color: 'inherit' }}>{item.icon}</ListItemIcon>
                    {isSidebarOpen && <ListItemText primary={item.label} />}
                  </ListItemButton>
                </ListItem>
              </Tooltip>
            ))}
          </List>
          
          <Box sx={{ flexGrow: 1 }} />
          <Divider />
          <Box sx={{ p: isSidebarOpen ? 2 : 1, display: 'flex', justifyContent: 'center' }}>
            <Typography variant="caption" color="text.secondary">{isSidebarOpen ? 'Gestão Profissional v1.0' : 'v1'}</Typography>
          </Box>
        </Box>

        {/* ÁREA DE CONTEÚDO */}
        <Box component="main" sx={{ flexGrow: 1, height: '100vh', overflowY: 'auto', bgcolor: '#f4f6f8' }}>
          {renderPage()}
        </Box>

      </Box>
    </ThemeProvider>
  );
}