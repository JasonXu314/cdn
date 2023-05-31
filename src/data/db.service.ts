import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { MongoClient, ObjectId, WithId } from 'mongodb';
import { DBFile } from './file.model';

@Injectable()
export class DBService {
	private _db: Promise<MongoClient>;
	private _logger: Logger = new Logger('DB Service');

	constructor() {
		this._db = MongoClient.connect(process.env.MONGODB_URL!).then((client) => {
			this._logger.log('Connected to DB');
			return client;
		});
	}

	public async storeFile(data: DBFile): Promise<ObjectId> {
		return (await (await this._db).db(this._getDB()).collection<DBFile>('files').insertOne(data)).insertedId;
	}

	public async updateFile(id: string, data: Partial<DBFile>): Promise<WithId<DBFile> | null> {
		return (
			await (
				await this._db
			)
				.db(this._getDB())
				.collection<DBFile>('files')
				.findOneAndUpdate({ _id: ObjectId.createFromHexString(id) }, { $set: data })
		).value;
	}

	public async getMetadata(id: string): Promise<DBFile | null> {
		return (await this._db)
			.db(this._getDB())
			.collection<DBFile>('files')
			.findOne({ _id: ObjectId.createFromHexString(id) });
	}

	private _getDB(): string {
		switch (process.env.STAGE) {
			case 'test':
				return 'staging';
			case 'local':
			case 'live':
				return 'main';
			default:
				this._logger.log(`Unrecognized staging environment ${process.env.STAGE}`);
				throw new InternalServerErrorException(`Unrecognized staging environment ${process.env.STAGE}`);
		}
	}
}

