import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      process.env.FRONTEND_HOME_URL || 'http://localhost:3000',
      'https://wynnpool.weikuwu.me',
      'https://weight.wynnpool.com',
      'https://www.wynnpool.com',
      'https://dev.wynnpool.com',
      'https://wynnpool.com'
    ],
    credentials: true,
  });
  app.use(cookieParser());
  app.use(passport.initialize());

  // Fix for session cookie domain in dev
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('Wynnpool API')
    .setDescription(':3')
    .setVersion('1.0')
    .addTag('users')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('', app, document);

  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
