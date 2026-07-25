import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { encryptText, decryptText } from '@/lib/crypto';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let settings = await db.sMTPSettings.findUnique({ where: { id: 'default' } });

    if (!settings) {
      settings = await db.sMTPSettings.create({
        data: { id: 'default' },
      });
    }

    // Mask password before returning to Admin UI
    return NextResponse.json({
      ...settings,
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

    const existing = await db.sMTPSettings.findUnique({ where: { id: 'default' } });
    
    // Encrypt password only if a new non-masked password was provided
    let encryptedPass = existing?.encryptedSmtpPass || '';
    if (smtpPass && smtpPass !== '••••••••') {
      encryptedPass = encryptText(smtpPass);
    }

    const updated = await db.sMTPSettings.upsert({
      where: { id: 'default' },
      update: {
        smtpHost: smtpHost || 'smtp.gmail.com',
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
        smtpHost: smtpHost || 'smtp.gmail.com',
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
    if (!settings || !settings.smtpUser) {
      return NextResponse.json({ error: 'SMTP settings not configured' }, { status: 400 });
    }

    const decryptedPass = decryptText(settings.encryptedSmtpPass);

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465,
      auth: {
        user: settings.smtpUser,
        pass: decryptedPass,
      },
    });

    // Verify SMTP connection handshake
    await transporter.verify();

    // Send test email
    const info = await transporter.sendMail({
      from: `"${settings.senderEmail}" <${settings.smtpUser}>`,
      to: settings.recipientEmail,
      subject: '🧪 Cyber Operations Hub — SMTP Connection Test',
      html: `
        <div style="font-family: monospace; background: #050505; color: #00ff66; padding: 24px; border-radius: 16px; border: 1px solid #00ff66;">
          <h2>[SYSTEM ALERT] SMTP Connection Test Successful</h2>
          <p>Your SMTP mailer configuration has been verified cleanly.</p>
          <ul>
            <li>Host: ${settings.smtpHost}:${settings.smtpPort}</li>
            <li>Sender: ${settings.senderEmail}</li>
            <li>Recipient: ${settings.recipientEmail}</li>
            <li>Timestamp: ${new Date().toISOString()}</li>
          </ul>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: `Test email dispatched successfully to ${settings.recipientEmail}`,
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error('SMTP Test Error:', error);
    return NextResponse.json({ error: error.message || 'SMTP Handshake Failed' }, { status: 500 });
  }
}
