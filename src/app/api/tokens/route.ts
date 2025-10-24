import { NextRequest, NextResponse } from 'next/server';

// Mock database - replace with real database
const tokens: Array<{
    id: string;
    name: string;
    symbol: string;
    description: string;
    image: string;
    twitter: string;
    telegram: string;
    website: string;
    developer: string;
    contractAddress: string;
    createdAt: Date;
}> = [];

const posts: Array<{
    id: string;
    userId: string;
    imageUrl: string;
    tokenAddress?: string;
    caption: string;
    likes: number;
    comments: Array<{
        id: string;
        userId: string;
        text: string;
        createdAt: Date;
    }>;
    createdAt: Date;
}> = [];

export async function GET() {
    return NextResponse.json({ tokens, posts });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, ...data } = body;

        if (type === 'token') {
            const token = {
                id: Math.random().toString(36).substr(2, 9),
                ...data,
                createdAt: new Date(),
            };
            tokens.push(token);
            return NextResponse.json(token);
        }

        if (type === 'post') {
            const post = {
                id: Math.random().toString(36).substr(2, 9),
                ...data,
                likes: 0,
                comments: [],
                createdAt: new Date(),
            };
            posts.push(post);
            return NextResponse.json(post);
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
