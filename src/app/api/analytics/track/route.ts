import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decryptText } from '@/lib/crypto';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      eventType = 'PAGE_VIEW',
      path = '/',
      targetId,
      screenRes = '1920x1080',
      language = 'en-US',
      timezone = 'UTC',
      referrer = 'Direct',
      browser = 'Chrome/Next.js',
      os = 'Desktop',
      deviceType = 'Desktop',
    } = body;

    // Retrieve IP Address with comprehensive proxy header detection
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    const trueClientIp = req.headers.get('true-client-ip');

    let ipAddress = '127.0.0.1';
    if (cfConnectingIp) {
      ipAddress = cfConnectingIp;
    } else if (trueClientIp) {
      ipAddress = trueClientIp;
    } else if (realIp) {
      ipAddress = realIp;
    } else if (forwardedFor) {
      ipAddress = forwardedFor.split(',')[0].trim();
    }

    if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1') {
      ipAddress = '127.0.0.1 (Local Dev)';
    }

    // Retrieve Geo headers if provided by reverse proxy/Cloudflare
    const country = req.headers.get('cf-ipcountry') || req.headers.get('x-country') || 'Local Dev';
    const city = req.headers.get('cf-ipcity') || req.headers.get('x-city') || 'Localhost';

    // 1. Log event entry in AnalyticsLog table
    await db.analyticsLog.create({
      data: {
        eventType,
        path,
        targetId,
        ipAddress,
        userAgent: req.headers.get('user-agent') || 'Browser',
        country,
      },
    });

    // 2. Debounce Session Logging in VisitorSession table
    // Check if session exists for this IP within last 30 minutes
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const existingSession = await db.visitorSession.findFirst({
      where: {
        ipAddress,
        lastVisit: { gte: thirtyMinsAgo },
      },
    });

    let isFirstVisit = false;

    if (existingSession) {
      // Update existing session
      await db.visitorSession.update({
        where: { id: existingSession.id },
        data: {
          visitCount: { increment: 1 },
          lastVisit: new Date(),
          visitedUrl: path,
        },
      });
    } else {
      isFirstVisit = true;
      // Create new session
      await db.visitorSession.create({
        data: {
          ipAddress,
          country,
          city,
          browser,
          os,
          deviceType,
          screenResolution: screenRes,
          language,
          timezone,
          referrer,
          visitedUrl: path,
          visitCount: 1,
        },
      });
    }

    // 3. Optional Visit Email Notification Dispatch
    try {
      const smtp = await db.sMTPSettings.findUnique({ where: { id: 'default' } });
      if (smtp && smtp.enabled && smtp.smtpUser && smtp.notifyMode !== 'DISABLED') {
        const shouldNotify =
          smtp.notifyMode === 'EVERY_VISIT' || (smtp.notifyMode === 'FIRST_VISIT' && isFirstVisit);

        if (shouldNotify && eventType === 'PAGE_VIEW') {
          const decryptedPass = decryptText(smtp.encryptedSmtpPass);
          const transporter = nodemailer.createTransport({
            host: smtp.smtpHost,
            port: smtp.smtpPort,
            secure: smtp.smtpPort === 465,
            auth: { user: smtp.smtpUser, pass: decryptedPass },
          });

          await transporter.sendMail({
            from: `"${smtp.senderEmail}" <${smtp.smtpUser}>`,
            to: smtp.recipientEmail,
            subject: `👁️ Portfolio Visitor Alert [${country}] — ${ipAddress}`,
            html: `
              <div style="font-family: monospace; background: #050505; color: #00ff66; padding: 20px; border-radius: 12px; border: 1px solid #00ff66;">
                <h3>[VISITOR TELEMETRY ALERT]</h3>
                <p>A new visitor is active on your portfolio.</p>
                <ul>
                  <li>IP Address: <strong>${ipAddress}</strong></li>
                  <li>Location: <strong>${city}, ${country}</strong></li>
                  <li>OS / Browser: <strong>${os} / ${browser}</strong></li>
                  <li>Device: <strong>${deviceType} (${screenRes})</strong></li>
                  <li>Referrer: <strong>${referrer}</strong></li>
                  <li>Visited URL: <strong>${path}</strong></li>
                  <li>Time: <strong>${new Date().toISOString()}</strong></li>
                </ul>
              </div>
            `,
          });
        }
      }
    } catch (mailErr) {
      console.error('Visitor alert email error:', mailErr);
    }

    return NextResponse.json({ success: true, isFirstVisit });
  } catch (error: any) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
