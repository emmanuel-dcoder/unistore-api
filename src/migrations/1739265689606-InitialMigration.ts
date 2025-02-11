import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1739265689606 implements MigrationInterface {
    name = 'InitialMigration1739265689606'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_ed1bcfe9ae995a567b529f316a2"`);
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_ddeb4d6d8e4c54d7d71a962e6d1"`);
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_ff0c0301a95e517153df97f6812"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "bank_name" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD "bank_account_number" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD "bank_account_name" character varying`);
        await queryRunner.query(`ALTER TABLE "product" ADD "is_approved" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "invoice" ADD "is_withdrawn" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "invoice" ADD "withdrawal_approved" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "invoice" ADD "withdrawal_request" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_ed1bcfe9ae995a567b529f316a2" FOREIGN KEY ("school_id") REFERENCES "school"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "FK_ff0c0301a95e517153df97f6812" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "FK_ddeb4d6d8e4c54d7d71a962e6d1" FOREIGN KEY ("school_id") REFERENCES "school"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_ddeb4d6d8e4c54d7d71a962e6d1"`);
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_ff0c0301a95e517153df97f6812"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_ed1bcfe9ae995a567b529f316a2"`);
        await queryRunner.query(`ALTER TABLE "invoice" DROP COLUMN "withdrawal_request"`);
        await queryRunner.query(`ALTER TABLE "invoice" DROP COLUMN "withdrawal_approved"`);
        await queryRunner.query(`ALTER TABLE "invoice" DROP COLUMN "is_withdrawn"`);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "is_approved"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bank_account_name"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bank_account_number"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bank_name"`);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "FK_ff0c0301a95e517153df97f6812" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "FK_ddeb4d6d8e4c54d7d71a962e6d1" FOREIGN KEY ("school_id") REFERENCES "school"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_ed1bcfe9ae995a567b529f316a2" FOREIGN KEY ("school_id") REFERENCES "school"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
