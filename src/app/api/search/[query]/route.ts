import { NextResponse } from 'next/server';

const EXTERNAL_API_BASE_URL = 'https://api.wynncraft.com/v3/search';

export async function GET(
    request: Request,
    context: { params: { query: string } } // Correct type for the second argument
) {
    const { query } = context.params;

    if (!query) {
        return NextResponse.json({ error: 'Missing search query' }, { status: 400 });
    }

    try {
        const response = await fetch(`${EXTERNAL_API_BASE_URL}/${encodeURIComponent(query)}`);
        
        // Handle all non-200 responses as "No results found."
        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ error: 'No results found for the given query.' }, { status: 404 });
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error('Error fetching data from Wynncraft API:', error);

        // Return a generic error response for unexpected errors
        return NextResponse.json({ error: 'Unable to fetch data from the API.' }, { status: 500 });
    }
}
