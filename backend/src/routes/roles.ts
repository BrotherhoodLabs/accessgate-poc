import { Router } from 'express';
import { RoleController } from '../controllers/roleController';
import { checkAuth, requirePermission } from '../middleware/auth';

const router = Router();

// All role routes require authentication
router.use(checkAuth);

// GET /api/roles - List roles
router.get('/', requirePermission('role.read'), RoleController.getRoles);

// GET /api/roles/:id - Get role by ID
router.get('/:id', requirePermission('role.read'), RoleController.getRoleById);

// POST /api/roles - Create role
router.post('/', requirePermission('role.write'), RoleController.createRole);

// PATCH /api/roles/:id - Update role
router.patch('/:id', requirePermission('role.write'), RoleController.updateRole);

// DELETE /api/roles/:id - Delete role
router.delete('/:id', requirePermission('role.delete'), RoleController.deleteRole);

// POST /api/roles/:id/permissions - Assign permission to role
router.post('/:id/permissions', requirePermission('role.write'), RoleController.assignPermission);

// DELETE /api/roles/:id/permissions/:permissionId - Remove permission from role
router.delete('/:id/permissions/:permissionId', requirePermission('role.write'), RoleController.removePermission);

export default router;
