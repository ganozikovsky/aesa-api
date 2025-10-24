import { IsString, IsNumber, IsISO8601, Min } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  courtId!: string;

  @IsISO8601()
  dateISO!: string;

  @IsNumber()
  @Min(1)
  durationMin!: number;

  @IsNumber()
  @Min(0)
  listPrice!: number;

  @IsNumber()
  @Min(0)
  discount!: number;
}
