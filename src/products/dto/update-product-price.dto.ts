import { IsDecimal, IsInt, IsNotEmpty } from 'class-validator';

export class UpdateProductPriceDto {
    @IsNotEmpty()
    @IsInt()
    product_code: number;

    @IsNotEmpty()
    @IsDecimal({ decimal_digits: '2' })
    new_price: number;
}
