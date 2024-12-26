import { NextResponse, NextRequest } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { itemName: string } }
): Promise<NextResponse> {
    const itemName = (await params).itemName;
    const EXTERNAL_API_URL = `https://api.wynncraft.com/v3/item/search/${encodeURIComponent(itemName)}`;

    if (!itemName) {
        return NextResponse.json(
            { error: 'Missing Item Name parameter' },
            { status: 400 }
        );
    }

    try {
        const response = await fetch(EXTERNAL_API_URL);

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json(
                    { error: 'Item not found' },
                    { status: 404 }
                );
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }

        const data = await response.json();

        // Check if the returned data has the expected structure
        if (!data || !data[itemName]) {
            return NextResponse.json(
                { error: 'Item not found in response' },
                { status: 404 }
            );
        }

        // Extract the desired item structure
        const itemData = data[itemName];
        return NextResponse.json(itemData, { status: 200 });
    } catch (error) {
        console.error('Error fetching external data:', error);
        return NextResponse.json(
            { error: 'Unable to fetch data' },
            { status: 500 }
        );
    }
}
