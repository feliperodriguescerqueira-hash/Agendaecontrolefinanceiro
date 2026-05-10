import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Tooltip, 
  Divider, 
  Avatar,
  ListItemButton
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  Menu, 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Users, 
  DollarSign, 
  Scissors 
} from 'lucide-react';

// Importando as nossas telas
import { Dashboard } from './components/Dashboard';
import { Appointments } from './components/Appointments';
import { Clients } from './components/Clients';
import { Finances } from './components/Finances';
// Importação do Hook de Dados
import { useAppData } from './hooks/useAppData';

// 🎨 DEFINIÇÃO DO TEMA ROSA (Identidade Mari Moraes)
const mariTheme = createTheme({
  palette: {
    primary: {
      main: '#e91e63',
      light: '#f8bbd0',
      dark: '#c2185b',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f4f6f8',
    },
  },
});

export default function App() {
  // --- ESTADOS ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // --- CONEXÃO COM O BANCO DE DADOS ---
  const { fetchData } = useAppData();

  useEffect(() => {
    // Busca os dados da nuvem assim que o sistema abre
    fetchData();
  }, [fetchData]);

  // --- LÓGICA DE NAVEGAÇÃO ---
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={24} /> },
    { id: 'appointments', label: 'Agenda', icon: <CalendarIcon size={24} /> },
    { id: 'clients', label: 'Clientes', icon: <Users size={24} /> },
    { id: 'finances', label: 'Financeiro', icon: <DollarSign size={24} /> },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'appointments': return <Appointments />;
      case 'clients': return <Clients />;
      case 'finances': return <Finances />;
      default: return <Dashboard />;
    }
  };

  return (
    <ThemeProvider theme={mariTheme}>
      <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: '#f4f6f8' }}>
        
        {/* 🟢 SIDEBAR RETRÁTIL 🟢 */}
        <Box
          sx={{
            width: isSidebarOpen ? 260 : 72,
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            bgcolor: 'white',
            borderRight: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
            zIndex: 10,
          }}
        >
          {/* TOPO: STUDIO MARI MORAES */}
          <Box sx={{ 
            height: 72, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: isSidebarOpen ? 'space-between' : 'center', 
            px: isSidebarOpen ? 2 : 0,
            borderBottom: '1px solid #f0f0f0'
          }}>
            {isSidebarOpen && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                  <Scissors size={20} />
                </Avatar>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', color: 'primary.main' }}>
                  Studio Mari Moraes
                </Typography>
              </Box>
            )}
            <IconButton onClick={toggleSidebar} color="primary">
              <Menu size={24} />
            </IconButton>
          </Box>

          {/* LISTA DE ITENS DO MENU */}
          <List sx={{ pt: 2, px: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {menuItems.map((item) => {
              const isActive = currentPage === item.id;

              return (
                <Tooltip 
                  key={item.id} 
                  title={!isSidebarOpen ? item.label : ''} 
                  placement="right" 
                  arrow
                >
                  <ListItem disablePadding>
                    <ListItemButton 
                      onClick={() => setCurrentPage(item.id)}
                      sx={{
                        justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                        borderRadius: 2,
                        px: isSidebarOpen ? 2 : 0,
                        py: 1.5,
                        bgcolor: isActive ? 'primary.main' : 'transparent',
                        color: isActive ? 'white' : 'text.secondary',
                        '&:hover': {
                          bgcolor: isActive ? 'primary.dark' : '#f5f5f5',
                        },
                        transition: 'all 0.2s',
                        minHeight: 48,
                      }}
                    >
                      <ListItemIcon sx={{ 
                        minWidth: 0, 
                        mr: isSidebarOpen ? 2 : 0, 
                        color: 'inherit',
                        justifyContent: 'center'
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      
                      {isSidebarOpen && (
                        <ListItemText 
                          primary={item.label} 
                          primaryTypographyProps={{ 
                            fontWeight: isActive ? 'bold' : 'medium',
                            fontSize: '0.95rem' 
                          }} 
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
              );
            })}
          </List>

          <Box sx={{ flexGrow: 1 }} />
          <Divider />
          
          {/* RODAPÉ DO MENU */}
          <Box sx={{ p: isSidebarOpen ? 2 : 1, display: 'flex', justifyContent: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {isSidebarOpen ? 'Gestão Profissional v1.0' : 'v1'}
            </Typography>
          </Box>
        </Box>

        {/* 🟢 ÁREA DE CONTEÚDO PRINCIPAL (TELAS) 🟢 */}
        <Box 
          component="main"
          sx={{ 
            flexGrow: 1, 
            height: '100vh', 
            overflowY: 'auto', 
            overflowX: 'hidden',
            p: 0 // As telas já possuem seu próprio padding interno
          }}
        >
          {renderPage()}
        </Box>

      </Box>
    </ThemeProvider>
  );
}