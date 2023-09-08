import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pack } from './entities/pack.entity';
import { Product } from './entities/product.entity';
import { FilesService } from './files.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
    imports: [TypeOrmModule.forFeature([Product, Pack])],
    controllers: [ProductsController],
    providers: [ProductsService, FilesService],
})
export class ProductsModule {}
