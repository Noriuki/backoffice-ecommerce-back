import { ApiProperty } from '@nestjs/swagger';
import { IsDecimal, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateProductDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsInt()
    code: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsDecimal({ decimal_digits: '2' })
    cost_price: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsDecimal({ decimal_digits: '2' })
    sales_price: number;
}
