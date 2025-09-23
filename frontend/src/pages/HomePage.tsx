import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  People,
  Security,
  AdminPanelSettings,
  Visibility,
} from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';

export const HomePage: React.FC = () => {
  const { user } = useAuthStore();

  const roleColors: { [key: string]: 'primary' | 'secondary' | 'success' | 'warning' } = {
    ADMIN: 'error',
    MANAGER: 'warning',
    VIEWER: 'info',
  };

  const getRoleColor = (role: string) => {
    return roleColors[role] || 'default';
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Bienvenue dans AccessGate PoC
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Système de contrôle d'accès basé sur les rôles (RBAC) avec authentification JWT.
      </Typography>

      {user && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Informations de votre compte
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1">
                {user.email}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Rôles
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {user.roles.map((role) => (
                  <Chip
                    key={role}
                    label={role}
                    color={getRoleColor(role)}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Permissions
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {user.permissions.map((permission) => (
                  <Chip
                    key={permission}
                    label={permission}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </Paper>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Gestion des Utilisateurs
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Créez, modifiez et gérez les utilisateurs du système. Assignez des rôles
                et contrôlez les accès selon les permissions.
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <AdminPanelSettings fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Créer des utilisateurs" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AdminPanelSettings fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Assigner des rôles" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Visibility fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Consulter les profils" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Security color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Gestion des Rôles
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Définissez les rôles et leurs permissions. Configurez les niveaux
                d'accès selon les besoins de votre organisation.
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <AdminPanelSettings fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Créer des rôles" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AdminPanelSettings fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Assigner des permissions" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Visibility fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Consulter les rôles" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Rôles disponibles
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="error">
                ADMIN
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Accès complet au système
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main">
                MANAGER
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gestion des utilisateurs
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="info.main">
                VIEWER
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Consultation seule
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};
