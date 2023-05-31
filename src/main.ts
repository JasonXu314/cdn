import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.useGlobalPipes(new ValidationPipe());
	app.enableCors({ origin: true, exposedHeaders: ['Content-Disposition'] });

	const config = new DocumentBuilder().setTitle('My CDN').setDescription('A persistent CDN for serving raw files').setVersion('1.0').build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('docs', app, document, { customSiteTitle: 'My CDN Docs' });

	await app.listen(process.env.PORT || 5000);
}
bootstrap();

