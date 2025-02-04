import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { origins, PORT } from './config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './core/common/filters/all-exceptions.filter';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: origins, credentials: true });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Unistore backend')
    .setDescription(
      'A platform that connects buyers and merchants in a unique way',
    )
    .addApiKey(
      { type: 'apiKey', name: 'x-access-token', in: 'header' },
      'x-access-token',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'apiKey',
        name: 'x-access-token',
        in: 'header',
        description: 'Enter JWT token as x-access-token in the header',
      },
      'x-access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const adapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(adapterHost));

  await app.listen(PORT);

  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
