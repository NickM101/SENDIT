import { ConfigService } from '@nestjs/config';

export interface SecurityConfig {
  cors: {
    origin: string[] | boolean;
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
  };
  helmet: {
    contentSecurityPolicy: boolean;
    crossOriginEmbedderPolicy: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
    message: string;
    standardHeaders: boolean;
    legacyHeaders: boolean;
  };
}

export const getSecurityConfig = (
  configService: ConfigService,
): SecurityConfig => {
  const environment = configService.get<string>('NODE_ENV', 'development');
  const frontendUrl = configService.get<string>(
    'FRONTEND_URL',
    'http://localhost:4200',
  );
  const adminUrl = configService.get<string>(
    'ADMIN_URL',
    'http://localhost:4201',
  );

  return {
    cors: {
      origin: environment === 'production' ? [frontendUrl, adminUrl] : true, // Allow all origins in development
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
      ],
    },
    helmet: {
      contentSecurityPolicy: environment === 'production',
      crossOriginEmbedderPolicy: false, // Disable for API
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: environment === 'production' ? 100 : 1000, // Stricter in production
      message: 'Too many requests, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
    },
  };
};
