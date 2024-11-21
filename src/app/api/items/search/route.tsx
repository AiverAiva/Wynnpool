import { NextResponse } from 'next/server';

export async function POST(request: any) {
    try {
        const body = await request.json();
        if (!body) {
            return NextResponse.json({ error: "Query parameter is required." }, { status: 400 });
        }

        const response = await fetch('https://api.wynncraft.com/v3/item/search?fullResult', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`Wynncraft API error: ${response.statusText}`);
        }

        const data = await response.json();

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching data from Wynncraft API:', error);
        return NextResponse.json({ error: 'Failed to fetch data from Wynncraft API.' }, { status: 500 });
    }
}
