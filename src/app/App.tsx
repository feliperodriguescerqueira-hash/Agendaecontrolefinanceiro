import { useState } from 'react';
import { AppBar, Toolbar, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box } from '@mui/material';
import { LayoutDashboard, Calendar, Users, Scissors, DollarSign } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Appointments } from './components/Appointments';
import { Clients } from './components/Clients';
import { Services } from './components/Services';
import { Finances } from './components/Finances';

const drawerWidth = 240;

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Agendamentos', icon: Calendar },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'services', label: 'Serviços', icon: Scissors },
    { id: 'finances', label: 'Financeiro', icon: DollarSign },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'appointments':
        return <Appointments />;
      case 'clients':
        return <Clients />;
      case 'services':
        return <Services />;
      case 'finances':
        return <Finances />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: '#9c27b0',
        }}
      >
        <Toolbar>
          <Scissors className="mr-3" size={28} />
          <h1 className="font-semibold">Studio Mari Moraes</h1>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.id} disablePadding>
                <ListItemButton
                  selected={currentPage === item.id}
                  onClick={() => setCurrentPage(item.id)}
                  sx={{
                    '&.Mui-selected': {
                      bgcolor: '#9c27b020',
                      borderRight: '4px solid #9c27b0',
                      '&:hover': {
                        bgcolor: '#9c27b030',
                      },
                    },
                  }}
                >
                  <ListItemIcon>
                    <item.icon
                      size={24}
                      style={{
                        color: currentPage === item.id ? '#9c27b0' : '#757575',
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontWeight: currentPage === item.id ? 600 : 400,
                        color: currentPage === item.id ? '#9c27b0' : '#333',
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          overflow: 'auto',
        }}
      >
        {renderPage()}
      </Box>
    </Box>
  );
}