import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';
import { Pack } from './entities/pack.entity';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(Pack)
        private readonly packRepository: Repository<Pack>,
    ) {}

    async getAllProducts(options?: FindManyOptions<Product>) {
        return await this.productRepository.find({ ...options });
    }

    async updatePrices(products: UpdateProductPriceDto[]) {
        try {
            const validList = await this.validateUpdatePrices(products);

            if (validList.success === true) {
                await Promise.all(
                    products.map(async (dto) => {
                        const { product_code, new_price } = dto;
                        // Fetch the product from the database based on the product code
                        const product = await this.productRepository.findOneBy({ code: product_code });
                        return await this.productRepository.save({ ...product, sales_price: new_price });
                    }),
                );
                return { success: true, message: 'Preços atualizados com sucesso.' };
            }

            return { success: true, message: 'Revise os dados inseridos.' };
        } catch (error) {
            console.log(error);
            return { success: false, message: 'Ocorreu um erro durante a atualização dos preços.' };
        }
    }

    async validateUpdatePrices(updateProductPriceDtoList: UpdateProductPriceDto[]) {
        const results: {
            code: number;
            name?: string;
            sales_price?: number;
            new_price?: number;
            errors: string[];
        }[] = await Promise.all(
            updateProductPriceDtoList.map(async (dto) => {
                const { product_code, new_price } = dto;
                const validationErrors: string[] = [];
                // Fetch the product from the database based on the product code
                const product = await this.productRepository.findOne({ where: { code: product_code } });

                if (!product) {
                    return {
                        code: product_code,
                        errors: ['Produto não encontrado!'],
                    };
                }

                // Check if the new price is valid based on the requirements
                if (new_price < product.cost_price) {
                    validationErrors.push('O preço não pode ser menor que o custo');
                }

                const priceChangePercentage = ((new_price - product.sales_price) / product.sales_price) * 100;
                if (Math.abs(priceChangePercentage) > 10) {
                    validationErrors.push('O preço não pode ultrapassar 10% do valor atual');
                }

                // Check if the product is refer in pack table
                const packRelated = await this.packRepository.count({
                    where: [{ pack: product }, { product: product }],
                });
                if (packRelated > 0) {
                    const packErrors = await this.validateUpdatePricesPack(product, updateProductPriceDtoList);
                    validationErrors.push(...packErrors);
                }

                return {
                    code: product_code,
                    name: product.name,
                    sales_price: product.sales_price,
                    new_price: new_price,
                    errors: validationErrors,
                };
            }),
        );
        const success = results.every((result) => result.errors.length === 0);
        return { success, results };
    }

    private async validateUpdatePricesPack(product: Product, updateProductPriceDtoList: UpdateProductPriceDto[]) {
        const packValidationErrors: string[] = [];
        const { pack, packItems } = await this.findPackRelated(product);

        // sum pack items
        const packItemsTotal = packItems.reduce((total, packItem) => {
            const matchFromList = updateProductPriceDtoList.find(
                (updateProduct) => updateProduct.product_code === packItem.product.code,
            );
            const updatedPrice = matchFromList ? matchFromList.new_price : packItem.product.sales_price;
            return (total += updatedPrice * packItem.qty);
        }, 0);
        // search for the pack on list
        const matchPackFromList = updateProductPriceDtoList.find(
            (updateProduct) => updateProduct.product_code === pack.code,
        );
        // update packTotal
        const packTotal = matchPackFromList ? matchPackFromList.new_price : pack.sales_price;
        console.log(matchPackFromList);
        if (packItemsTotal !== packTotal) {
            packValidationErrors.push('O preço dos produtos não refletem o preço do pacote.');
        }

        return packValidationErrors;
    }

    private async findPackRelated(product: Product): Promise<{ pack: Product; packItems: Pack[] }> {
        let packItems: Pack[] = [];
        let pack = product;

        packItems = await this.packRepository.find({
            where: { pack: product },
            relations: ['pack', 'product'],
        });
        console.log('PACK ITEMS: ', packItems);
        if (packItems.length === 0) {
            const packItem = await this.packRepository.findOne({
                where: { product: product },
                relations: ['pack', 'product'],
            });
            console.log('FIND PACK: ', packItem.pack);
            packItems = await this.packRepository.find({
                where: { pack: packItem.pack },
                relations: ['pack', 'product'],
            });
            pack = packItem.pack;
        }
        console.log('PACK: ', pack);
        return {
            pack,
            packItems,
        };
    }
}
