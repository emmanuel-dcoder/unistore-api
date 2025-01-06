import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from 'src/product/entities/product.entity';
import { Invoice } from '../entities/invoice.entity';
import { InvoicePayloadDto } from '../dto/create-invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  // Create an invoice
  async createInvoice(
    invoicePayloadDto: InvoicePayloadDto,
    user: string,
  ): Promise<Invoice> {
    const { productId, quantity } = invoicePayloadDto;

    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const invoice = this.invoiceRepo.create({
      product,
      quantity,
      user: { id: user } as any,
    });

    return await this.invoiceRepo.save(invoice);
  }

  async getAllInvoices(): Promise<Invoice[]> {
    return this.invoiceRepo.find({
      relations: ['user'],
      select: {
        user: {
          id: true,
          first_name: true,
          last_name: true,
          profile_picture: true,
        },
      },
    });
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    return this.invoiceRepo.findOne({ where: { id } });
  }
}
