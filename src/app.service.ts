import { ConsoleLogger, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { DBService } from './data/db.service';
import { ApplicationFile } from './data/file.model';
import { FSService } from './data/files.service';
import { getExtension } from './utils';

@Injectable()
export class AppService {
	private _logger: ConsoleLogger = new ConsoleLogger('CDN Service');

	constructor(private fs: FSService, private db: DBService) {}

	public async createFile(file: Express.Multer.File): Promise<ObjectId> {
		try {
			const id = await this.db.storeFile({ name: file.originalname, type: file.mimetype, ext: getExtension(file.originalname) });
			this.fs.createFile(id.toString('hex'), file.buffer);

			return id;
		} catch (err) {
			this._logger.error(err);
			throw new InternalServerErrorException('Unable to save file');
		}
	}

	public async getFile(id: string): Promise<ApplicationFile> {
		try {
			const metadata = await this.db.getMetadata(id);

			if (!metadata) {
				throw new NotFoundException(`File with id ${id} not found`);
			}

			const content = this.fs.getFileById(id);

			return { ...metadata, content };
		} catch (err: unknown) {
			if (err instanceof NotFoundException) {
				throw err;
			}

			this._logger.error(err);
			throw new InternalServerErrorException(`Failed to read file ${id}: ${err}`);
		}
	}

	public async updateFile(id: string, file: Express.Multer.File): Promise<ApplicationFile> {
		try {
			const metadata = await this.db.getMetadata(id);

			if (!metadata) {
				throw new NotFoundException(`File with id ${id} not found`);
			}

			const newMetadata = await this.db.updateFile(id, { name: file.originalname, type: file.mimetype, ext: getExtension(file.originalname) });

			if (!newMetadata) {
				throw new InternalServerErrorException('Unable to update file metadata');
			}

			const content = this.fs.replaceFile(id, file.buffer);

			return { ...newMetadata, content };
		} catch (err: unknown) {
			if (err instanceof NotFoundException) {
				throw err;
			}

			this._logger.error(err);
			throw new InternalServerErrorException(`Failed to read file ${id}: ${err}`);
		}
	}
}
