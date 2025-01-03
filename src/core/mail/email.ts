import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as path from 'path';
dotenv.config();

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly mailTransport;

  constructor() {
    // Validate environment variables
    const requiredVars = ['SMS_HOST', 'SMS_PORT', 'SMS_USER', 'SMS_PASS'];
    requiredVars.forEach((variable) => {
      if (!process.env[variable]) {
        this.logger.error(`Missing environment variable: ${variable}`);
        throw new Error('Email service configuration is incomplete.');
      }
    });

    // Set up mail transport
    this.mailTransport = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.SMS_PORT, 10),
      secure: true, // Use STARTTLS
      requireTLS: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // Do not fail on invalid certs
      },
    });

    // Verify mail transport
    this.mailTransport.verify((error) => {
      if (error) {
        this.logger.error('Mail transport verification failed:', error);
      } else {
        this.logger.log('Mail transport is ready to send emails.');
      }
    });
  }

  private async getTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(
      __dirname,
      `../../../templates/${templateName}.hbs`,
    );
    console.log('templatePath', templatePath);

    // Check if the template exists
    const templateExists = await fs.promises
      .access(templatePath)
      .then(() => true)
      .catch(() => false);
    if (!templateExists) {
      throw new Error(`Template ${templateName}.hbs not found`);
    }

    // Read the template file
    return await fs.promises.readFile(templatePath, 'utf8');
  }

  async sendMailNotification(
    to: string,
    subject: string,
    substitutionParams: Record<string, any>,
    templateName: string,
    options?: { from?: string; cc?: string; bcc?: string },
  ): Promise<void> {
    try {
      const {
        from = '"Unistore" <support@bhustore.ng>',
        cc,
        bcc,
      } = options || {};
      const templateSource = await this.getTemplate(templateName);
      const compiledTemplate = handlebars.compile(templateSource);

      const mailOptions = {
        from,
        to,
        cc,
        bcc,
        subject,
        html: compiledTemplate(substitutionParams),
      };

      await this.mailTransport.sendMail(mailOptions);
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Error sending email to ${to}:`,
        error.message,
        error.stack,
      );
    }
  }
}
