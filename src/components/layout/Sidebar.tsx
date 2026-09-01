import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar = ({ onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/clients', label: 'Clients', icon: <PeopleIcon /> },
    { path: '/vendors', label: 'Vendors', icon: <LocalShippingIcon /> },
    { path: '/invoices', label: 'Invoices', icon: <ReceiptIcon /> },
    { path: '/purchases', label: 'Purchases', icon: <ShoppingCartIcon /> },
    { path: '/expenses', label: 'Expenses', icon: <AccountBalanceWalletIcon /> },
    { path: '/cashbook', label: 'Cash Book', icon: <AccountBalanceIcon /> },
    { path: '/daily-records', label: 'Daily Records', icon: <CalendarMonthIcon /> },
    { path: '/reports', label: 'Reports', icon: <BarChartIcon /> },
    { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {navItems.map((item) => (
            <ListItem disablePadding key={item.path}>
              <ListItemButton 
                onClick={() => handleNavigation(item.path)}
                selected={location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))}
              >
                <ListItemIcon sx={{ 
                  color: location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)) 
                    ? 'primary.main' 
                    : 'inherit' 
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  sx={{ 
                    color: location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)) 
                      ? 'primary.main' 
                      : 'inherit' 
                  }} 
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </>
  );
};
