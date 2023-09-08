import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';
import { Pack } from './entities/pack.entity';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';

/**
 * O sistema deve ter a opção de atualizar os preços em massa recebendo um csv
 * - O preço não pode ser menor que o custo
 * - O preço não pode ultrapassar 10% de reajuste do valor atual
 * - O preço de pacotes devem refletir a soma dos produtos
 */

const mockPackItems = [
    {
        id: 1,
        pack: {
            code: 1020,
            name: 'SUPER PACK RED BULL VARIADOS - 6 UNIDADES',
            cost_price: 51.81,
            sales_price: 57.0,
        },
        product: {
            code: 19,
            name: 'ENERGÉTICO  RED BULL ENERGY DRINK 250ML',
            cost_price: 6.56,
            sales_price: 7.29,
        },
        qty: 3,
    },
    {
        id: 2,
        pack: {
            code: 1020,
            name: 'SUPER PACK RED BULL VARIADOS - 6 UNIDADES',
            cost_price: 51.81,
            sales_price: 57.0,
        },
        product: {
            code: 21,
            name: 'BEBIDA ENERGÉTICA RED BULL RED EDITION 250ML',
            cost_price: 10.71,
            sales_price: 11.71,
        },
        qty: 3,
    },
];

describe('ProductsService', () => {
    let productsService: ProductsService;
    let productRepository: Repository<Product>;
    let packRepository: Repository<Pack>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductsService,
                {
                    provide: getRepositoryToken(Product),
                    useClass: Repository,
                },
                {
                    provide: getRepositoryToken(Pack),
                    useClass: Repository,
                },
            ],
        }).compile();

        productsService = module.get<ProductsService>(ProductsService);
        productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
        packRepository = module.get<Repository<Pack>>(getRepositoryToken(Pack));
    });

    it('should be defined', () => {
        expect(productsService).toBeDefined();
    });

    describe('validateUpdatePrice', () => {
        it('should validate and perform valid price for a single product', async () => {
            //Arrange
            const testData: UpdateProductPriceDto[] = [{ product_code: 16, new_price: 21.0 }];
            jest.spyOn(productRepository, 'findOne').mockResolvedValue({
                code: 16,
                name: 'AZEITE  PORTUGUÊS  EXTRA VIRGEM GALLO 500ML',
                cost_price: 18.44,
                sales_price: 20.49,
            });
            jest.spyOn(packRepository, 'count').mockResolvedValue(0);
            // Act
            const result = await productsService.validateUpdatePrices(testData);
            // Assert
            expect(result).toEqual({
                success: true,
                results: [
                    {
                        code: 16,
                        name: 'AZEITE  PORTUGUÊS  EXTRA VIRGEM GALLO 500ML',
                        sales_price: 20.49,
                        new_price: 21.0,
                        errors: [],
                    },
                ],
            });
        });

        it('should validate and reject prices below cost', async () => {
            //Arrange
            const testData: UpdateProductPriceDto[] = [{ product_code: 16, new_price: 18.25 }];
            jest.spyOn(productRepository, 'findOne').mockResolvedValue({
                code: 16,
                name: 'AZEITE  PORTUGUÊS  EXTRA VIRGEM GALLO 500ML',
                cost_price: 18.44,
                sales_price: 19.0, // sales price change to validate price below cost
            });
            jest.spyOn(packRepository, 'count').mockResolvedValue(0);
            // Act
            const result = await productsService.validateUpdatePrices(testData);
            // Assert
            expect(result).toEqual({
                success: false,
                results: [
                    {
                        code: 16,
                        name: 'AZEITE  PORTUGUÊS  EXTRA VIRGEM GALLO 500ML',
                        sales_price: 19.0,
                        new_price: 18.25,
                        errors: ['O preço não pode ser menor que o custo'],
                    },
                ],
            });
        });

        it('should validate and reject prices exceeding 10% of current price', async () => {
            //Arrange
            const testData: UpdateProductPriceDto[] = [{ product_code: 16, new_price: 25.5 }];
            jest.spyOn(productRepository, 'findOne').mockResolvedValue({
                code: 16,
                name: 'AZEITE  PORTUGUÊS  EXTRA VIRGEM GALLO 500ML',
                cost_price: 18.44,
                sales_price: 19.0, // sales price change to validate price below cost
            });
            jest.spyOn(packRepository, 'count').mockResolvedValue(0);
            // Act
            const result = await productsService.validateUpdatePrices(testData);
            // Assert
            expect(result).toEqual({
                success: false,
                results: [
                    {
                        code: 16,
                        name: 'AZEITE  PORTUGUÊS  EXTRA VIRGEM GALLO 500ML',
                        sales_price: 19.0,
                        new_price: 25.5,
                        errors: ['O preço não pode ultrapassar 10% do valor atual'],
                    },
                ],
            });
        });

        it('should validate and accept based on component prices equal pack price', async () => {
            // Arrange
            const testData: UpdateProductPriceDto[] = [
                {
                    product_code: 1020,
                    new_price: 58.74,
                },
                {
                    product_code: 19,
                    new_price: 7.87,
                },
            ];

            jest.spyOn(productRepository, 'findOne')
                .mockResolvedValueOnce({
                    code: 1020,
                    name: 'SUPER PACK RED BULL VARIADOS - 6 UNIDADES',
                    cost_price: 51.81,
                    sales_price: 57.0,
                })
                .mockResolvedValueOnce({
                    code: 19,
                    name: 'ENERGÉTICO  RED BULL ENERGY DRINK 250ML',
                    cost_price: 6.56,
                    sales_price: 7.29,
                });
            jest.spyOn(packRepository, 'count').mockResolvedValue(2);
            jest.spyOn(packRepository, 'find').mockResolvedValueOnce(mockPackItems).mockResolvedValueOnce([]);
            jest.spyOn(packRepository, 'findOne').mockResolvedValueOnce({
                id: 1,
                pack: {
                    code: 1020,
                    name: 'SUPER PACK RED BULL VARIADOS - 6 UNIDADES',
                    cost_price: 51.81,
                    sales_price: 57.0,
                },
                product: {
                    code: 19,
                    name: 'ENERGÉTICO  RED BULL ENERGY DRINK 250ML',
                    cost_price: 6.56,
                    sales_price: 7.29,
                },
                qty: 3,
            });
            jest.spyOn(packRepository, 'find').mockResolvedValueOnce(mockPackItems);
            // Act
            const result = await productsService.validateUpdatePrices(testData);

            // Assert
            expect(result).toEqual({
                success: true,
                results: [
                    {
                        code: 1020,
                        errors: [],
                        name: 'SUPER PACK RED BULL VARIADOS - 6 UNIDADES',
                        new_price: 58.74,
                        sales_price: 57,
                    },
                    {
                        code: 19,
                        errors: [],
                        name: 'ENERGÉTICO  RED BULL ENERGY DRINK 250ML',
                        new_price: 7.87,
                        sales_price: 7.29,
                    },
                ],
            });
        });
        it('should validate and reject based on component prices equal pack price', async () => {
            // Arrange
            const testData: UpdateProductPriceDto[] = [
                {
                    product_code: 1020,
                    new_price: 58.74,
                },
                {
                    product_code: 19,
                    new_price: 25.5,
                },
            ];

            jest.spyOn(productRepository, 'findOne')
                .mockResolvedValueOnce({
                    code: 1020,
                    name: 'SUPER PACK RED BULL VARIADOS - 6 UNIDADES',
                    cost_price: 51.81,
                    sales_price: 57.0,
                })
                .mockResolvedValueOnce({
                    code: 19,
                    name: 'ENERGÉTICO  RED BULL ENERGY DRINK 250ML',
                    cost_price: 6.56,
                    sales_price: 7.29,
                });
            jest.spyOn(packRepository, 'count').mockResolvedValue(2);
            jest.spyOn(packRepository, 'find').mockResolvedValueOnce(mockPackItems).mockResolvedValueOnce([]);
            jest.spyOn(packRepository, 'findOne').mockResolvedValueOnce({
                id: 1,
                pack: {
                    code: 1020,
                    name: 'SUPER PACK RED BULL VARIADOS - 6 UNIDADES',
                    cost_price: 51.81,
                    sales_price: 57.0,
                },
                product: {
                    code: 19,
                    name: 'ENERGÉTICO  RED BULL ENERGY DRINK 250ML',
                    cost_price: 6.56,
                    sales_price: 7.29,
                },
                qty: 3,
            });
            jest.spyOn(packRepository, 'find').mockResolvedValueOnce(mockPackItems);

            // Act
            const result = await productsService.validateUpdatePrices(testData);

            // Assert
            expect(result).toEqual({
                success: false,
                results: [
                    {
                        code: 1020,
                        errors: ['O preço dos produtos não refletem o preço do pacote.'],
                        name: 'SUPER PACK RED BULL VARIADOS - 6 UNIDADES',
                        new_price: 58.74,
                        sales_price: 57,
                    },
                    {
                        code: 19,
                        errors: [
                            'O preço não pode ultrapassar 10% do valor atual',
                            'O preço dos produtos não refletem o preço do pacote.',
                        ],
                        name: 'ENERGÉTICO  RED BULL ENERGY DRINK 250ML',
                        new_price: 25.5,
                        sales_price: 7.29,
                    },
                ],
            });
        });
    });
});
