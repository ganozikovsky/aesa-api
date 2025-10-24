import { IsString, IsNumber, Min } from 'class-validator';

export class ChargeBookingDto {
  @IsString()
  paymentMethodId!: string;

  @IsNumber()
  @Min(0)
  totalPaid!: number;
}
