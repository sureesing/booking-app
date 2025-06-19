import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

export async function POST(req: NextRequest) {
  try {
    // Validate environment variables
    const { NEXT_PUBLIC_SCRIPT_URL, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_DRIVE_FOLDER_ID } = process.env;
    if (!NEXT_PUBLIC_SCRIPT_URL || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_DRIVE_FOLDER_ID) {
      return NextResponse.json(
        { success: false, message: 'Missing required environment variables' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const image = formData.get('image') as File | null;
    let imageLink = 'No image provided';

    // Validate and upload image to Google Drive
    if (image) {
      if (!['image/jpeg', 'image/png'].includes(image.type)) {
        return NextResponse.json(
          { success: false, message: 'Invalid image format. Only .jpg or .png allowed' },
          { status: 400 }
        );
      }
      if (image.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, message: 'Image size exceeds 5MB limit' },
          { status: 400 }
        );
      }

      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: GOOGLE_CLIENT_EMAIL,
          private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });

      const drive = google.drive({ version: 'v3', auth });

      const fileMetadata = {
        name: `${Date.now()}_${image.name.replace(/[^a-zA-Z0-9.]/g, '_')}`,
        parents: [GOOGLE_DRIVE_FOLDER_ID],
      };

      // Convert Web Stream to Node.js Readable stream
      const buffer = Buffer.from(await image.arrayBuffer());
      const readableStream = new Readable({
        read() {
          this.push(buffer);
          this.push(null);
        },
      });

      const media = {
        mimeType: image.type,
        body: readableStream,
      };

      const file = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, webViewLink',
      });

      // Set file permissions to public
      await drive.permissions.create({
        fileId: file.data.id!,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      imageLink = file.data.webViewLink || 'No link available';
    }

    // Validate required fields
    const requiredFields = ['date', 'period', 'studentId', 'grade', 'prefix', 'firstName', 'lastName', 'symptoms', 'treatment'];
    for (const field of requiredFields) {
      if (!formData.get(field)) {
        return NextResponse.json(
          { success: false, message: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Prepare payload for Google Apps Script
    const payload = {
      date: formData.get('date') || 'N/A',
      period: formData.get('period') || 'N/A',
      studentId: formData.get('studentId') || 'N/A',
      grade: formData.get('grade') || 'N/A',
      prefix: formData.get('prefix') || 'N/A',
      firstName: formData.get('firstName') || 'N/A',
      lastName: formData.get('lastName') || 'N/A',
      symptoms: formData.get('symptoms') || 'N/A',
      treatment: formData.get('treatment') || 'N/A',
      imageLink,
    };

    // Send data to Google Apps Script
    const response = await fetch(NEXT_PUBLIC_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Proxy error:', error.message, error.stack);
    return NextResponse.json(
      { success: false, message: 'Server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}