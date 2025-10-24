import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { action, tokenId, amount } = await request.json();

        if (action === 'earn') {
            // This would typically interact with the smart contract
            // For now, we'll return a success response
            return NextResponse.json({
                success: true,
                message: `Earned ${amount} XP for token ${tokenId}`,
                newExperience: amount // This would be calculated from contract
            });
        }

        if (action === 'getProgress') {
            // This would query the smart contract for current progress
            return NextResponse.json({
                success: true,
                experience: 0, // This would be fetched from contract
                level: 'Apprentice',
                progress: 0
            });
        }

        return NextResponse.json({
            success: false,
            error: 'Invalid action'
        }, { status: 400 });

    } catch (error) {
        console.error('Experience API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Experience API is running',
        endpoints: {
            'POST /api/experience': 'Earn experience or get progress',
            'GET /api/experience': 'API status'
        }
    });
}
