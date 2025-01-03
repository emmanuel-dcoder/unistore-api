import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { origins, PORT } from './config';
import { ValidationPipe } from '@nestjs/common';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './core/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: origins, credentials: true });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('Unistore backend')
    .setDescription(
      'A platform that connects buyers and merchants in a unique way',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(PORT);

  //console url
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
