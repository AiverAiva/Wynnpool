import { NextResponse, NextRequest } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ playerName: string }> }
): Promise<NextResponse> {
    const playerName = (await params).playerName
    const EXTERNAL_API_URL = `https://api.wynncraft.com/v3/player/${playerName}?fullResult`;

    if (!playerName) {
        return NextResponse.json(
            { error: 'Missing Player Name parameter' },
            { status: 400 }
        );
    }

    try {
        const response = await fetch(EXTERNAL_API_URL);
        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ error: 'Player not found' }, { status: 404 });
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
        const data = await response.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error('Error fetching external data:', error);
        return NextResponse.json({ error: 'Unable to fetch data' }, { status: 500 });
    }
}
