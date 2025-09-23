import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { checkAuth, requirePermission } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.use(checkAuth);

// GET /api/users - List users (admin only)
router.get('/', requirePermission('user.read'), UserController.getUsers);

// GET /api/users/:id - Get user by ID (self or admin)
router.get('/:id', UserController.getUserById);

// POST /api/users - Create user (admin/manager)
router.post('/', requirePermission('user.write'), UserController.createUser);

// PATCH /api/users/:id - Update user (self or admin/manager)
router.patch('/:id', UserController.updateUser);

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', requirePermission('user.delete'), UserController.deleteUser);

// POST /api/users/:id/roles - Assign role to user (admin/manager)
router.post('/:id/roles', requirePermission('role.write'), UserController.assignRole);

// DELETE /api/users/:id/roles/:roleId - Remove role from user (admin/manager)
router.delete('/:id/roles/:roleId', requirePermission('role.write'), UserController.removeRole);

export default router;
