import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { forceInit } from './utils';

export class FileUploadDTO {
	@ApiProperty({ type: 'string', format: 'binary' })
	file: string = forceInit();
}

export class FileIDDTO {
	@IsString()
	@Length(24, 24)
	id: string = forceInit();
}

export class FileSearchDTO {
	@IsString()
	@IsOptional()
	name: string = forceInit();

	@IsString()
	@MaxLength(24)
	@IsOptional()
	id: string = forceInit();

	@IsString()
	@IsOptional()
	type: string = forceInit();
}

export class ISEResponseDTO {
	@ApiProperty({ default: 500 })
	statusCode: number = forceInit();

	@ApiProperty()
	message: string = forceInit();

	@ApiProperty({ default: 'Internal Server Error' })
	error: string = forceInit();
}

export class NotFoundResponseDTO {
	@ApiProperty({ default: 404 })
	statusCode: number = forceInit();

	@ApiProperty()
	message: string = forceInit();

	@ApiProperty({ default: 'Not Found' })
	error: string = forceInit();
}

