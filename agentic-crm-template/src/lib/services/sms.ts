// Mock SMS Service
// Production-ready interface - swap for Twilio when ready

import { dataStore, type SMSMessage } from './dataStore';

export type SMSOptions = {
  to: string;
  body: string;
  from?: string;
  mediaUrl?: string[];
};

export type SMSTemplate = {
  id: string;
  name: string;
  body: string;
  variables: string[];
};

const SMS_TEMPLATES: Record<string, SMSTemplate> = {
  'appointment-reminder': {
    id: 'appointment-reminder',
    name: 'Appointment Reminder',
    body: 'Hi {{firstName}}! Reminder: Property showing at {{address}} tomorrow at {{time}}. See you there! - {{agentName}}',
    variables: ['firstName', 'address', 'time', 'agentName']
  },
  'new-listing': {
    id: 'new-listing',
    name: 'New Listing Alert',
    body: 'New listing alert! {{bedrooms}}bed/{{bathrooms}}bath in {{city}} for {{price}}. View details: {{link}} - {{agentName}}',
    variables: ['bedrooms', 'bathrooms', 'city', 'price', 'link', 'agentName']
  },
  'showing-confirmed': {
    id: 'showing-confirmed',
    name: 'Showing Confirmed',
    body: 'Your showing at {{address}} is confirmed for {{date}} at {{time}}. Contact me with questions: {{agentPhone}} - {{agentName}}',
    variables: ['address', 'date', 'time', 'agentPhone', 'agentName']
  },
  'offer-update': {
    id: 'offer-update',
    name: 'Offer Update',
    body: 'Update on your offer for {{address}}: {{status}}. Call me to discuss: {{agentPhone}} - {{agentName}}',
    variables: ['address', 'status', 'agentPhone', 'agentName']
  },
  'quick-followup': {
    id: 'quick-followup',
    name: 'Quick Follow-up',
    body: 'Hi {{firstName}}! Following up on your interest in {{address}}. Any questions? Text or call me! - {{agentName}}',
    variables: ['firstName', 'address', 'agentName']
  }
};

class SMSService {
  private defaultFrom = '+1-555-AGRM-CRM'; // Mock number

  // ===== SEND SMS =====
  async send(options: SMSOptions, tenantId: string, senderId: string): Promise<SMSMessage> {
    console.log('[MOCK SMS] Sending SMS...');
    console.log('  To:', options.to);
    console.log('  From:', options.from || this.defaultFrom);
    console.log('  Body:', options.body);

    // Validate phone number format
    if (!this.isValidPhoneNumber(options.to)) {
      throw new Error('Invalid phone number format');
    }

    // In production: use Twilio
    // const message = await twilioClient.messages.create({
    //   body: options.body,
    //   from: options.from || this.defaultFrom,
    //   to: options.to,
    //   mediaUrl: options.mediaUrl
    // });

    const sms = await dataStore.createSMSMessage({
      tenantId,
      to: options.to,
      from: options.from || this.defaultFrom,
      body: options.body,
      status: 'SENT',
      sentAt: new Date(),
      senderId
    });

    console.log(`[MOCK SMS] ✅ SMS sent (ID: ${sms.id})`);
    console.log('📱 In production, this would be sent via Twilio');

    return sms;
  }

  // ===== SEND FROM TEMPLATE =====
  async sendFromTemplate(
    templateId: string,
    variables: Record<string, string>,
    to: string,
    tenantId: string,
    senderId: string
  ): Promise<SMSMessage> {
    console.log(`[MOCK SMS] Sending SMS from template: ${templateId}`);

    const template = SMS_TEMPLATES[templateId];
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Replace variables in body
    let body = template.body;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      body = body.replace(new RegExp(placeholder, 'g'), value);
    }

    // Check length (SMS limit is 160 characters per segment)
    if (body.length > 160) {
      console.warn(`[MOCK SMS] ⚠️  Message exceeds 160 characters (${body.length}). Will be sent as ${Math.ceil(body.length / 160)} segments.`);
    }

    return await this.send({
      to,
      body
    }, tenantId, senderId);
  }

  // ===== BULK SEND =====
  async sendBulk(
    messages: Array<{ to: string; body: string }>,
    tenantId: string,
    senderId: string
  ): Promise<SMSMessage[]> {
    console.log(`[MOCK SMS] Sending bulk SMS (${messages.length} recipients)`);

    // In production: use Twilio Messaging Service for bulk sending
    const sent: SMSMessage[] = [];
    for (const message of messages) {
      try {
        const result = await this.send({
          to: message.to,
          body: message.body
        }, tenantId, senderId);
        sent.push(result);

        // Rate limiting (Twilio has rate limits)
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`[MOCK SMS] Failed to send to ${message.to}:`, error);
      }
    }

    console.log(`[MOCK SMS] ✅ Bulk send complete (${sent.length}/${messages.length} sent)`);
    return sent;
  }

  // ===== VALIDATE PHONE NUMBER =====
  isValidPhoneNumber(phone: string): boolean {
    // Basic validation - accepts formats like:
    // +1234567890, 123-456-7890, (123) 456-7890, 123.456.7890
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)\.]/g, ''));
  }

  // ===== FORMAT PHONE NUMBER =====
  formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Format as E.164 (international format)
    if (cleaned.length === 10) {
      // US number without country code
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      // US number with country code
      return `+${cleaned}`;
    }

    // Return as-is if already in correct format or unknown format
    return phone.startsWith('+') ? phone : `+${cleaned}`;
  }

  // ===== GET TEMPLATES =====
  getTemplates(): SMSTemplate[] {
    return Object.values(SMS_TEMPLATES);
  }

  getTemplate(id: string): SMSTemplate | undefined {
    return SMS_TEMPLATES[id];
  }

  // ===== GET SMS HISTORY =====
  async getSMSHistory(tenantId: string, filters?: { senderId?: string; contactId?: string }): Promise<SMSMessage[]> {
    return await dataStore.listSMSMessages(tenantId, filters);
  }

  // ===== TRACK DELIVERY STATUS =====
  async updateDeliveryStatus(smsId: string, status: 'DELIVERED' | 'FAILED'): Promise<void> {
    console.log(`[MOCK SMS] Updating delivery status for ${smsId}: ${status}`);
    // In production: Twilio provides webhooks for delivery status
  }

  // ===== HANDLE INCOMING SMS (Webhook) =====
  async handleIncomingSMS(from: string, to: string, body: string, tenantId: string): Promise<void> {
    console.log('[MOCK SMS] Incoming SMS received');
    console.log('  From:', from);
    console.log('  To:', to);
    console.log('  Body:', body);

    // In production:
    // 1. Find the contact by phone number
    // 2. Create activity record
    // 3. Notify assigned agent
    // 4. Auto-respond if needed

    await dataStore.createActivity({
      tenantId,
      type: 'sms_received',
      description: `Received SMS from ${from}: ${body}`,
      userId: 'system',
      metadata: { from, to, body }
    });

    console.log('[MOCK SMS] ✅ Incoming SMS logged');
  }

  // ===== SEND MMS (with media) =====
  async sendMMS(options: SMSOptions & { mediaUrl: string[] }, tenantId: string, senderId: string): Promise<SMSMessage> {
    console.log('[MOCK SMS] Sending MMS with media...');
    console.log('  Media URLs:', options.mediaUrl);

    // In production: Twilio supports MMS with mediaUrl parameter
    return await this.send(options, tenantId, senderId);
  }

  // ===== SCHEDULE SMS =====
  async scheduleSMS(options: SMSOptions, sendAt: Date, tenantId: string, senderId: string): Promise<void> {
    console.log(`[MOCK SMS] Scheduling SMS for ${sendAt.toISOString()}`);
    console.log('  To:', options.to);
    console.log('  Body:', options.body);

    // In production:
    // 1. Store in database with 'SCHEDULED' status
    // 2. Use Bull queue or cron job to send at scheduled time
    // 3. Twilio doesn't have native scheduling, so implement server-side

    console.log('[MOCK SMS] ✅ SMS scheduled (would use job queue in production)');
  }

  // ===== OPT-OUT MANAGEMENT =====
  async handleOptOut(phoneNumber: string, tenantId: string): Promise<void> {
    console.log(`[MOCK SMS] Processing opt-out for ${phoneNumber}`);

    // In production:
    // 1. Add to opt-out list in database
    // 2. Update contact record
    // 3. Comply with TCPA regulations
    // 4. Send confirmation SMS

    console.log('[MOCK SMS] ✅ Phone number added to opt-out list');
  }

  async isOptedOut(phoneNumber: string, tenantId: string): Promise<boolean> {
    // In production: check opt-out list in database
    return false;
  }
}

export const smsService = new SMSService();

// ===== PRODUCTION INTEGRATION NOTES =====
/*
TO SWITCH TO PRODUCTION:

1. Install Twilio (already done):
   npm install twilio

2. Add environment variables:
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890

3. Initialize Twilio client:
   import twilio from 'twilio';
   const twilioClient = twilio(
     process.env.TWILIO_ACCOUNT_SID,
     process.env.TWILIO_AUTH_TOKEN
   );

4. Replace send() method:
   async send(options: SMSOptions, tenantId: string, senderId: string): Promise<SMSMessage> {
     const message = await twilioClient.messages.create({
       body: options.body,
       from: options.from || process.env.TWILIO_PHONE_NUMBER,
       to: this.formatPhoneNumber(options.to),
       mediaUrl: options.mediaUrl
     });

     return await dataStore.createSMSMessage({
       tenantId,
       to: options.to,
       from: options.from || process.env.TWILIO_PHONE_NUMBER,
       body: options.body,
       status: 'SENT',
       sentAt: new Date(),
       senderId,
       externalId: message.sid
     });
   }

5. Set up webhooks for status updates:
   POST /api/webhooks/sms
   {
     "MessageSid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
     "MessageStatus": "delivered",
     "To": "+1234567890",
     "From": "+1234567890",
     "Body": "Message text"
   }

6. Handle incoming SMS:
   POST /api/webhooks/sms/incoming
   - Parse Twilio request
   - Verify signature
   - Process incoming message
   - Respond with TwiML if needed

7. Implement opt-out compliance:
   - Automatically detect STOP, UNSUBSCRIBE keywords
   - Maintain opt-out list
   - Include opt-out instructions in messages
   - Comply with TCPA and CTIA guidelines

Example webhook handler for incoming SMS:
import twilio from 'twilio';

export async function POST(req: Request) {
  const body = await req.text();
  const params = new URLSearchParams(body);

  // Verify Twilio signature
  const twilioSignature = req.headers.get('X-Twilio-Signature');
  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    twilioSignature,
    'https://yourapp.com/api/webhooks/sms/incoming',
    params
  );

  if (!isValid) {
    return new Response('Invalid signature', { status: 403 });
  }

  const from = params.get('From');
  const to = params.get('To');
  const body = params.get('Body');

  await smsService.handleIncomingSMS(from, to, body, tenantId);

  return new Response('<Response></Response>', {
    headers: { 'Content-Type': 'text/xml' }
  });
}
*/
