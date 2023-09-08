import { MigrationInterface, QueryRunner } from "typeorm";

export class DatabaseUp1694133152834 implements MigrationInterface {
    name = 'DatabaseUp1694133152834'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`products\` (\`code\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`cost_price\` decimal(9,2) NOT NULL, \`sales_price\` decimal(9,2) NOT NULL, PRIMARY KEY (\`code\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`packs\` (\`id\` int NOT NULL AUTO_INCREMENT, \`qty\` bigint NOT NULL, \`pack_id\` int NULL, \`product_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`packs\` ADD CONSTRAINT \`FK_f73f5cd84bdbd711cba1f85713b\` FOREIGN KEY (\`pack_id\`) REFERENCES \`products\`(\`code\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`packs\` ADD CONSTRAINT \`FK_c456b48cdbbb7d8f167a9aebf6f\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`code\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`packs\` DROP FOREIGN KEY \`FK_c456b48cdbbb7d8f167a9aebf6f\``);
        await queryRunner.query(`ALTER TABLE \`packs\` DROP FOREIGN KEY \`FK_f73f5cd84bdbd711cba1f85713b\``);
        await queryRunner.query(`DROP TABLE \`packs\``);
        await queryRunner.query(`DROP TABLE \`products\``);
    }

}
