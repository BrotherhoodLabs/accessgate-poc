import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  LinearProgress,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  People,
  Security,
  Key,
  TrendingUp,
  Person,
  Shield,
  Lock,
  Refresh,
  CheckCircle,
  Warning,
  Error,
} from '@mui/icons-material';
import { User, Role, Permission } from '../types';
import { apiService } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
  totalPermissions: number;
  recentUsers: User[];
  roleDistribution: { role: string; count: number }[];
  permissionUsage: { permission: string; count: number }[];
}

export const DashboardPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les données en parallèle
      const [usersResponse, rolesResponse, permissionsResponse] = await Promise.all([
        apiService.getUsers(1, 100), // Récupérer plus d'utilisateurs pour les stats
        apiService.getRoles(),
        apiService.getPermissions(),
      ]);

      const users = usersResponse.data.users || [];
      const roles = rolesResponse.data || [];
      const permissions = permissionsResponse.data || [];

      // Calculer les statistiques
      const activeUsers = users.filter(user => user.isActive).length;
      
      // Distribution des rôles
      const roleDistribution: { role: string; count: number }[] = [];
      roles.forEach(role => {
        const count = users.filter(user => 
          user.userRoles?.some(ur => ur.role.name === role.name)
        ).length;
        roleDistribution.push({ role: role.name, count });
      });

      // Utilisation des permissions
      const permissionUsage: { permission: string; count: number }[] = [];
      permissions.forEach(permission => {
        const count = roles.filter(role => 
          role.rolePermissions?.some(rp => rp.permission.name === permission.name)
        ).length;
        permissionUsage.push({ permission: permission.name, count });
      });

      // Utilisateurs récents (5 derniers)
      const recentUsers = users
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      setStats({
        totalUsers: users.length,
        activeUsers,
        totalRoles: roles.length,
        totalPermissions: permissions.length,
        recentUsers,
        roleDistribution,
        permissionUsage: permissionUsage.slice(0, 10), // Top 10
      });

      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <IconButton color="inherit" size="small" onClick={handleRefresh}>
            <Refresh />
          </IconButton>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!stats) return null;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Tableau de bord RBAC
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bienvenue, {currentUser?.firstName} {currentUser?.lastName}
          </Typography>
        </Box>
        <Tooltip title="Actualiser les données">
          <IconButton onClick={handleRefresh} color="primary">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div">
                    {stats.totalUsers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Utilisateurs total
                  </Typography>
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(stats.activeUsers / stats.totalUsers) * 100} 
                sx={{ mt: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                {stats.activeUsers} actifs
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <Security />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div">
                    {stats.totalRoles}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rôles définis
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Key />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div">
                    {stats.totalPermissions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Permissions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div">
                    {stats.roleDistribution.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rôles utilisés
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Utilisateurs récents */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Utilisateurs récents" 
              avatar={<Person />}
            />
            <CardContent>
              <List>
                {stats.recentUsers.map((user) => (
                  <ListItem key={user.id} divider>
                    <ListItemIcon>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {user.firstName[0]}{user.lastName[0]}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={`${user.firstName} ${user.lastName}`}
                      secondary={user.email}
                    />
                    <Box>
                      <Chip
                        label={user.isActive ? 'Actif' : 'Inactif'}
                        color={user.isActive ? 'success' : 'default'}
                        size="small"
                        icon={user.isActive ? <CheckCircle /> : <Warning />}
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Distribution des rôles */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Distribution des rôles" 
              avatar={<Shield />}
            />
            <CardContent>
              <List>
                {stats.roleDistribution.map((item, index) => (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      <Security />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.role}
                      secondary={`${item.count} utilisateur(s)`}
                    />
                    <Box width="100px">
                      <LinearProgress 
                        variant="determinate" 
                        value={(item.count / stats.totalUsers) * 100}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Permissions les plus utilisées */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Permissions les plus utilisées" 
              avatar={<Lock />}
            />
            <CardContent>
              <Grid container spacing={2}>
                {stats.permissionUsage.map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {item.permission}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.count} rôle(s)
                        </Typography>
                      </Box>
                      <Chip
                        label={item.count}
                        color="primary"
                        size="small"
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Footer */}
      <Box mt={3} textAlign="center">
        <Typography variant="caption" color="text.secondary">
          Dernière mise à jour: {lastUpdated.toLocaleString('fr-FR')}
        </Typography>
      </Box>
    </Box>
  );
};
