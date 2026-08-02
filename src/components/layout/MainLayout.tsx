import { Box, CssBaseline, AppBar, Toolbar, Typography, Drawer, SwipeableDrawer, IconButton, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useState } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useSettings } from '../../features/settings/hooks/useSettings';
import { Sidebar } from './Sidebar';

const drawerWidth = 240;

export const MainLayout = () => {
  const { mode, toggleTheme } = useThemeStore();
  const { logout } = useAuthStore();
  const { data: settings } = useSettings();
  const navigate = useNavigate();
  
  // Custom breakpoint: < 1024px is considered mobile for this layout
  const isMobile = useMediaQuery('(max-width:1023px)');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCloseMobileDrawer = () => {
    setMobileOpen(false);
  };

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };

  const handleLogoutConfirm = () => {
    setLogoutDialogOpen(false);
    logout();
    navigate('/login');
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: 0 }}>
            {settings?.company_logo_url && (
              <Box
                component="img"
                src={settings.company_logo_url}
                alt="Company Logo"
                sx={{
                  height: { xs: 32, sm: 40 },
                  width: 'auto',
                  objectFit: 'contain',
                  mr: 2,
                  borderRadius: 1
                }}
              />
            )}
            <Typography 
              variant="h6" 
              noWrap 
              component="div"
              sx={{ 
                fontSize: { xs: '1rem', sm: '1.25rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {settings?.company_name === 'Umbrella Brand' 
                ? 'Umbrella Brand Management System' 
                : settings?.company_name || 'Business Management System'}
            </Typography>
          </Box>
          <IconButton sx={{ ml: 1, flexShrink: 0 }} onClick={toggleTheme} color="inherit">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <IconButton sx={{ ml: 1, flexShrink: 0 }} onClick={handleLogoutClick} color="inherit">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}
        aria-label="navigation folders"
      >
        {isMobile ? (
          <SwipeableDrawer
            variant="temporary"
            open={mobileOpen}
            onOpen={handleDrawerToggle}
            onClose={handleCloseMobileDrawer}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            <Sidebar onClose={handleCloseMobileDrawer} />
          </SwipeableDrawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            <Sidebar />
          </Drawer>
        )}
      </Box>

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, sm: 3 }, 
          backgroundColor: 'background.default', 
          width: isMobile ? '100%' : `calc(100% - ${drawerWidth}px)` 
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>

      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <DialogTitle id="logout-dialog-title">
          Confirm Logout
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="logout-dialog-description">
            Are you sure you want to log out?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel} color="inherit">Cancel</Button>
          <Button onClick={handleLogoutConfirm} color="error" autoFocus>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
