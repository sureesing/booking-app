import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    
    if (action === 'getBookings') {
      const scriptUrl = process.env.NEXT_PUBLIC_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxjJUFf_n3YuxGaskactb_BUGmLCbnObIHH4T3KockGl1-Qr-y5200pvBdaPCxQUtru/exec';
      
      console.log('getBookings: Using script URL:', scriptUrl);
      console.log('getBookings: NEXT_PUBLIC_SCRIPT_URL env var:', process.env.NEXT_PUBLIC_SCRIPT_URL);
      try {
        const response = await fetch(`${scriptUrl}?action=getBookings`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('getBookings: Response status:', response.status);
        console.log('getBookings: Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseText = await response.text();
        console.log('getBookings: Raw response text (first 500 chars):', responseText.substring(0, 500));
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('getBookings: Failed to parse JSON response:', parseError);
          console.log('getBookings: Full response text:', responseText);
          
          // If it's HTML, it might be an error page
          if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
            return NextResponse.json(
              { 
                success: false, 
                message: 'Google Apps Script returned HTML instead of JSON. Please check if the script is deployed correctly.',
                details: 'The script URL might be incorrect or the script needs to be redeployed.'
              },
              { status: 500 }
            );
          }
          
          return NextResponse.json(
            { 
              success: false, 
              message: 'Invalid response format from Google Apps Script',
              details: 'Expected JSON but received: ' + responseText.substring(0, 100)
            },
            { status: 500 }
          );
        }
        
        console.log('getBookings response:', data);
        
        // Transform the data to match the expected Thai field structure
        if (data.success && Array.isArray(data.bookings)) {
          console.log('Starting data transformation...');
          console.log('Original bookings count:', data.bookings.length);
          
          const transformedBookings = data.bookings.map((booking: any, index: number) => {
            console.log(`Transforming booking ${index}:`, booking);
            
            // Convert English field names to Thai field names
            const transformed = {
              'วันที่เลือก': booking.date || '',
              'คาบที่เรียน': booking.timeSlot || '',
              'เลขประจำตัว': booking.studentId || '',
              'ระดับชั้น': booking.grade || '',
              'คำนำหน้า': booking.prefix || '',
              'ชื่อ': booking.firstName || '',
              'นามสกุล': booking.lastName || '',
              'อาการ': booking.symptoms || '',
              'วิธีรักษา': booking.treatment || '',
              'imageLink': booking.imageLink || '',
              'Timestamp': booking.timestamp || '',
              // Keep English fields for backward compatibility
              ...booking
            };
            
            console.log(`Transformed booking ${index}:`, transformed);
            return transformed;
          });
          
          const transformedData = {
            ...data,
            bookings: transformedBookings
          };
          
          console.log('Final transformed data:', transformedData);
          return NextResponse.json(transformedData);
        } else {
          console.log('Data transformation skipped - data.success:', data.success, 'Array.isArray(data.bookings):', Array.isArray(data.bookings));
        }
        
        return NextResponse.json(data);
      } catch (fetchError) {
        console.error('getBookings: Fetch error:', fetchError);
        throw fetchError;
      }
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: unknown) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }
    console.error('GET Proxy error:', message);
    return NextResponse.json(
      { success: false, message: 'Server error: ' + message },
      { status: 500 }
    );
  }
}

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

    // Detect content type
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      // Handle JSON requests (e.g., lookupStudent)
      const body = await req.json();
      if (body.action === 'lookupStudent' && body.studentId) {
        // Forward to Apps Script with GET parameters
        const scriptUrl = process.env.NEXT_PUBLIC_SCRIPT_URL || '';
        const lookupUrl = `${scriptUrl}?action=lookupStudent&studentId=${encodeURIComponent(body.studentId)}`;
        console.log('Looking up student with URL:', lookupUrl);
        
        // Try GET first
        let response = await fetch(lookupUrl, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
        });
        
        console.log('GET response status:', response.status);
        console.log('GET response headers:', Object.fromEntries(response.headers.entries()));
        
        // Check if response is HTML instead of JSON
        const responseText = await response.text();
        console.log('GET response text (first 200 chars):', responseText.substring(0, 200));
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          console.log('Full response text:', responseText);
          
          // If it's HTML, it might be an error page
          if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
            return NextResponse.json(
              { 
                success: false, 
                message: 'Google Apps Script returned HTML instead of JSON. Please check if the script is deployed correctly.',
                details: 'The script URL might be incorrect or the script needs to be redeployed.'
              },
              { status: 500 }
            );
          }
          
          return NextResponse.json(
            { 
              success: false, 
              message: 'Invalid response format from Google Apps Script',
              details: 'Expected JSON but received: ' + responseText.substring(0, 100)
            },
            { status: 500 }
          );
        }
        
        console.log('GET response data:', data);
        
        // If GET fails, try POST
        if (!data.success && data.message && data.message.includes('Invalid')) {
          console.log('Trying POST method...');
          response = await fetch(scriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'lookupStudent',
              studentId: body.studentId
            }),
          });
          
          console.log('POST response status:', response.status);
          const postResponseText = await response.text();
          console.log('POST response text (first 200 chars):', postResponseText.substring(0, 200));
          
          try {
            data = JSON.parse(postResponseText);
          } catch (postParseError) {
            console.error('Failed to parse POST JSON response:', postParseError);
            if (postResponseText.includes('<!DOCTYPE') || postResponseText.includes('<html')) {
              return NextResponse.json(
                { 
                  success: false, 
                  message: 'Google Apps Script returned HTML instead of JSON. Please check if the script is deployed correctly.',
                  details: 'The script URL might be incorrect or the script needs to be redeployed.'
                },
                { status: 500 }
              );
            }
            
            return NextResponse.json(
              { 
                success: false, 
                message: 'Invalid response format from Google Apps Script (POST)',
                details: 'Expected JSON but received: ' + postResponseText.substring(0, 100)
              },
              { status: 500 }
            );
          }
          
          console.log('POST response data:', data);
        }
        
        return NextResponse.json(data, { status: response.status });
      } else {
        return NextResponse.json(
          { success: false, message: 'Invalid action or missing studentId' },
          { status: 400 }
        );
      }
    }

    // Handle booking form submission (multipart/form-data)
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
      timestamp: new Date().toISOString(),
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

    // Check if response is HTML instead of JSON
    const responseText = await response.text();
    console.log('Booking submission response text (first 200 chars):', responseText.substring(0, 200));
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse booking submission JSON response:', parseError);
      console.log('Full response text:', responseText);
      
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Google Apps Script returned HTML instead of JSON. Please check if the script is deployed correctly.',
            details: 'The script URL might be incorrect or the script needs to be redeployed.'
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid response format from Google Apps Script',
          details: 'Expected JSON but received: ' + responseText.substring(0, 100)
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    let message = 'Unknown error';
    let stack = undefined;
    if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
    } else if (typeof error === 'string') {
      message = error;
    }
    console.error('Proxy error:', message, stack);
    return NextResponse.json(
      { success: false, message: 'Server error: ' + message },
      { status: 500 }
    );
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