import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Menu,
  MenuItem,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  AccountCircle,
  Logout,
  Settings,
  Dashboard,
  People,
  Security,
  Key,
} from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AccessGate PoC
          </Typography>
          
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                color="inherit"
                onClick={() => navigate('/dashboard')}
                startIcon={<Dashboard />}
                sx={{ display: { xs: 'none', sm: 'block' } }}
              >
                Dashboard
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate('/users')}
                startIcon={<People />}
                sx={{ display: { xs: 'none', sm: 'block' } }}
              >
                Utilisateurs
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate('/roles')}
                startIcon={<Security />}
                sx={{ display: { xs: 'none', sm: 'block' } }}
              >
                Rôles
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate('/permissions')}
                startIcon={<Key />}
                sx={{ display: { xs: 'none', sm: 'block' } }}
              >
                Permissions
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate('/audit')}
                startIcon={<Security />}
                sx={{ display: { xs: 'none', sm: 'block' } }}
              >
                Audit
              </Button>
              
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  {user.email.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleProfile}>
                  <AccountCircle sx={{ mr: 1 }} />
                  Mon Profil
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <Logout sx={{ mr: 1 }} />
                  Déconnexion
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        {children}
      </Container>
    </Box>
  );
};
