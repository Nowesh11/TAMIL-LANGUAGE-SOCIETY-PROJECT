import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import PaymentSettings from '../../../models/PaymentSettings';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  try {
    await dbConnect();
    const settings = await (PaymentSettings as any).getCurrentSettings();
    if (!settings) {
      return NextResponse.json({ success: false, error: 'Payment settings not configured' }, { status: 404 });
    }

    const methods = await (PaymentSettings as any).getActivePaymentMethods();
    return NextResponse.json({
      success: true,
      settings: {
        currency: settings.currency,
        taxRate: settings.taxRate,
        shipping: settings.shipping,
        epayum: settings.epayum,
        fpx: settings.fpx,
        isMaintenanceMode: settings.isMaintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
        termsAndConditions: settings.termsAndConditions,
        privacyPolicy: settings.privacyPolicy,
        refundPolicy: settings.refundPolicy,
        activePaymentMethods: methods,
      }
    });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to fetch payment settings';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}