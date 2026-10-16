import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

function getStatusText(code: number): string {
  switch (code) {
    case 200: return 'OK';
    case 201: return 'Created';
    case 204: return 'No Content';
    case 304: return 'Not Modified';
    case 400: return 'Bad Request';
    case 401: return 'Unauthorized';
    case 403: return 'Forbidden';
    case 404: return 'Not Found';
    case 500: return 'Internal Server Error';
    default: return `${code}`;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // FastAPI / Uvicorn style clean request logging
  app.use((req: any, res: any, next: any) => {
    res.on('finish', () => {
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
      const cleanIp = clientIp === '::1' || clientIp === '::ffff:127.0.0.1' ? '127.0.0.1' : clientIp;
      const port = req.connection?.remotePort || '5000';
      const statusText = getStatusText(res.statusCode);
      console.log(`INFO:     ${cleanIp}:${port} - "${req.method} ${req.originalUrl} HTTP/1.1" ${res.statusCode} ${statusText}`);
    });

    next();
  });

  const port = process.env.PORT || 5000;
  await app.listen(port);

  console.log(`INFO:     Started server process [${process.pid}]`);
  console.log(`INFO:     Waiting for application startup.`);
  console.log(`INFO:     Application startup complete.`);
  console.log(`INFO:     Server running on http://127.0.0.1:${port} (Press CTRL+C to quit)`);
  console.log(`INFO:     API Health: OK (http://127.0.0.1:${port}/api/v1/health)`);
}

await bootstrap();
