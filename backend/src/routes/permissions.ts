import { Router } from 'express';
import { PermissionController } from '../controllers/permissionController';
import { checkAuth, requirePermission } from '../middleware/auth';

const router = Router();

// All permission routes require authentication
router.use(checkAuth);

// GET /api/permissions - List all permissions
router.get('/', requirePermission('role.read'), PermissionController.getPermissions);

// GET /api/permissions/grouped - Get permissions grouped by resource
router.get('/grouped', requirePermission('role.read'), PermissionController.getPermissionsGroupedByResource);

// GET /api/permissions/:id - Get permission by ID
router.get('/:id', requirePermission('role.read'), PermissionController.getPermissionById);

// GET /api/permissions/resource/:resource - Get permissions by resource
router.get('/resource/:resource', requirePermission('role.read'), PermissionController.getPermissionsByResource);

// GET /api/permissions/action/:action - Get permissions by action
router.get('/action/:action', requirePermission('role.read'), PermissionController.getPermissionsByAction);

export default router;
