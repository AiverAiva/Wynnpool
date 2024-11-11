import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

const ASPECT_DATA_FILE = path.join(process.cwd(), 'src', 'data', 'aspects_pool.json');
const EXTERNAL_API_URL = 'https://nori.fish/api/aspects';

async function readLocalData() {
    try {
        const data = await fs.readFile(ASPECT_DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // console.error('Error reading local data:', error);
        return null;
    }
}

async function writeLocalData(data: any) {
    try {
        await fs.writeFile(ASPECT_DATA_FILE, JSON.stringify(data, null, 2));
        console.log('Data saved successfully');
    } catch (error) {
        console.error('Error writing local data:', error);
    }
}

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
        let data = await readLocalData();
        const currentTimestamp = Math.floor(Date.now() / 1000);

        if (!data || currentTimestamp <= data.Timestamp) {
            console.log('Fetching new data from external API');
            const newData = await fetchExternalData();

            if (newData) {
                await writeLocalData(newData);
                data = newData;
            } else if (!data) {
                return NextResponse.json({ error: 'Unable to fetch data' }, { status: 500 });
            }
        }

        return NextResponse.json(data, { status: 200 });
    }
    catch (error) {
        return NextResponse.json({ error: 'Unable to fetch data' }, { status: 500 });
    }

}