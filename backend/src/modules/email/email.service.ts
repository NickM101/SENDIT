import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import * as ejs from 'ejs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<number>('SMTP_PORT') === 465,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendMail(
    to: string,
    subject: string,
    template: string,
    data: Record<string, any>,
  ) {
    const templatePath = path.resolve(
      __dirname,
      '../templates',
      `${template}.ejs`,
    );
    const html = await (ejs as any).renderFile(templatePath, data);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    await (this.transporter as any).sendMail({
      from: this.configService.get<string>('EMAIL_FROM'),
      to,
      subject,
      html,
    });
  }
}
