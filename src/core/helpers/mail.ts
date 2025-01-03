import * as dotenv from 'dotenv';
import * as handlebars from 'handlebars';
import * as path from 'path';
import * as fs from 'fs';
import { ObjectLiteral } from '../types/types';
import * as sendgrid from '@sendgrid/mail';
import { SENDGRID_API_KEY } from '../../config';

dotenv.config();

interface IMailer {
  mailService?: 'sendgrid';
}

class Mailer {
  constructor() {
    this.configure();
  }
  private configure() {
    sendgrid.setApiKey(SENDGRID_API_KEY);
  }

  sendEmail(data: any) {
    return sendgrid.send(data);
  }

  renderHtml(data: ObjectLiteral, template = 'receipt.html') {
    return new Promise((resolve, reject) => {
      const pathName = path.join(__dirname, `../templates/emails/${template}`);
      this.handleReadFile(pathName, function (err: unknown, html: string) {
        if (err) {
          reject(err);
        }

        const template = handlebars.compile(html);
        const htmlToSend = template(data);

        if (!htmlToSend) {
          reject('Unable to renderData to template');
        }

        resolve(htmlToSend);
      });
    });
  }

  private handleReadFile(path: string, callback: (...args) => void) {
    fs.readFile(path, { encoding: 'utf-8' }, function (err, html) {
      if (err) {
        throw err;
      } else {
        callback(null, html);
      }
    });
  }
}

export default new Mailer();
