import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Alert,
  CircularProgress,
  Pagination,
  Switch,
  FormControlLabel,
  Grid,
  Avatar,
  Tooltip,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  TabPanel,
  DialogContentText,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Person,
  Security,
  Key,
  ExpandMore,
  AssignmentInd,
  PersonAdd,
  AdminPanelSettings,
  Group,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Cancel,
  Warning,
  Info,
} from '@mui/icons-material';
import { User, Role } from '../types';
import { apiService } from '../services/api';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [roleAssignmentDialog, setRoleAssignmentDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    roleIds: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResponse, rolesResponse] = await Promise.all([
        apiService.getUsers(page, 10),
        apiService.getRoles(),
      ]);
      setUsers(usersResponse.data.data);
      setTotalPages(usersResponse.data.pagination.pages);
      setRoles(rolesResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        password: '',
        roleIds: user.userRoles?.map(ur => ur.role.id) || [],
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        roleIds: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      roleIds: [],
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        const { password, ...updateData } = formData;
        await apiService.updateUser(editingUser.id, updateData);
      } else {
        await apiService.createUser(formData);
      }
      await loadData();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await apiService.deleteUser(userId);
        await loadData();
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await apiService.updateUser(user.id, { isActive: !user.isActive });
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erreur lors de la modification');
    }
  };

  const getRoleChips = (user: User) => {
    return user.userRoles?.map(ur => (
      <Chip
        key={ur.role.id}
        label={ur.role.name}
        size="small"
        variant="outlined"
        color={ur.role.name === 'admin' ? 'error' : ur.role.name === 'user' ? 'primary' : 'default'}
        icon={ur.role.name === 'admin' ? <AdminPanelSettings /> : <Person />}
        sx={{ mr: 0.5, mb: 0.5 }}
      />
    )) || [];
  };

  const handleOpenRoleAssignment = async (user: User) => {
    setSelectedUser(user);
    setUserRoles(user.userRoles?.map(ur => ur.role.id) || []);
    setAvailableRoles(roles);
    setRoleAssignmentDialog(true);
  };

  const handleCloseRoleAssignment = () => {
    setRoleAssignmentDialog(false);
    setSelectedUser(null);
    setUserRoles([]);
  };

  const handleRoleAssignment = async () => {
    if (!selectedUser) return;

    try {
      // Récupérer les rôles actuels
      const currentRoleIds = selectedUser.userRoles?.map(ur => ur.role.id) || [];
      
      // Trouver les rôles à ajouter et à supprimer
      const rolesToAdd = userRoles.filter(roleId => !currentRoleIds.includes(roleId));
      const rolesToRemove = currentRoleIds.filter(roleId => !userRoles.includes(roleId));

      // Ajouter les nouveaux rôles
      for (const roleId of rolesToAdd) {
        await apiService.assignRoleToUser(selectedUser.id, roleId);
      }

      // Supprimer les rôles retirés
      for (const roleId of rolesToRemove) {
        await apiService.removeRoleFromUser(selectedUser.id, roleId);
      }

      await loadData();
      handleCloseRoleAssignment();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erreur lors de l\'assignation des rôles');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || 
      user.userRoles?.some(ur => ur.role.id === filterRole);
    
    return matchesSearch && matchesRole;
  });

  const getRoleStats = () => {
    const stats = roles.map(role => ({
      role,
      count: users.filter(user => 
        user.userRoles?.some(ur => ur.role.id === role.id)
      ).length
    }));
    return stats;
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header avec statistiques */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Gestion des Utilisateurs RBAC
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {users.length} utilisateur{users.length > 1 ? 's' : ''} • {roles.length} rôle{roles.length > 1 ? 's' : ''}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          Nouvel Utilisateur
        </Button>
      </Box>

      {/* Statistiques des rôles */}
      <Grid container spacing={2} mb={3}>
        {getRoleStats().map(({ role, count }) => (
          <Grid item xs={12} sm={6} md={3} key={role.id}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{
                    bgcolor: getRoleColor(role.name) + '.main',
                    width: 56,
                    height: 56,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  {getRoleIcon(role.name)}
                </Avatar>
                <Typography variant="h4" component="div">
                  {count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {role.name}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filtres et contrôles */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filtrer par rôle</InputLabel>
                <Select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <MenuItem value="all">Tous les rôles</MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Vue</InputLabel>
                <Select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as 'table' | 'cards')}
                >
                  <MenuItem value="table">Tableau</MenuItem>
                  <MenuItem value="cards">Cartes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box display="flex" gap={1}>
                <Button
                  variant={viewMode === 'table' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('table')}
                  startIcon={<AssignmentInd />}
                >
                  Tableau
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('cards')}
                  startIcon={<Group />}
                >
                  Cartes
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Vue tableau */}
      {viewMode === 'table' && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Utilisateur</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rôles</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {user.firstName[0]}{user.lastName[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {user.firstName} {user.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {user.id.slice(0, 8)}...
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {getRoleChips(user)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={user.isActive ? <CheckCircle /> : <Cancel />}
                      label={user.isActive ? 'Actif' : 'Inactif'}
                      color={user.isActive ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Modifier">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(user)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Gérer les rôles">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenRoleAssignment(user)}
                          color="secondary"
                        >
                          <Security />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(user.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Vue cartes */}
      {viewMode === 'cards' && (
        <Grid container spacing={2}>
          {filteredUsers.map((user) => (
            <Grid item xs={12} sm={6} md={4} key={user.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {user.firstName[0]}{user.lastName[0]}
                    </Avatar>
                    <Box flexGrow={1}>
                      <Typography variant="h6">
                        {user.firstName} {user.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                    <Chip
                      icon={user.isActive ? <CheckCircle /> : <Cancel />}
                      label={user.isActive ? 'Actif' : 'Inactif'}
                      color={user.isActive ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Rôles assignés:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                    {getRoleChips(user)}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box display="flex" justifyContent="space-between">
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => handleOpenDialog(user)}
                    >
                      Modifier
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Security />}
                      onClick={() => handleOpenRoleAssignment(user)}
                      color="secondary"
                    >
                      Rôles
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Delete />}
                      onClick={() => handleDelete(user.id)}
                      color="error"
                    >
                      Supprimer
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      )}

      {/* Dialog de création/modification d'utilisateur */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? 'Modifier l\'Utilisateur' : 'Nouvel Utilisateur'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Prénom"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nom"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={editingUser ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'}
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Rôles</InputLabel>
                  <Select
                    multiple
                    value={formData.roleIds}
                    onChange={(e) => setFormData({ ...formData, roleIds: e.target.value as string[] })}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const role = roles.find(r => r.id === value);
                          return (
                            <Chip
                              key={value}
                              label={role?.name || value}
                              size="small"
                              color={getRoleColor(role?.name || '')}
                              icon={getRoleIcon(role?.name || '')}
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        <Checkbox checked={formData.roleIds.indexOf(role.id) > -1} />
                        <ListItemText 
                          primary={role.name} 
                          secondary={role.description}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog d'assignation des rôles */}
      <Dialog open={roleAssignmentDialog} onClose={handleCloseRoleAssignment} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Security sx={{ mr: 1 }} />
            Gérer les rôles de {selectedUser?.firstName} {selectedUser?.lastName}
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Sélectionnez les rôles à assigner à cet utilisateur. Vous pouvez assigner plusieurs rôles simultanément.
          </DialogContentText>
          
          <List>
            {availableRoles.map((role) => (
              <ListItem key={role.id} divider>
                <ListItemIcon>
                  <Checkbox
                    checked={userRoles.includes(role.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setUserRoles([...userRoles, role.id]);
                      } else {
                        setUserRoles(userRoles.filter(id => id !== role.id));
                      }
                    }}
                  />
                </ListItemIcon>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: getRoleColor(role.name) + '.main', width: 32, height: 32 }}>
                    {getRoleIcon(role.name)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={role.name}
                  secondary={role.description}
                />
                <ListItemSecondaryAction>
                  <Chip
                    label={role.name}
                    size="small"
                    color={getRoleColor(role.name)}
                    icon={getRoleIcon(role.name)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRoleAssignment}>Annuler</Button>
          <Button onClick={handleRoleAssignment} variant="contained">
            Sauvegarder les rôles
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
