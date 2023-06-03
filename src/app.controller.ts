import { BadRequestException, Controller, Get, Param, Post, Put, Query, Res, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
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
	ApiQuery,
	ApiTags
} from '@nestjs/swagger';
import { Response } from 'express';
import { ObjectId, WithId } from 'mongodb';
import { AppService } from './app.service';
import { DBFile, DBFileWithId } from './data/file.model';
import { FileIDDTO, FileSearchDTO, FileUploadDTO, ISEResponseDTO, NotFoundResponseDTO } from './file.dto';

@Controller()
@ApiTags('Routes')
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get('/')
	public async gui(): Promise<string> {
		const files = await this.appService.getAllFiles();

		return `
		<html data-theme="dark">
			<head>
				<title>CDN - GUI</title>
				<link rel="stylesheet" href="https://mypico.jasonxu.dev">
				<style>
				td img {
					max-height: 5lh;
				}

				.row {
					display: flex;
					flex-direction: row;
					justify-content: space-between;
				}

				.row label {
					flex-grow: 1;
				}
				</style>
				<script>window.files = ${JSON.stringify(files)}</script>
				<script>
				function makeEntry(id, name, extension, type) {
					const entry = document.createElement('tr');

					const idElem = document.createElement('th');
					idElem.scope = 'row';
					idElem.textContent = id;
					entry.appendChild(idElem);

					const nameElem = document.createElement('td');
					nameElem.textContent = name;
					entry.appendChild(nameElem);

					const extensionElem = document.createElement('td');
					extensionElem.textContent = extension;
					entry.appendChild(extensionElem);

					const typeElem = document.createElement('td');
					typeElem.textContent = type;
					entry.appendChild(typeElem);

					const previewElem = document.createElement('td');
					const img = document.createElement('img');
					img.src = \`${this.appService.getLocation()}/\${id}\`;
					previewElem.appendChild(img);
					entry.appendChild(previewElem);

					return entry;
				}
				</script>
			</head>
			<body>
				<main class="container">
					<div class="container row">
						<label for="search">
							Query
							<input id="search" type="text" oninput="debouncedSearch()" onchange="search()">
						</label>
						<label></label>
						<label for="field">
							Search By
							<select id="field" onchange="search()" required>
								<option value="name">Name</option>
								<option value="id">ID</option>
								<option value="type">MIME Type</option>
							</select>
						</label>
					</div>
					<table role="grid">
						<thead>
							<tr>
								<th scope="col">ID</th>
								<th scope="col">Name</th>
								<th scope="col">Extension</th>
								<th scope="col">MIME Type</th>
								<th scope="col">Preview</th>
							</tr>
						</thead>
						<tbody id="list">
						${files
							.map(
								(file) => `
							<tr>
								<th scope="row">${file._id}</th>
								<td>${file.name.replace('<', '&lt;').replace('>', '&gt;')}</td>
								<td>${file.ext.replace('<', '&lt;').replace('>', '&gt;')}</td>
								<td>${file.type}</td>
								<td><img src="${this.appService.getLocation()}/${file._id}"></td>
							</tr>`
							)
							.join('')}
						</tbody>
					</table>
				</main>
				<script>
				const list = document.getElementById('list'),
					query = document.getElementById('search'),
					field = document.getElementById('field');

				function display() {
					list.replaceChildren();

					for (const file of window.files) {
						const { _id, name, ext, type } = file;

						const entry = makeEntry(_id, name, ext, type);

						list.appendChild(entry);
					}
				}

				let timeout = null;
				function debouncedSearch() {
					if (timeout !== null) {
						clearTimeout(timeout);
					}

					setTimeout(search, 1500);
				}

				function search() {
					if (timeout !== null) {
						clearTimeout(timeout);
						timeout = null;
					}
					
					fetch(\`/search?\${field.value}=\${query.value}\`).then((res) => res.json())
						.then((data) => {
							window.files = data;
							display();
						})
				}
				</script>
			</body>
		</html>
		`;
	}

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

	@Get('/search')
	@ApiProduces('application/json')
	@ApiQuery({ name: 'id', description: 'A (partial) ID query' })
	@ApiQuery({ name: 'name', description: 'A (partial) name query' })
	@ApiQuery({ name: 'type', description: 'A (partial) MIME type query' })
	@ApiOkResponse({ type: DBFileWithId, isArray: true, description: 'A successful update of the file.' })
	public async searchFiles(@Query() { id, name, type }: FileSearchDTO): Promise<WithId<DBFile>[]> {
		if (id !== undefined) {
			return this.appService.searchFiles(id, 'id');
		} else if (name !== undefined) {
			return this.appService.searchFiles(name, 'name');
		} else if (type !== undefined) {
			return this.appService.searchFiles(type, 'type');
		} else {
			throw new BadRequestException('Must have one of `id` (file id), `name` (file name), or `type` (MIME type)');
		}
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

