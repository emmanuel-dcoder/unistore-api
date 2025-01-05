import { PartialType } from '@nestjs/swagger';
import { CreateOrderDto } from './create-invoice.dto';

export class UpdateInvoiceDto extends PartialType(CreateOrderDto) {}
