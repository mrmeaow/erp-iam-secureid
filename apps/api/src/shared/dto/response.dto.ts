import { ApiProperty } from '@nestjs/swagger';

export class ApiMetaDto {
  @ApiProperty({ example: '2024-03-02T15:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ required: false, example: '/v1/auth/login' })
  path?: string;

  @ApiProperty({ required: false, example: 'req-123456' })
  requestId?: string;
}

export class ApiErrorPayloadDto {
  @ApiProperty({ example: 'VALIDATION_ERROR' })
  code: string;

  @ApiProperty({ required: false })
  details?: any;
}

export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'OK' })
  message: string;

  @ApiProperty({ required: false })
  data: T | null;

  @ApiProperty()
  meta: ApiMetaDto;

  @ApiProperty({ required: false })
  error?: ApiErrorPayloadDto;
}

export class SuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation successful' })
  message: string;
}
