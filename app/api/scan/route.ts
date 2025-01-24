import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { scanRepository } from '@/lib/scanner';
import clientPromise from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Invalid repository URL' },
        { status: 400 }
      );
    }

    // Scan repository
    const scanResult = await scanRepository(url, session.accessToken);

    // Store scan result in MongoDB
    const client = await clientPromise;
    const db = client.db('devsecguard');
    await db.collection('scans').insertOne({
      ...scanResult,
      userId: session.user.email,
      createdAt: new Date(),
    });

    return NextResponse.json(scanResult);
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { error: 'Failed to scan repository' },
      { status: 500 }
    );
  }
}