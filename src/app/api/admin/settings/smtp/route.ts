import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { encryptText, decryptText } from '@/lib/crypto';
import nodemailer from 'nodemailer';

function cleanSmtpHost(hostInput: string | undefined): string {
  if (!hostInput) return 'smtp.gmail.com';
  const trimmed = hostInput.trim();
  if (trimmed.includes('@')) {
    return 'smtp.gmail.com';
  }
  return trimmed;
}

function formatSmtpError(error: any, host: string, port: number): string {
  const code = error.code || '';
  const message = error.message || '';

  if (code === 'EAI_FAIL' || code === 'ENOTFOUND') {
    return `Invalid SMTP Host! Server domain '${host}' could not be resolved by DNS. Use 'smtp.gmail.com' for Gmail.`;
  }
  if (code === 'EAUTH' || message.includes('535') || message.includes('Authentication failed') || message.includes('Username and Password not accepted')) {
    return `Authentication Failed (535 EAUTH). Please verify that 2-Step Verification is active on your Google Account and generate a new 16-character App Password (in Google Account > Security > App Passwords).`;
  }
  if (code === 'ETIMEDOUT') {
    return `Connection Timeout! SMTP Port ${port} timed out. Check firewall or port setting (587 TLS / 465 SSL).`;
  }
  if (code === 'ECONNREFUSED') {
    return `Connection Refused! SMTP Server at ${host}:${port} rejected the connection.`;
  }
  return message || 'SMTP Handshake Failed';
}

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let settings = await db.sMTPSettings.findUnique({ where: { id: 'default' } });

    if (!settings) {
      settings = await db.sMTPSettings.create({
        data: { id: 'default', smtpHost: 'smtp.gmail.com' },
      });
    }

    const sanitizedHost = cleanSmtpHost(settings.smtpHost);

    // Mask password before returning to Admin UI
    return NextResponse.json({
      ...settings,
      smtpHost: sanitizedHost,
      smtpPassMasked: settings.encryptedSmtpPass ? '••••••••' : '',
      encryptedSmtpPass: undefined,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { smtpHost, smtpPort, smtpUser, smtpPass, senderEmail, recipientEmail, enabled, notifyMode } = body;

    const sanitizedHost = cleanSmtpHost(smtpHost);

    const existing = await db.sMTPSettings.findUnique({ where: { id: 'default' } });
    
    // Encrypt password only if a new non-masked password was provided
    let encryptedPass = existing?.encryptedSmtpPass || '';
    if (smtpPass && smtpPass !== '••••••••') {
      encryptedPass = encryptText(smtpPass);
    }

    const updated = await db.sMTPSettings.upsert({
      where: { id: 'default' },
      update: {
        smtpHost: sanitizedHost,
        smtpPort: parseInt(smtpPort) || 587,
        smtpUser: smtpUser || '',
        encryptedSmtpPass: encryptedPass,
        senderEmail: senderEmail || 'noreply@soundkish.dev',
        recipientEmail: recipientEmail || 'admin@soundkish.dev',
        enabled: Boolean(enabled),
        notifyMode: notifyMode || 'FIRST_VISIT',
      },
      create: {
        id: 'default',
        smtpHost: sanitizedHost,
        smtpPort: parseInt(smtpPort) || 587,
        smtpUser: smtpUser || '',
        encryptedSmtpPass: encryptedPass,
        senderEmail: senderEmail || 'noreply@soundkish.dev',
        recipientEmail: recipientEmail || 'admin@soundkish.dev',
        enabled: Boolean(enabled),
        notifyMode: notifyMode || 'FIRST_VISIT',
      },
    });

    return NextResponse.json({
      ...updated,
      smtpPassMasked: updated.encryptedSmtpPass ? '••••••••' : '',
      encryptedSmtpPass: undefined,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Test Email Dispatch Action Handler
export async function PUT(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const settings = await db.sMTPSettings.findUnique({ where: { id: 'default' } });

    const smtpUser = (settings?.smtpUser || process.env.SMTP_USER || '').trim().toLowerCase();
    let decryptedPass = settings?.encryptedSmtpPass ? decryptText(settings.encryptedSmtpPass) : '';
    if (!decryptedPass && process.env.SMTP_PASS) {
      decryptedPass = process.env.SMTP_PASS.replace(/\s+/g, '');
    }

    if (!smtpUser || !decryptedPass) {
      return NextResponse.json({ error: 'SMTP Credentials missing. Enter your Gmail App Password in Admin SMTP Settings or .env file.' }, { status: 400 });
    }

    const host = cleanSmtpHost(settings?.smtpHost || process.env.SMTP_HOST);
    const port = settings?.smtpPort || parseInt(process.env.SMTP_PORT || '587') || 587;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: smtpUser,
        pass: decryptedPass,
      },
    });

    // Verify SMTP connection handshake
    await transporter.verify();

    // Send test email
    const sender = settings?.senderEmail || smtpUser;
    const recipient = settings?.recipientEmail || smtpUser;

    const info = await transporter.sendMail({
      from: `"${sender}" <${smtpUser}>`,
      to: recipient,
      subject: '🧪 Cyber Operations Hub — SMTP Connection Test',
      html: `
        <div style="font-family: monospace; background: #050505; color: #00ff66; padding: 24px; border-radius: 16px; border: 1px solid #00ff66;">
          <h2>[SYSTEM ALERT] SMTP Connection Test Successful</h2>
          <p>Your SMTP mailer configuration has been verified cleanly.</p>
          <ul>
            <li>Host: ${host}:${port}</li>
            <li>Sender: ${sender}</li>
            <li>Recipient: ${recipient}</li>
            <li>Timestamp: ${new Date().toISOString()}</li>
          </ul>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: `Test email dispatched successfully to ${recipient}`,
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error('SMTP Test Error:', error);
    const host = cleanSmtpHost(undefined);
    const diagnosticMessage = formatSmtpError(error, host, 587);
    return NextResponse.json({ error: diagnosticMessage }, { status: 500 });
  }
}
