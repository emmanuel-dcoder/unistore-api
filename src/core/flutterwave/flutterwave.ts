import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class FlutterwaveService {
  private readonly logger = new Logger(FlutterwaveService.name);
  private readonly baseUrl = `${process.env.FLUTTERWAVE_BASE_URL}`;
  private readonly headers;

  constructor() {
    if (!process.env.FLUTTERWAVE_SECRET_KEY) {
      this.logger.error('Missing environment variable: FLW_SECRET_KEY');
      throw new Error('Flutterwave service configuration is incomplete.');
    }

    this.headers = {
      Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  async createPaymentRequest(
    email: string,
    amount: number,
    tx_ref: string,
    fullname: string,
    phone_number: string,
  ): Promise<any> {
    try {
      const data = {
        amount,
        email,
        currency: 'NGN',
        tx_ref,
        fullname,
        phone_number,
        meta: {
          sideNote: 'This is a side note to track this payment request',
        },
        is_permanent: false,
      };

      try {
        const response = await axios.post(
          `${this.baseUrl}/charges?type=bank_transfer`,
          data,
          {
            headers: this.headers,
          },
        );

        return response.data;
      } catch (error) {
        if (error.response) {
          throw new BadRequestException(
            'Error creating payment request',
            error.response.data.message || error.message,
          );
        } else if (error.request) {
          throw new BadRequestException(
            'No response received from payment API',
          );
        } else {
          throw new BadRequestException(
            'Error creating payment request',
            error.message,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        'Error fetching banks:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }

  async getAllBanks(country: string = 'NG'): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/banks/${country}`, {
        headers: this.headers,
      });
      return response.data;
    } catch (error) {
      this.logger.error(
        'Error fetching banks:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        error?.response?.message ?? error?.message,
        error?.status ?? error?.statusCode ?? 500,
      );
    }
  }
}
