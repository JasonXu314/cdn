import { Module } from '@nestjs/common';
import { DBService } from './db.service';
import { FSService } from './files.service';

@Module({
	imports: [],
	exports: [DBService, FSService],
	providers: [DBService, FSService]
})
export class DataModule {}

