import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();

// Endpoints principales de autenticación solicitados
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/social/google', AuthController.googleLogin);
router.post('/social/apple', AuthController.appleLogin);

// Endpoint complementario para refrescar tokens
router.post('/refresh', AuthController.refresh);

export default router;
