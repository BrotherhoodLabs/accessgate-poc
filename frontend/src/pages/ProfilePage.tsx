import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemSecondaryAction,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Tab,
  Tabs,
  TabPanel,
} from '@mui/material';
import {
  Person,
  Security,
  Key,
  Edit,
  Save,
  Cancel,
  AdminPanelSettings,
  Group,
  Visibility,
  CheckCircle,
  Warning,
  Info,
  Lock,
  Email,
  Badge,
  AssignmentInd,
} from '@mui/icons-material';
import { User, Role, Permission } from '../types';
import { apiService } from '../services/api';
import { useAuthStore } from '../store/authStore';

export const ProfilePage: React.FC = () => {
  const { user: currentUser, updateUser } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (currentUser) {
      loadUserProfile();
    }
  }, [currentUser]);

  const loadUserProfile = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const [userResponse, rolesResponse, permissionsResponse] = await Promise.all([
        apiService.getUserById(currentUser.id),
        apiService.getRoles(),
        apiService.getPermissions(),
      ]);

      setUser(userResponse.data);
      setRoles(rolesResponse.data);
      setPermissions(permissionsResponse.data);
      
      setFormData({
        firstName: userResponse.data.firstName,
        lastName: userResponse.data.lastName,
        email: userResponse.data.email,
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      await apiService.updateUser(user.id, formData);
      await loadUserProfile();
      setEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      // Note: L'API backend devrait avoir un endpoint pour changer le mot de passe
      // Pour l'instant, on simule la logique
      setPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erreur lors du changement de mot de passe');
    }
  };

  const getUserPermissions = () => {
    if (!user) return [];
    
    const userPermissions = user.userRoles?.flatMap(ur => 
      ur.role.rolePermissions?.map(rp => rp.permission) || []
    ) || [];
    
    // Dédupliquer les permissions
    const uniquePermissions = userPermissions.filter((permission, index, self) => 
      index === self.findIndex(p => p.id === permission.id)
    );
    
    return uniquePermissions;
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin': return 'error';
      case 'user': return 'primary';
      case 'manager': return 'warning';
      case 'viewer': return 'info';
      default: return 'default';
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin': return <AdminPanelSettings />;
      case 'user': return <Person />;
      case 'manager': return <Group />;
      case 'viewer': return <Visibility />;
      default: return <Security />;
    }
  };

  const getPermissionColor = (permissionName: string) => {
    if (permissionName.includes('read')) return 'info';
    if (permissionName.includes('write') || permissionName.includes('create')) return 'success';
    if (permissionName.includes('delete')) return 'error';
    if (permissionName.includes('update') || permissionName.includes('modify')) return 'warning';
    return 'default';
  };

  const getPermissionIcon = (permissionName: string) => {
    if (permissionName.includes('read')) return <Visibility />;
    if (permissionName.includes('write') || permissionName.includes('create')) return <Edit />;
    if (permissionName.includes('delete')) return <Cancel />;
    if (permissionName.includes('update') || permissionName.includes('modify')) return <Edit />;
    return <Key />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Alert severity="error">
        Impossible de charger le profil utilisateur.
      </Alert>
    );
  }

  const userPermissions = getUserPermissions();

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Mon Profil RBAC
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Informations personnelles */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: 'primary.main',
                    fontSize: '3rem',
                    mb: 2,
                  }}
                >
                  {user.firstName[0]}{user.lastName[0]}
                </Avatar>
                <Typography variant="h5" component="div">
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
                <Chip
                  icon={user.isActive ? <CheckCircle /> : <Cancel />}
                  label={user.isActive ? 'Actif' : 'Inactif'}
                  color={user.isActive ? 'success' : 'error'}
                  sx={{ mt: 1 }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={handleEdit}
                  disabled={editing}
                >
                  Modifier le profil
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Lock />}
                  onClick={() => setPasswordDialog(true)}
                >
                  Changer le mot de passe
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Détails du profil */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">
                  Informations personnelles
                </Typography>
                {editing && (
                  <Box>
                    <Button
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={handleCancel}
                      sx={{ mr: 1 }}
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSave}
                    >
                      Sauvegarder
                    </Button>
                  </Box>
                )}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Prénom"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nom"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: <Badge sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Rôles et permissions */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rôles et Permissions
              </Typography>

              <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                <Tab label="Mes Rôles" icon={<AssignmentInd />} />
                <Tab label="Mes Permissions" icon={<Key />} />
              </Tabs>

              <TabPanel value={activeTab} index={0}>
                <Typography variant="subtitle1" gutterBottom>
                  Rôles assignés ({user.userRoles?.length || 0})
                </Typography>
                <List>
                  {user.userRoles?.map((userRole) => (
                    <ListItem key={userRole.role.id} divider>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: getRoleColor(userRole.role.name) + '.main' }}>
                          {getRoleIcon(userRole.role.name)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={userRole.role.name}
                        secondary={userRole.role.description}
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={userRole.role.name}
                          color={getRoleColor(userRole.role.name)}
                          icon={getRoleIcon(userRole.role.name)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  )) || []}
                </List>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <Typography variant="subtitle1" gutterBottom>
                  Permissions héritées ({userPermissions.length})
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {userPermissions.map((permission) => (
                    <Chip
                      key={permission.id}
                      label={permission.name}
                      color={getPermissionColor(permission.name)}
                      icon={getPermissionIcon(permission.name)}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </TabPanel>
            </CardContent>
          </Card>

          {/* Statistiques RBAC */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistiques RBAC
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {user.userRoles?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rôles assignés
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="secondary">
                      {userPermissions.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Permissions totales
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {user.isActive ? 'Actif' : 'Inactif'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Statut du compte
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog de changement de mot de passe */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Lock sx={{ mr: 1 }} />
            Changer le mot de passe
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Mot de passe actuel"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Nouveau mot de passe"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Confirmer le nouveau mot de passe"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              margin="normal"
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Annuler</Button>
          <Button onClick={handlePasswordChange} variant="contained">
            Changer le mot de passe
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
