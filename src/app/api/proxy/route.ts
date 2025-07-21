import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    if (action === 'getBookings') {
      const scriptUrl = process.env.NEXT_PUBLIC_SCRIPT_URL || '';
      const response = await fetch(`${scriptUrl}?action=getBookings`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        return NextResponse.json({ success: false, message: 'Invalid response format from Google Apps Script' }, { status: 500 });
      }
      return NextResponse.json(data);
    }
    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    let message = 'Unknown error';
    if (error instanceof Error) message = error.message;
    return NextResponse.json({ success: false, message: 'Server error: ' + message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { NEXT_PUBLIC_SCRIPT_URL } = process.env;
    if (!NEXT_PUBLIC_SCRIPT_URL) {
      return NextResponse.json({ success: false, message: 'Missing required environment variables' }, { status: 500 });
    }
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      // รับ booking ที่แนบ imageLink (URL จาก Cloudinary)
      const data = await req.json();
      // ส่งต่อไป Google Apps Script
      const response = await fetch(NEXT_PUBLIC_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        return NextResponse.json({ success: false, message: 'Invalid response format from Google Apps Script' }, { status: 500 });
      }
      return NextResponse.json(result, { status: response.status });
    }
    return NextResponse.json({ success: false, message: 'Invalid content type' }, { status: 400 });
  } catch (error: unknown) {
    let message = 'Unknown error';
    if (error instanceof Error) message = error.message;
    return NextResponse.json({ success: false, message: 'Server error: ' + message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
