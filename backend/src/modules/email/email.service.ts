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
      'templates',
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

  /**
   * Send status update email
   */
  async sendStatusUpdateEmail(
    email: string,
    name: string,
    trackingNumber: string,
    status: string,
    trackingUrl: string,
  ): Promise<void> {
    const statusMessages = {
      PROCESSING: 'Your parcel is being processed',
      PICKED_UP: 'Your parcel has been picked up',
      IN_TRANSIT: 'Your parcel is in transit',
      OUT_FOR_DELIVERY: 'Your parcel is out for delivery',
      DELIVERED: 'Your parcel has been delivered',
      DELAYED: 'Your parcel delivery has been delayed',
      RETURNED: 'Your parcel is being returned',
    };

    const message =
      statusMessages[status] ||
      `Your parcel status has been updated to ${status}`;

    await this.sendMail(
      email,
      `Parcel ${trackingNumber} - Status Update`,
      'status-update',
      {
        name,
        trackingNumber,
        status,
        message,
        trackingUrl,
        supportUrl: `${process.env.FRONTEND_URL}/support`,
      },
    );
  }

  /**
   * Send delivery confirmation email
   */
  async sendDeliveryConfirmationEmail(
    email: string,
    name: string,
    trackingNumber: string,
    deliveryDate: Date,
  ): Promise<void> {
    await this.sendMail(
      email,
      `Parcel ${trackingNumber} - Delivered Successfully`,
      'delivery-confirmation',
      {
        name,
        trackingNumber,
        deliveryDate: deliveryDate.toLocaleDateString(),
        deliveryTime: deliveryDate.toLocaleTimeString(),
        trackingUrl: `${process.env.FRONTEND_URL}/track/${trackingNumber}`,
        supportUrl: `${process.env.FRONTEND_URL}/support`,
      },
    );
  }
}
