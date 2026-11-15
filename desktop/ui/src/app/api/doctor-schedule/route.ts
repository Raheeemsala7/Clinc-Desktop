import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import { HEADERS } from '@/shared/constant/api.constant';

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.accessToken) {
    return NextResponse.json({ status: false, message: 'Unauthorized', code: 401 }, { status: 401 });
  }

  const user = token.user as any;
  const doctorId = req.nextUrl.searchParams.get('doctorId') || user?.id;

  if (!doctorId) {
    return NextResponse.json({ status: false, message: 'Doctor ID is required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${process.env.API_URL}/doctor-schedule/${encodeURIComponent(doctorId)}`, {
      headers: {
        ...HEADERS.JsonBody,
        ...HEADERS.authorize(token.accessToken as string),
      },
      cache: 'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error?.message || 'Failed to fetch doctor schedule' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.accessToken) {
    return NextResponse.json({ status: false, message: 'Unauthorized', code: 401 }, { status: 401 });
  }

  const user = token.user as any;
  const body = await req.json();
  const doctorId = body.doctorId || req.nextUrl.searchParams.get('doctorId') || user?.id;

  if (!doctorId) {
    return NextResponse.json({ status: false, message: 'Doctor ID is required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${process.env.API_URL}/doctor-schedule/${encodeURIComponent(doctorId)}`, {
      method: 'PUT',
      headers: {
        ...HEADERS.JsonBody,
        ...HEADERS.authorize(token.accessToken as string),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error?.message || 'Failed to update doctor schedule' },
      { status: 500 }
    );
  }
}
