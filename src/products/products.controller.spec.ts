import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';
import { Pack } from './entities/pack.entity';
import { Product } from './entities/product.entity';
import { FilesService } from './files.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
    let controller: ProductsController;
    let productService: ProductsService;
    let filesService: FilesService;
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ProductsController],
            providers: [
                ProductsService,
                FilesService,
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

        controller = module.get<ProductsController>(ProductsController);
        productService = module.get<ProductsService>(ProductsService);
        filesService = module.get<FilesService>(FilesService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('updatePrices', () => {
        it('should validate csv and return a valid converted list', async () => {
            // Arrange
            const mockFile: Express.Multer.File = {
                fieldname: 'file',
                originalname: 'test.csv',
                encoding: '7bit',
                mimetype: 'text/csv',
                buffer: Buffer.from('product_code,new_price\n16,21.0\n'),
                size: 12,
                destination: '',
                filename: '',
                path: '',
                stream: null,
            };

            jest.spyOn(filesService, 'parseCsv').mockResolvedValue([
                {
                    product_code: 16,
                    new_price: 21.0,
                },
            ]);

            jest.spyOn(productService, 'validateUpdatePrices').mockResolvedValue({
                success: true,
                results: [
                    {
                        code: 16,
                        name: 'Product 1',
                        sales_price: 20.49,
                        new_price: 21.0,
                        errors: [],
                    },
                ],
            });
            // Act
            const result = await controller.validateUpdatePricesByCsv(mockFile);

            // Assert
            expect(result).toEqual({
                success: true,
                results: [
                    {
                        code: 16,
                        name: 'Product 1',
                        sales_price: 20.49,
                        new_price: 21.0,
                        errors: [],
                    },
                ],
            });
        });

        it('should validate list and update prices from the list', async () => {
            // Arrange
            const mockList: UpdateProductPriceDto[] = [{ product_code: 16, new_price: 21.0 }];
            jest.spyOn(productService, 'updatePrices').mockResolvedValue({
                success: true,
                message: 'Preços atualizados com sucesso.',
            });
            // Act
            const result = await controller.updatePrices({ products: mockList });
            // Assert
            expect(result).toEqual({
                success: true,
                message: 'Preços atualizados com sucesso.',
            });
        });

        it('should validate list and reject prices from the list', async () => {
            // Arrange
            const mockList: UpdateProductPriceDto[] = [
                { product_code: 16, new_price: 21.0 },
                { product_code: 19, new_price: 30.2 },
            ];
            jest.spyOn(productService, 'updatePrices').mockResolvedValue({
                success: false,
                message: 'Revise os dados inseridos.',
            });
            // Act
            const result = await controller.updatePrices({ products: mockList });
            // Assert
            expect(result).toEqual({
                success: false,
                message: 'Revise os dados inseridos.',
            });
        });
    });
});
