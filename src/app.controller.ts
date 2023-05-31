import { BadRequestException, Controller, Get, Param, Post, Put, Res, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
	ApiBody,
	ApiConsumes,
	ApiCreatedResponse,
	ApiInternalServerErrorResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiParam,
	ApiProduces,
	ApiTags
} from '@nestjs/swagger';
import { Response } from 'express';
import { ObjectId } from 'mongodb';
import { AppService } from './app.service';
import { FileIDDTO, FileUploadDTO, ISEResponseDTO, NotFoundResponseDTO } from './file.dto';

@Controller()
@ApiTags('Routes')
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Post('/')
	@UseInterceptors(FileInterceptor('file'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: FileUploadDTO, description: 'The file to be uploaded' })
	@ApiCreatedResponse({ type: String, description: 'A single JSON string containing the ID of the new file.' })
	@ApiInternalServerErrorResponse({ type: ISEResponseDTO, description: 'An internal server error.' })
	public async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<ObjectId> {
		if (!file) {
			throw new BadRequestException('Must have file to upload.');
		}

		return this.appService.createFile(file);
	}

	@Get('/:id')
	@ApiProduces('application/octet-stream', 'application/json')
	@ApiParam({ name: 'id', description: 'The ID of the file to be retrieved (returned on file creation)' })
	@ApiOkResponse({ schema: { type: 'string', format: 'binary' }, description: 'A successful retrieval of the file.' })
	@ApiNotFoundResponse({ type: NotFoundResponseDTO, description: 'If no file with the requested ID was found on the server.' })
	@ApiInternalServerErrorResponse({ type: ISEResponseDTO, description: 'An internal server error.' })
	public async getFile(@Param() { id }: FileIDDTO, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
		const file = await this.appService.getFile(id);

		res.set({
			'Content-Type': file.type,
			'Content-Disposition': `attachment; filename="${file.name}"`
		});

		return new StreamableFile(file.content);
	}

	@Put('/:id')
	@UseInterceptors(FileInterceptor('file'))
	@ApiProduces('application/octet-stream', 'application/json')
	@ApiParam({ name: 'id', description: 'The ID of the file to be replaced (returned on file creation)' })
	@ApiOkResponse({ schema: { type: 'string', format: 'binary' }, description: 'A successful update of the file.' })
	@ApiNotFoundResponse({
		type: NotFoundResponseDTO,
		description: 'If no file with the requested ID was found on the server. This endpoint cannot be used to create files; use POST instead.'
	})
	@ApiInternalServerErrorResponse({ type: ISEResponseDTO, description: 'An internal server error.' })
	public async putFile(
		@Param() { id }: FileIDDTO,
		@UploadedFile() file: Express.Multer.File,
		@Res({ passthrough: true }) res: Response
	): Promise<StreamableFile> {
		const newFile = await this.appService.updateFile(id, file);

		res.set({
			'Content-Type': newFile.type,
			'Content-Disposition': `attachment; filename="${newFile.name}"`
		});

		return new StreamableFile(newFile.content);
	}
}

