# Diagramme des Relations RBAC - AccessGate PoC

## 🏗️ Architecture des Entités

```mermaid
erDiagram
    User ||--o{ UserRole : "a plusieurs"
    Role ||--o{ UserRole : "a plusieurs"
    Role ||--o{ RolePermission : "a plusieurs"
    Permission ||--o{ RolePermission : "a plusieurs"
    
    User {
        string id PK
        string email UK
        string password
        string firstName
        string lastName
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    Role {
        string id PK
        string name UK
        string description
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    Permission {
        string id PK
        string name UK
        string resource
        string action
        string description
        datetime createdAt
    }
    
    UserRole {
        string userId FK
        string roleId FK
        datetime assignedAt
        string assignedBy FK
    }
    
    RolePermission {
        string roleId FK
        string permissionId FK
        datetime assignedAt
    }
```

## 🔄 Flux d'Autorisation

```mermaid
flowchart TD
    A[Requête API] --> B{Token JWT valide?}
    B -->|Non| C[401 Unauthorized]
    B -->|Oui| D[Récupérer utilisateur + rôles + permissions]
    D --> E{Utilisateur actif?}
    E -->|Non| C
    E -->|Oui| F{Permission requise présente?}
    F -->|Non| G[403 Forbidden]
    F -->|Oui| H[Exécuter l'action]
    H --> I[Retourner la réponse]
```

## 🎭 Hiérarchie des Rôles

```mermaid
graph TD
    A[ADMIN] --> B[MANAGER]
    A --> C[VIEWER]
    B --> C
    
    A --> D[user.read]
    A --> E[user.write]
    A --> F[user.delete]
    A --> G[role.read]
    A --> H[role.write]
    A --> I[role.delete]
    A --> J[resource.read]
    A --> K[resource.write]
    A --> L[resource.delete]
    
    B --> D
    B --> E
    B --> G
    B --> J
    
    C --> D
    C --> G
    C --> J
```

## 🔐 Matrice des Permissions

| Rôle | user.read | user.write | user.delete | role.read | role.write | role.delete | resource.read | resource.write | resource.delete |
|------|-----------|------------|-------------|-----------|------------|-------------|---------------|----------------|-----------------|
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| MANAGER | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| VIEWER | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |

## 🚀 Flux de Données Frontend

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant F as Frontend
    participant A as API
    participant D as Database
    
    U->>F: Se connecter
    F->>A: POST /auth/login
    A->>D: Vérifier credentials
    D-->>A: Utilisateur + rôles + permissions
    A-->>F: JWT tokens
    F->>F: Stocker tokens + infos utilisateur
    
    U->>F: Accéder à /users
    F->>F: Vérifier permission 'user.read'
    F->>A: GET /users (avec token)
    A->>A: Vérifier JWT + permission
    A->>D: Récupérer utilisateurs
    D-->>A: Liste des utilisateurs
    A-->>F: Données des utilisateurs
    F-->>U: Afficher la page
```

## 🛡️ Middleware Stack

```mermaid
graph LR
    A[Requête] --> B[Helmet]
    B --> C[Correlation ID]
    C --> D[Request Logger]
    D --> E[CORS]
    E --> F[Body Parser]
    F --> G[Rate Limiter]
    G --> H[Auth Middleware]
    H --> I[Permission Check]
    I --> J[Controller]
    J --> K[Response]
    K --> L[Error Handler]
```

## 📊 États des Entités

### User States
```mermaid
stateDiagram-v2
    [*] --> Inactive
    Inactive --> Active : Activer
    Active --> Inactive : Désactiver
    Active --> [*] : Supprimer
```

### Role States
```mermaid
stateDiagram-v2
    [*] --> Inactive
    Inactive --> Active : Activer
    Active --> Inactive : Désactiver
    Active --> [*] : Supprimer (si non assigné)
```

## 🔍 Points de Contrôle de Sécurité

1. **Authentification** : JWT token valide
2. **Autorisation** : Permission requise présente
3. **État utilisateur** : Utilisateur actif
4. **État rôle** : Rôle actif
5. **Rate limiting** : Limite de requêtes respectée
6. **CORS** : Origine autorisée
7. **Validation** : Données d'entrée valides

## 📈 Métriques de Sécurité

- **Temps de réponse auth** : < 100ms
- **Taux d'erreur 401/403** : < 1%
- **Tentatives de connexion échouées** : Monitoring
- **Changements de permissions** : Audit log
- **Accès refusés** : Alertes automatiques
