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
  async createInvoice(invoicePayloadDto: InvoicePayloadDto): Promise<Invoice> {
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
    });

    return await this.invoiceRepo.save(invoice);
  }
}
