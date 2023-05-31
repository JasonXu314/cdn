import { forceInit } from 'src/utils';

export class DBFile {
	ext: string = forceInit();
	type: string = forceInit();
	name: string = forceInit();
}

export class ApplicationFile extends DBFile {
	content: Buffer = forceInit();
}

