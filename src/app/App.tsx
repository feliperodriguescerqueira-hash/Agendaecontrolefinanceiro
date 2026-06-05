import { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, IconButton, List, ListItem, ListItemIcon, 
  ListItemText, Tooltip, Divider, ListItemButton,
  CssBaseline, GlobalStyles 
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  Menu, LayoutDashboard, Calendar as CalendarIcon, Users, 
  DollarSign, Scissors, ClipboardList, Sun, Moon, Crown 
} from 'lucide-react';

// Importando a logo nativamente pelo Vite (Garante o carregamento)
import logoMari from './logomarimoraes.png';

// Importando as nossas telas
import { Dashboard } from './components/Dashboard';
import { Appointments } from './components/Appointments';
import { Clients } from './components/Clients';
import { Services } from './components/Services';
import { Finances } from './components/Finances';
import { AnamnesisList } from './components/AnamnesisList';
import { LoyaltyHub } from './components/LoyaltyHub'; // 👈 NOVA TELA IMPORTADA
import { useAppData } from './hooks/useAppData';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Estado que controla se o Modo Escuro está ativado
  const [isDarkMode, setIsDarkMode] = useState(false); 
  
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
      case 'anamnesis': return <AnamnesisList />;
      case 'loyalty': return <LoyaltyHub />; // 👈 NOVA ROTA ADICIONADA
      case 'finances': return <Finances />;
      default: return <Dashboard />;
    }
  };

  // 👇 NOVO ITEM "FIDELIDADE" ADICIONADO AO MENU 👇
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={24} /> },
    { id: 'appointments', label: 'Agenda', icon: <CalendarIcon size={24} /> },
    { id: 'clients', label: 'Clientes', icon: <Users size={24} /> },
    { id: 'services', label: 'Serviços', icon: <Scissors size={24} /> },
    { id: 'anamnesis', label: 'Fichas Clínicas', icon: <ClipboardList size={24} /> },
    { id: 'loyalty', label: 'Fidelidade', icon: <Crown size={24} /> }, 
    { id: 'finances', label: 'Financeiro', icon: <DollarSign size={24} /> },
  ];

  // O TEMA AGORA É DINÂMICO
  const mariTheme = useMemo(() => createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: { main: '#e91e63', light: '#f8bbd0', dark: '#c2185b', contrastText: '#ffffff' },
      background: { 
        default: isDarkMode ? '#121212' : '#f4f6f8',
        paper: isDarkMode ? '#1e1e1e' : '#ffffff',
      },
    },
  }), [isDarkMode]);

  return (
    <ThemeProvider theme={mariTheme}>
      <CssBaseline /> 
      
      {/* ESTILOS GLOBAIS PARA COMPORTAMENTO DE APP NATIVO NO TABLET */}
      <GlobalStyles styles={{
        'html, body': {
          overscrollBehaviorY: 'none', 
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',    
          userSelect: 'none',
        },
        'input, textarea': {
          WebkitUserSelect: 'auto',    
          userSelect: 'auto',
        }
      }} />
      
      <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: 'background.default' }}>
        
        {/* SIDEBAR */}
        <Box sx={{
            width: isSidebarOpen ? 280 : 72,
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            bgcolor: 'background.paper', 
            borderRight: '1px solid',
            borderColor: 'divider',
            display: 'flex', flexDirection: 'column', zIndex: 10,
          }}>
          
          {/* CABEÇALHO DO MENU COM A LOGO */}
          <Box sx={{ 
            minHeight: isSidebarOpen ? 220 : 80, 
            display: 'flex', 
            flexDirection: isSidebarOpen ? 'column' : 'row',
            alignItems: 'center', 
            justifyContent: 'center', 
            p: 2,
            borderBottom: '1px solid', 
            borderColor: 'divider',
            position: 'relative',
            bgcolor: 'transparent'
          }}>
            
            {isSidebarOpen && (
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 2 }}>
                <img 
                  src={logoMari} 
                  alt="Logo Mari Moraes" 
                  style={{ 
                    width: '190px', 
                    height: '190px', 
                    objectFit: 'contain'
                  }}
                />
              </Box>
            )}

            {/* Botão Hambúrguer flutuante quando aberto, centralizado quando fechado */}
            <IconButton 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              color="primary"
              sx={{
                position: isSidebarOpen ? 'absolute' : 'static',
                top: isSidebarOpen ? 8 : 'auto',
                right: isSidebarOpen ? 8 : 'auto'
              }}
            >
              <Menu size={24} />
            </IconButton>
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
                      '&:hover': { bgcolor: currentPage === item.id ? 'primary.dark' : 'action.hover' } 
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
          
          {/* BOTÃO DE MODO ESCURO E ASSINATURA */}
          <Box sx={{ p: isSidebarOpen ? 2 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            
            <Tooltip title={isDarkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"} placement="right">
              <IconButton onClick={() => setIsDarkMode(!isDarkMode)} color="inherit" size="small" sx={{ bgcolor: 'action.hover' }}>
                {isDarkMode ? <Sun size={20} color="#ffb300" /> : <Moon size={20} color="#5c6bc0" />}
              </IconButton>
            </Tooltip>

            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: '500', textAlign: 'center' }}>
              {isSidebarOpen ? 'Feito com carinho ❤️ v2.1' : '❤️ v2.1'}
            </Typography>

          </Box>
          
        </Box>

        {/* ÁREA DE CONTEÚDO */}
        <Box component="main" sx={{ flexGrow: 1, height: '100vh', overflowY: 'auto', bgcolor: 'background.default' }}>
          {renderPage()}
        </Box>

      </Box>
    </ThemeProvider>
  );
}