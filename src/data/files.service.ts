import { ConsoleLogger, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { accessSync, constants, mkdirSync, readFileSync, writeFileSync } from 'fs';

@Injectable()
export class FSService {
	private _logger: ConsoleLogger = new ConsoleLogger('FS Service');

	constructor() {
		try {
			accessSync('assets', constants.F_OK);
		} catch (_) {
			mkdirSync('assets');
		}
	}

	public getFileById(id: string): Buffer {
		try {
			return readFileSync(`assets/${id}`);
		} catch (err) {
			this._logger.error(err);
			throw new NotFoundException(`No file found with id ${id}`);
		}
	}

	public createFile(id: string, data: Buffer): Buffer {
		try {
			writeFileSync(`assets/${id}`, data);
			return data;
		} catch (err) {
			this._logger.error(err);
			throw new InternalServerErrorException('Unable to create file');
		}
	}

	public replaceFile(id: string, data: Buffer): Buffer {
		try {
			accessSync(`assets/${id}`);
			writeFileSync(`assets/${id}`, data);
			return data;
		} catch (err) {
			this._logger.error(err);
			throw new NotFoundException(`No file found with id ${id}`);
		}
	}
}

