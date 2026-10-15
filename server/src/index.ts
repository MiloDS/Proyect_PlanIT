import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import { initDb } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging simple de peticiones
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Rutas principales
app.use('/api/v1/auth', authRoutes);

// Health check para verificar estado del servidor y PostgreSQL
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'PlanIt Backend API',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString(),
  });
});

// Manejo de rutas inexistentes (404)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Ruta ${req.method} ${req.path} no encontrada.`,
    },
  });
});

// Manejo global de errores (500)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ocurrió un error inesperado en el servidor.',
    },
  });
});

// Inicio del servidor e inicialización de PostgreSQL
async function startServer() {
  try {
    await initDb();
  } catch (err) {
    console.warn(
      '⚠️ No se pudo conectar inmediatamente a PostgreSQL. El servidor iniciará, pero asegúrate de que el servicio de PostgreSQL esté activo con DATABASE_URL.'
    );
  }

  const portNumber = Number(PORT) || 3000;
  app.listen(portNumber, '0.0.0.0', () => {
    console.log(`🚀 Servidor PlanIt escuchando en:`);
    console.log(`   - Local:    http://localhost:${portNumber}`);
    console.log(`   - Red WiFi: http://192.168.1.6:${portNumber}`);
    console.log(`📌 Endpoints de Auth listos en /api/v1/auth`);
  });
}

startServer();

export default app;
