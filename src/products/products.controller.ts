import { Body, Controller, Get, Post, UploadedFile, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FindManyOptions } from 'typeorm';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';
import { Product } from './entities/product.entity';
import { FilesService } from './files.service';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
    constructor(
        private readonly productsService: ProductsService,
        private readonly filesService: FilesService,
    ) {}

    @Get('/')
    async getAllProducts(options?: FindManyOptions<Product>) {
        return await this.productsService.getAllProducts({ ...options });
    }

    @Post('/update-prices')
    @UsePipes(new ValidationPipe({ transform: true }))
    async updatePrices(@Body() { products }: { products: UpdateProductPriceDto[] }) {
        return await this.productsService.updatePrices(products);
    }

    @Post('/check-csv')
    @UseInterceptors(FileInterceptor('file'))
    async validateUpdatePricesByCsv(@UploadedFile() file: Express.Multer.File) {
        const csvData = await this.filesService.parseCsv(file);
        return await this.productsService.validateUpdatePrices(csvData);
    }
}
