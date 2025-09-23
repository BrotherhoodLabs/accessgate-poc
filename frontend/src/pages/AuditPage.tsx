import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  Alert,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Avatar,
  Tooltip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  TabPanel,
  Pagination,
} from '@mui/material';
import {
  Security,
  Person,
  Edit,
  Delete,
  Add,
  Visibility,
  Warning,
  Info,
  CheckCircle,
  Cancel,
  FilterList,
  Search,
  Refresh,
  ExpandMore,
  AssignmentInd,
  Key,
  AdminPanelSettings,
  Group,
  Lock,
  LockOpen,
} from '@mui/icons-material';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  userId: string;
  userEmail: string;
  userName: string;
  timestamp: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
}

export const AuditPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterResource, setFilterResource] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadAuditLogs();
  }, [page, searchTerm, filterAction, filterResource, filterUser]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      // Simuler des logs d'audit pour la démonstration
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          action: 'CREATE',
          resource: 'user',
          userId: 'user1',
          userEmail: 'admin@accessgate.com',
          userName: 'Admin User',
          timestamp: new Date().toISOString(),
          details: {
            createdUser: {
              email: 'newuser@example.com',
              firstName: 'John',
              lastName: 'Doe',
            },
          },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        {
          id: '2',
          action: 'UPDATE',
          resource: 'role',
          userId: 'user1',
          userEmail: 'admin@accessgate.com',
          userName: 'Admin User',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          details: {
            roleId: 'role1',
            roleName: 'Manager',
            changes: {
              permissions: ['user.read', 'user.write'],
            },
          },
          ipAddress: '192.168.1.100',
        },
        {
          id: '3',
          action: 'DELETE',
          resource: 'permission',
          userId: 'user2',
          userEmail: 'manager@accessgate.com',
          userName: 'Manager User',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          details: {
            permissionId: 'perm1',
            permissionName: 'user.delete',
          },
          ipAddress: '192.168.1.101',
        },
        {
          id: '4',
          action: 'LOGIN',
          resource: 'auth',
          userId: 'user3',
          userEmail: 'user@accessgate.com',
          userName: 'Regular User',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          details: {
            loginMethod: 'password',
            success: true,
          },
          ipAddress: '192.168.1.102',
        },
        {
          id: '5',
          action: 'ASSIGN_ROLE',
          resource: 'user_role',
          userId: 'user1',
          userEmail: 'admin@accessgate.com',
          userName: 'Admin User',
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          details: {
            targetUserId: 'user4',
            targetUserEmail: 'newuser2@example.com',
            roleId: 'role2',
            roleName: 'Viewer',
          },
          ipAddress: '192.168.1.100',
        },
      ];

      setAuditLogs(mockLogs);
      setTotalPages(1);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erreur lors du chargement des logs d\'audit');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesResource = filterResource === 'all' || log.resource === filterResource;
    const matchesUser = filterUser === 'all' || log.userId === filterUser;
    
    return matchesSearch && matchesAction && matchesResource && matchesUser;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <Add />;
      case 'UPDATE': return <Edit />;
      case 'DELETE': return <Delete />;
      case 'LOGIN': return <LockOpen />;
      case 'LOGOUT': return <Lock />;
      case 'ASSIGN_ROLE': return <AssignmentInd />;
      case 'REMOVE_ROLE': return <Cancel />;
      default: return <Security />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'error';
      case 'LOGIN': return 'success';
      case 'LOGOUT': return 'warning';
      case 'ASSIGN_ROLE': return 'primary';
      case 'REMOVE_ROLE': return 'error';
      default: return 'default';
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'user': return <Person />;
      case 'role': return <Security />;
      case 'permission': return <Key />;
      case 'auth': return <Lock />;
      case 'user_role': return <AssignmentInd />;
      default: return <Security />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('fr-FR');
  };

  const getActionDescription = (log: AuditLog) => {
    switch (log.action) {
      case 'CREATE':
        return `Création d'un ${log.resource}`;
      case 'UPDATE':
        return `Modification d'un ${log.resource}`;
      case 'DELETE':
        return `Suppression d'un ${log.resource}`;
      case 'LOGIN':
        return 'Connexion utilisateur';
      case 'LOGOUT':
        return 'Déconnexion utilisateur';
      case 'ASSIGN_ROLE':
        return 'Assignation de rôle';
      case 'REMOVE_ROLE':
        return 'Suppression de rôle';
      default:
        return `${log.action} sur ${log.resource}`;
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsDialog(true);
  };

  const getStats = () => {
    const totalLogs = auditLogs.length;
    const todayLogs = auditLogs.filter(log => 
      new Date(log.timestamp).toDateString() === new Date().toDateString()
    ).length;
    const uniqueUsers = new Set(auditLogs.map(log => log.userId)).size;
    const actions = auditLogs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { totalLogs, todayLogs, uniqueUsers, actions };
  };

  const stats = getStats();

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
          Logs d'Audit RBAC
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadAuditLogs}
        >
          Actualiser
        </Button>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {stats.totalLogs}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total des logs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {stats.todayLogs}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aujourd'hui
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {stats.uniqueUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Utilisateurs actifs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {Object.keys(stats.actions).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Types d'actions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtres */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Rechercher dans les logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Action</InputLabel>
                <Select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                >
                  <MenuItem value="all">Toutes</MenuItem>
                  <MenuItem value="CREATE">Création</MenuItem>
                  <MenuItem value="UPDATE">Modification</MenuItem>
                  <MenuItem value="DELETE">Suppression</MenuItem>
                  <MenuItem value="LOGIN">Connexion</MenuItem>
                  <MenuItem value="LOGOUT">Déconnexion</MenuItem>
                  <MenuItem value="ASSIGN_ROLE">Assignation</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Ressource</InputLabel>
                <Select
                  value={filterResource}
                  onChange={(e) => setFilterResource(e.target.value)}
                >
                  <MenuItem value="all">Toutes</MenuItem>
                  <MenuItem value="user">Utilisateur</MenuItem>
                  <MenuItem value="role">Rôle</MenuItem>
                  <MenuItem value="permission">Permission</MenuItem>
                  <MenuItem value="auth">Authentification</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Utilisateur</InputLabel>
                <Select
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                >
                  <MenuItem value="all">Tous</MenuItem>
                  {Array.from(new Set(auditLogs.map(log => log.userId))).map(userId => {
                    const user = auditLogs.find(log => log.userId === userId);
                    return (
                      <MenuItem key={userId} value={userId}>
                        {user?.userName}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setFilterAction('all');
                  setFilterResource('all');
                  setFilterUser('all');
                }}
              >
                Réinitialiser
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Table des logs */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Action</TableCell>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Ressource</TableCell>
              <TableCell>Détails</TableCell>
              <TableCell>Date/Heure</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ mr: 1, bgcolor: getActionColor(log.action) + '.main' }}>
                      {getActionIcon(log.action)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {log.action}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getActionDescription(log)}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                      {log.userName[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {log.userName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {log.userEmail}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    {getResourceIcon(log.resource)}
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {log.resource}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap>
                    {JSON.stringify(log.details).substring(0, 50)}...
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatTimestamp(log.timestamp)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title="Voir les détails">
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(log)}
                      color="primary"
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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

      {/* Dialog des détails */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Security sx={{ mr: 1 }} />
            Détails du log d'audit
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Grid container spacing={2} mb={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Action
                  </Typography>
                  <Chip
                    label={selectedLog.action}
                    color={getActionColor(selectedLog.action)}
                    icon={getActionIcon(selectedLog.action)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Ressource
                  </Typography>
                  <Box display="flex" alignItems="center">
                    {getResourceIcon(selectedLog.resource)}
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {selectedLog.resource}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Utilisateur
                  </Typography>
                  <Typography variant="body2">
                    {selectedLog.userName} ({selectedLog.userEmail})
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date/Heure
                  </Typography>
                  <Typography variant="body2">
                    {formatTimestamp(selectedLog.timestamp)}
                  </Typography>
                </Grid>
                {selectedLog.ipAddress && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Adresse IP
                    </Typography>
                    <Typography variant="body2">
                      {selectedLog.ipAddress}
                    </Typography>
                  </Grid>
                )}
                {selectedLog.userAgent && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      User Agent
                    </Typography>
                    <Typography variant="body2" noWrap>
                      {selectedLog.userAgent}
                    </Typography>
                  </Grid>
                )}
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Détails de l'action
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
