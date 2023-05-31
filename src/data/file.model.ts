import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { forceInit } from 'src/utils';

export class DBFile {
	@ApiProperty({ name: 'ext', type: String, description: 'Extension of the file' })
	ext: string = forceInit();

	@ApiProperty({ name: 'type', type: String, description: 'The MIME type of the file' })
	type: string = forceInit();

	@ApiProperty({ name: 'name', type: String, description: 'The given name of the file (including extension)' })
	name: string = forceInit();
}

export class DBFileWithId extends DBFile {
	@ApiProperty({ name: '_id', type: String, description: 'The unique ID of the file' })
	_id: ObjectId = forceInit();
}

export class ApplicationFile extends DBFile {
	content: Buffer = forceInit();
}

