import { NextResponse, NextRequest } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ guildName: string }> }
): Promise<NextResponse> {
    const guildName = (await params).guildName
    const EXTERNAL_API_URL = `https://api.wynncraft.com/v3/guild/${guildName}?identifier=uuid`;

    if (!guildName) {
        return NextResponse.json(
            { error: 'Missing Guild Name parameter' },
            { status: 400 }
        );
    }

    try {
        const response = await fetch(EXTERNAL_API_URL);
        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ error: 'Guild not found' }, { status: 404 });
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
