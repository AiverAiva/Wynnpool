import { NextResponse } from 'next/server';

const EXTERNAL_API_URL = 'https://api.wynncraft.com/v3/latest-news';

async function fetchExternalData() {
    try {
        const response = await fetch(EXTERNAL_API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching external data:', error);
        return null;
    }
}

export async function GET() {
    try {
        const data = await fetchExternalData();
        return NextResponse.json(data, { status: 200 });
    }
    catch (error) {
        return NextResponse.json({ error: 'Unable to fetch data' }, { status: 500 });
    }

}
