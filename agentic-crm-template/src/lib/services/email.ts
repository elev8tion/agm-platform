// Mock Email Service
// Production-ready interface - swap for Resend when ready

import { dataStore, type Email } from './dataStore';

export type EmailOptions = {
  to: string | string[];
  from?: string;
  subject: string;
  body: string;
  html?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
};

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
};

const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  'welcome': {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to {{companyName}}!',
    body: `Hi {{firstName}},

Welcome to {{companyName}}! We're excited to help you find your dream home.

Your agent {{agentName}} will be in touch shortly to discuss your requirements.

Best regards,
{{companyName}} Team`,
    variables: ['firstName', 'companyName', 'agentName']
  },
  'property-alert': {
    id: 'property-alert',
    name: 'New Property Alert',
    subject: 'New Property Match: {{address}}',
    body: `Hi {{firstName}},

We found a new property that matches your criteria!

{{address}}
{{city}}, {{state}} {{zipCode}}

Price: {{price}}
Bedrooms: {{bedrooms}} | Bathrooms: {{bathrooms}}
Square Feet: {{sqft}}

{{description}}

Schedule a showing: {{showingLink}}

Best regards,
{{agentName}}`,
    variables: ['firstName', 'address', 'city', 'state', 'zipCode', 'price', 'bedrooms', 'bathrooms', 'sqft', 'description', 'agentName', 'showingLink']
  },
  'appointment-reminder': {
    id: 'appointment-reminder',
    name: 'Appointment Reminder',
    subject: 'Reminder: Property Showing Tomorrow',
    body: `Hi {{firstName}},

This is a reminder about your property showing tomorrow:

Property: {{address}}
Date: {{date}}
Time: {{time}}
Location: {{location}}

See you there!

{{agentName}}
{{agentPhone}}`,
    variables: ['firstName', 'address', 'date', 'time', 'location', 'agentName', 'agentPhone']
  },
  'offer-submitted': {
    id: 'offer-submitted',
    name: 'Offer Submitted',
    subject: 'Your Offer Has Been Submitted',
    body: `Hi {{firstName}},

Great news! Your offer on {{address}} has been submitted to the seller.

Offer Amount: {{offerAmount}}
Contingencies: {{contingencies}}

We'll keep you updated on the seller's response.

Best regards,
{{agentName}}`,
    variables: ['firstName', 'address', 'offerAmount', 'contingencies', 'agentName']
  }
};

class EmailService {
  private defaultFrom = 'noreply@agrm.com';

  // ===== SEND EMAIL =====
  async send(options: EmailOptions, tenantId: string, senderId: string): Promise<Email> {
    console.log('[MOCK EMAIL] Sending email...');
    console.log('  To:', Array.isArray(options.to) ? options.to.join(', ') : options.to);
    console.log('  From:', options.from || this.defaultFrom);
    console.log('  Subject:', options.subject);
    console.log('  Body preview:', options.body.substring(0, 100) + '...');

    // In production: use Resend
    // const { data, error } = await resend.emails.send({
    //   from: options.from || this.defaultFrom,
    //   to: Array.isArray(options.to) ? options.to : [options.to],
    //   subject: options.subject,
    //   html: options.html || options.body,
    //   reply_to: options.replyTo,
    //   cc: options.cc,
    //   bcc: options.bcc,
    //   attachments: options.attachments
    // });

    const email = await dataStore.createEmail({
      tenantId,
      to: Array.isArray(options.to) ? options.to : [options.to],
      from: options.from || this.defaultFrom,
      subject: options.subject,
      body: options.body,
      status: 'SENT',
      sentAt: new Date(),
      senderId
    });

    console.log(`[MOCK EMAIL] ✅ Email sent (ID: ${email.id})`);
    console.log('📧 In production, this would be sent via Resend');

    return email;
  }

  // ===== SEND FROM TEMPLATE =====
  async sendFromTemplate(
    templateId: string,
    variables: Record<string, string>,
    to: string | string[],
    tenantId: string,
    senderId: string
  ): Promise<Email> {
    console.log(`[MOCK EMAIL] Sending email from template: ${templateId}`);

    const template = EMAIL_TEMPLATES[templateId];
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Replace variables in subject and body
    let subject = template.subject;
    let body = template.body;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      body = body.replace(new RegExp(placeholder, 'g'), value);
    }

    return await this.send({
      to,
      subject,
      body
    }, tenantId, senderId);
  }

  // ===== BULK SEND =====
  async sendBulk(
    emails: Array<{ to: string; subject: string; body: string }>,
    tenantId: string,
    senderId: string
  ): Promise<Email[]> {
    console.log(`[MOCK EMAIL] Sending bulk emails (${emails.length} recipients)`);

    // In production: use Resend batch API
    // const results = await resend.emails.sendBatch(emails.map(email => ({
    //   from: this.defaultFrom,
    //   to: email.to,
    //   subject: email.subject,
    //   html: email.body
    // })));

    const sent: Email[] = [];
    for (const email of emails) {
      const result = await this.send({
        to: email.to,
        subject: email.subject,
        body: email.body
      }, tenantId, senderId);
      sent.push(result);
    }

    console.log(`[MOCK EMAIL] ✅ Bulk send complete (${sent.length} emails)`);
    return sent;
  }

  // ===== GET TEMPLATES =====
  getTemplates(): EmailTemplate[] {
    return Object.values(EMAIL_TEMPLATES);
  }

  getTemplate(id: string): EmailTemplate | undefined {
    return EMAIL_TEMPLATES[id];
  }

  // ===== TRACK EMAIL EVENTS =====
  async trackOpen(emailId: string): Promise<void> {
    console.log(`[MOCK EMAIL] Email opened: ${emailId}`);
    // In production: Resend provides webhooks for tracking
  }

  async trackClick(emailId: string, url: string): Promise<void> {
    console.log(`[MOCK EMAIL] Link clicked in email ${emailId}: ${url}`);
    // In production: Resend provides webhooks for tracking
  }

  // ===== EMAIL VERIFICATION =====
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    console.log(`[MOCK EMAIL] Sending verification email to ${email}`);

    const verificationUrl = `https://app.agrm.com/verify?token=${token}`;

    await this.send({
      to: email,
      subject: 'Verify Your Email Address',
      body: `Please verify your email address by clicking this link: ${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.`
    }, 'system', 'system');
  }

  // ===== PASSWORD RESET =====
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    console.log(`[MOCK EMAIL] Sending password reset email to ${email}`);

    const resetUrl = `https://app.agrm.com/reset-password?token=${token}`;

    await this.send({
      to: email,
      subject: 'Reset Your Password',
      body: `You requested a password reset. Click this link to reset your password: ${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.`
    }, 'system', 'system');
  }

  // ===== GET EMAIL HISTORY =====
  async getEmailHistory(tenantId: string, filters?: { senderId?: string; contactId?: string }): Promise<Email[]> {
    return await dataStore.listEmails(tenantId, filters);
  }
}

export const emailService = new EmailService();

// ===== PRODUCTION INTEGRATION NOTES =====
/*
TO SWITCH TO PRODUCTION:

1. Install Resend (already done):
   npm install resend

2. Add environment variable:
   RESEND_API_KEY=re_...

3. Initialize Resend client:
   import { Resend } from 'resend';
   const resend = new Resend(process.env.RESEND_API_KEY);

4. Replace send() method:
   async send(options: EmailOptions): Promise<Email> {
     const { data, error } = await resend.emails.send({
       from: options.from || this.defaultFrom,
       to: Array.isArray(options.to) ? options.to : [options.to],
       subject: options.subject,
       html: options.html || options.body,
       reply_to: options.replyTo,
       cc: options.cc,
       bcc: options.bcc,
       attachments: options.attachments
     });

     if (error) {
       throw new Error(`Failed to send email: ${error.message}`);
     }

     return await dataStore.createEmail({
       tenantId,
       to: Array.isArray(options.to) ? options.to : [options.to],
       from: options.from || this.defaultFrom,
       subject: options.subject,
       body: options.body,
       status: 'SENT',
       sentAt: new Date(),
       senderId,
       externalId: data.id
     });
   }

5. Set up webhooks for tracking:
   - Configure webhook endpoint in Resend dashboard
   - Handle email.opened, email.clicked, email.bounced events

6. Create email templates in Resend dashboard
   - Or use React Email for custom templates

Example webhook handler:
POST /api/webhooks/email
{
  "type": "email.opened",
  "data": {
    "email_id": "xxx",
    "opened_at": "2024-01-01T12:00:00Z"
  }
}
*/
