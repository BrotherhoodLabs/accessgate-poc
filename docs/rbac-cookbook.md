# RBAC Cookbook - AccessGate PoC

Guide pratique pour utiliser le système RBAC d'AccessGate avec des exemples concrets.

## 🎯 Vue d'ensemble

Ce cookbook fournit des exemples pratiques pour :
- Configurer les permissions côté API
- Implémenter les contrôles d'accès côté frontend
- Gérer les rôles et permissions
- Déboguer les problèmes d'autorisation

## 🔐 Côté API

### Middleware d'autorisation

#### Vérifier une permission simple
```typescript
import { requirePermission } from '../middleware/auth';

// Seuls les utilisateurs avec la permission 'user.read' peuvent accéder
app.get('/users', requirePermission('user.read'), getUsers);
```

#### Vérifier un rôle spécifique
```typescript
import { requireRole } from '../middleware/auth';

// Seuls les administrateurs peuvent accéder
app.delete('/users/:id', requireRole('ADMIN'), deleteUser);
```

#### Vérifier plusieurs permissions
```typescript
// Créer un middleware personnalisé
const requireUserManagement = (req: AuthRequest, res: Response, next: NextFunction) => {
  const requiredPermissions = ['user.read', 'user.write'];
  const hasAllPermissions = requiredPermissions.every(permission => 
    req.user?.permissions.includes(permission)
  );
  
  if (!hasAllPermissions) {
    return next(createError('Insufficient permissions for user management', 403));
  }
  
  next();
};

app.get('/users', requireUserManagement, getUsers);
```

#### Logique d'autorisation personnalisée
```typescript
const requireUserOwnershipOrAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.params.id;
  const currentUserId = req.user?.id;
  
  // L'utilisateur peut modifier son propre profil
  if (userId === currentUserId) {
    return next();
  }
  
  // Ou s'il a la permission admin
  if (req.user?.permissions.includes('user.write')) {
    return next();
  }
  
  return next(createError('Access denied', 403));
};

app.patch('/users/:id', requireUserOwnershipOrAdmin, updateUser);
```

### Gestion des erreurs d'autorisation

```typescript
// Dans vos contrôleurs
export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Vérification supplémentaire si nécessaire
    if (!req.user?.permissions.includes('user.read')) {
      throw createError('Access denied', 403);
    }
    
    const users = await UserService.getUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
};
```

## ⚛️ Côté Frontend

### Protection des routes

#### Route protégée par permission
```typescript
import { ProtectedRoute } from './components/ProtectedRoute';

// Seuls les utilisateurs avec 'user.read' peuvent accéder
<Route 
  path="/users" 
  element={
    <ProtectedRoute requiredPermissions={['user.read']}>
      <UsersPage />
    </ProtectedRoute>
  } 
/>
```

#### Route protégée par rôle
```typescript
// Seuls les administrateurs peuvent accéder
<Route 
  path="/admin" 
  element={
    <ProtectedRoute requiredRoles={['ADMIN']}>
      <AdminPage />
    </ProtectedRoute>
  } 
/>
```

### Affichage conditionnel dans les composants

#### Masquer des boutons selon les permissions
```typescript
import { useAuthStore } from '../store/authStore';

const UsersPage = () => {
  const { user } = useAuthStore();
  
  return (
    <div>
      <h1>Utilisateurs</h1>
      
      {/* Bouton visible seulement si l'utilisateur peut créer des utilisateurs */}
      {user?.permissions.includes('user.write') && (
        <Button onClick={handleCreateUser}>
          Nouvel Utilisateur
        </Button>
      )}
      
      {/* Bouton visible seulement pour les admins */}
      {user?.roles.includes('ADMIN') && (
        <Button onClick={handleDeleteAll}>
          Supprimer Tout
        </Button>
      )}
    </div>
  );
};
```

#### Composant de bouton conditionnel
```typescript
interface ConditionalButtonProps {
  permission?: string;
  role?: string;
  children: React.ReactNode;
  onClick: () => void;
}

const ConditionalButton: React.FC<ConditionalButtonProps> = ({
  permission,
  role,
  children,
  onClick
}) => {
  const { user } = useAuthStore();
  
  const hasPermission = !permission || user?.permissions.includes(permission);
  const hasRole = !role || user?.roles.includes(role);
  
  if (!hasPermission || !hasRole) {
    return null;
  }
  
  return <Button onClick={onClick}>{children}</Button>;
};

// Utilisation
<ConditionalButton permission="user.write" onClick={handleEdit}>
  Modifier
</ConditionalButton>
```

### Gestion des états d'autorisation

#### Hook personnalisé pour les permissions
```typescript
import { useAuthStore } from '../store/authStore';

export const usePermissions = () => {
  const { user } = useAuthStore();
  
  const hasPermission = (permission: string) => {
    return user?.permissions.includes(permission) || false;
  };
  
  const hasRole = (role: string) => {
    return user?.roles.includes(role) || false;
  };
  
  const hasAnyPermission = (permissions: string[]) => {
    return permissions.some(permission => hasPermission(permission));
  };
  
  const hasAllPermissions = (permissions: string[]) => {
    return permissions.every(permission => hasPermission(permission));
  };
  
  return {
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    user,
  };
};

// Utilisation dans un composant
const MyComponent = () => {
  const { hasPermission, hasRole } = usePermissions();
  
  return (
    <div>
      {hasPermission('user.read') && <UserList />}
      {hasRole('ADMIN') && <AdminPanel />}
    </div>
  );
};
```

## 🛠️ Configuration des rôles et permissions

### Créer un nouveau rôle
```typescript
// Via l'API
const newRole = await apiService.createRole({
  name: 'EDITOR',
  description: 'Peut modifier le contenu',
  permissionIds: ['content.read', 'content.write']
});
```

### Assigner des permissions à un rôle
```typescript
// Ajouter une permission
await apiService.assignPermission(roleId, permissionId);

// Retirer une permission
await apiService.removePermission(roleId, permissionId);
```

### Assigner un rôle à un utilisateur
```typescript
// Via l'API
await apiService.assignRole(userId, roleId);

// Via l'interface utilisateur
const handleAssignRole = async (userId: string, roleId: string) => {
  try {
    await apiService.assignRole(userId, roleId);
    showNotification('Rôle assigné avec succès', 'success');
  } catch (error) {
    showNotification('Erreur lors de l\'assignation', 'error');
  }
};
```

## 🔍 Débogage des problèmes d'autorisation

### Vérifier les permissions d'un utilisateur
```typescript
// Côté backend - dans un contrôleur
console.log('User permissions:', req.user?.permissions);
console.log('User roles:', req.user?.roles);

// Côté frontend - dans un composant
const { user } = useAuthStore();
console.log('Current user:', user);
console.log('Permissions:', user?.permissions);
console.log('Roles:', user?.roles);
```

### Logs d'autorisation
```typescript
// Ajouter des logs dans les middlewares
export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    logger.info({
      userId: req.user?.id,
      permission,
      hasPermission: req.user?.permissions.includes(permission),
    }, 'Permission check');
    
    if (!req.user?.permissions.includes(permission)) {
      logger.warn({
        userId: req.user?.id,
        permission,
        path: req.path,
      }, 'Permission denied');
      
      return next(createError('Insufficient permissions', 403));
    }
    
    next();
  };
};
```

### Tester les autorisations
```typescript
// Test unitaire pour les permissions
describe('Permission Middleware', () => {
  it('should allow access with correct permission', () => {
    const req = {
      user: { permissions: ['user.read'] }
    } as AuthRequest;
    
    const middleware = requirePermission('user.read');
    const next = jest.fn();
    
    middleware(req, {} as Response, next);
    
    expect(next).toHaveBeenCalledWith();
  });
});
```

## 📋 Bonnes pratiques

### 1. Principe du moindre privilège
- Donnez seulement les permissions nécessaires
- Utilisez des rôles spécifiques plutôt que génériques
- Révoquez les permissions inutilisées

### 2. Validation côté client ET serveur
- Le frontend masque les éléments non autorisés
- Le backend valide toujours les permissions
- Ne jamais faire confiance au frontend pour la sécurité

### 3. Gestion des erreurs
- Messages d'erreur clairs pour les utilisateurs
- Logs détaillés pour les développeurs
- Codes d'erreur HTTP appropriés (401, 403)

### 4. Performance
- Cachez les permissions utilisateur côté frontend
- Évitez les vérifications répétitives
- Utilisez des index sur les colonnes de permissions

### 5. Maintenance
- Documentez les rôles et permissions
- Auditez régulièrement les accès
- Testez les changements d'autorisation

## 🚀 Exemples avancés

### Système de permissions hiérarchiques
```typescript
const PERMISSION_HIERARCHY = {
  'user.admin': ['user.write', 'user.read'],
  'user.write': ['user.read'],
  'content.admin': ['content.write', 'content.read'],
  'content.write': ['content.read'],
};

const hasPermissionWithHierarchy = (userPermissions: string[], requiredPermission: string) => {
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }
  
  const hierarchy = PERMISSION_HIERARCHY[requiredPermission] || [];
  return hierarchy.some(permission => userPermissions.includes(permission));
};
```

### Permissions basées sur le contexte
```typescript
const requireContextualPermission = (context: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const permission = `${context}.${req.method.toLowerCase()}`;
    
    if (!req.user?.permissions.includes(permission)) {
      return next(createError('Insufficient permissions', 403));
    }
    
    next();
  };
};

// Utilisation
app.get('/users', requireContextualPermission('user'), getUsers);
app.post('/users', requireContextualPermission('user'), createUser);
```

Ce cookbook vous donne tous les outils nécessaires pour implémenter et maintenir un système RBAC robuste avec AccessGate PoC.
