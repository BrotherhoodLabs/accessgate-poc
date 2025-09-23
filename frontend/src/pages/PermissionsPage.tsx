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
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Key,
  ExpandMore,
  Search,
  FilterList,
  Group,
  Security,
} from '@mui/icons-material';
import { Permission, Role } from '../types';
import { apiService } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`permissions-tabpanel-${index}`}
      aria-labelledby={`permissions-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const PermissionsPage: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    resource: '',
    action: '',
    description: '',
  });

  // Grouper les permissions par ressource
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const resources = Array.from(new Set(permissions.map(p => p.resource)));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [permissionsResponse, rolesResponse] = await Promise.all([
        apiService.getPermissions(),
        apiService.getRoles(),
      ]);
      setPermissions(permissionsResponse.data);
      setRoles(rolesResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (permission?: Permission) => {
    if (permission) {
      setEditingPermission(permission);
      setFormData({
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
      });
    } else {
      setEditingPermission(null);
      setFormData({
        name: '',
        resource: '',
        action: '',
        description: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPermission(null);
    setFormData({
      name: '',
      resource: '',
      action: '',
      description: '',
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingPermission) {
        await apiService.updatePermission(editingPermission.id, formData);
      } else {
        await apiService.createPermission(formData);
      }
      await loadData();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (permissionId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette permission ?')) {
      try {
        await apiService.deletePermission(permissionId);
        await loadData();
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResource = !filterResource || permission.resource === filterResource;
    return matchesSearch && matchesResource;
  });

  const getRolesWithPermission = (permissionId: string) => {
    return roles.filter(role => 
      role.rolePermissions?.some(rp => rp.permission.id === permissionId)
    );
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Gestion des Permissions
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Nouvelle Permission
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filtres */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Rechercher une permission..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Ressource</InputLabel>
                <Select
                  value={filterResource}
                  onChange={(e) => setFilterResource(e.target.value)}
                >
                  <MenuItem value="">Toutes les ressources</MenuItem>
                  {resources.map(resource => (
                    <MenuItem key={resource} value={resource}>
                      {resource}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setFilterResource('');
                }}
              >
                Effacer les filtres
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Onglets */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Liste des permissions" />
            <Tab label="Groupées par ressource" />
            <Tab label="Matrice rôles/permissions" />
          </Tabs>
        </Box>

        {/* Onglet 1: Liste des permissions */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom</TableCell>
                  <TableCell>Ressource</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Rôles assignés</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPermissions.map((permission) => {
                  const assignedRoles = getRolesWithPermission(permission.id);
                  return (
                    <TableRow key={permission.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Key sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="body1" fontWeight="medium">
                            {permission.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={permission.resource}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={permission.action}
                          color="secondary"
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{permission.description}</TableCell>
                      <TableCell>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {assignedRoles.map(role => (
                            <Chip
                              key={role.id}
                              label={role.name}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(permission)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(permission.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Onglet 2: Groupées par ressource */}
        <TabPanel value={tabValue} index={1}>
          {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
            <Accordion key={resource} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center">
                  <Group sx={{ mr: 1 }} />
                  <Typography variant="h6">{resource}</Typography>
                  <Chip
                    label={resourcePermissions.length}
                    size="small"
                    sx={{ ml: 2 }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {resourcePermissions.map((permission) => (
                    <Grid item xs={12} sm={6} md={4} key={permission.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {permission.name}
                            </Typography>
                            <Chip
                              label={permission.action}
                              size="small"
                              color="secondary"
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" mb={2}>
                            {permission.description}
                          </Typography>
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(permission)}
                              color="primary"
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(permission.id)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </TabPanel>

        {/* Onglet 3: Matrice rôles/permissions */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Matrice des permissions par rôle
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Permission</TableCell>
                  {roles.map(role => (
                    <TableCell key={role.id} align="center">
                      {role.name}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {permissions.map(permission => (
                  <TableRow key={permission.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {permission.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {permission.resource}.{permission.action}
                        </Typography>
                      </Box>
                    </TableCell>
                    {roles.map(role => {
                      const hasPermission = role.rolePermissions?.some(
                        rp => rp.permission.id === permission.id
                      );
                      return (
                        <TableCell key={role.id} align="center">
                          {hasPermission ? (
                            <Chip
                              label="✓"
                              color="success"
                              size="small"
                              icon={<Security />}
                            />
                          ) : (
                            <Chip
                              label="✗"
                              color="default"
                              size="small"
                            />
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Card>

      {/* Dialog de création/modification */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPermission ? 'Modifier la Permission' : 'Nouvelle Permission'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Nom de la permission"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
              placeholder="ex: user.read"
            />
            <TextField
              fullWidth
              label="Ressource"
              value={formData.resource}
              onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
              margin="normal"
              required
              placeholder="ex: user"
            />
            <TextField
              fullWidth
              label="Action"
              value={formData.action}
              onChange={(e) => setFormData({ ...formData, action: e.target.value })}
              margin="normal"
              required
              placeholder="ex: read"
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingPermission ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
