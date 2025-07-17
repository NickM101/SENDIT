import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getSecurityConfig } from './config/security.config';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuthExceptionsFilter } from './common/filters/auth-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const securityConfig = getSecurityConfig(configService);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Security middleware
  app.use(helmet(securityConfig.helmet));

  // CORS configuration
  app.enableCors(securityConfig.cors);

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));
  app.useGlobalFilters(new AuthExceptionsFilter());

  app.useGlobalInterceptors(new ResponseInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: false,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('SendIT API')
    .setDescription('API documentation for the SendIT courier service application.')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  console.log(`🚀 SendIT API is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap().catch((error) => {
  console.error('Error starting the application:', error);
  process.exit(1);
});
