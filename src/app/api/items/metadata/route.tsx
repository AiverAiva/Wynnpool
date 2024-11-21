import { NextResponse } from 'next/server';

const EXTERNAL_API_URL = 'https://api.wynncraft.com/v3/item/metadata';

export async function GET() {
    try {
        const response = await fetch(EXTERNAL_API_URL)
        const data = await response.json()

        return NextResponse.json(data, { status: 200 });
    }
    catch (error) {
        return NextResponse.json({ error: 'Error fetching identifications'+error }, { status: 500 });
    }

}


