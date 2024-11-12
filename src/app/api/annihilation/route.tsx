import { NextResponse } from 'next/server';
import fs from 'fs'
import path from 'path'

const DATA_URL = 'https://raw.githubusercontent.com/AiverAiva/anni-pred/refs/heads/main/data/stable.json';
const LOCAL_DATA_PATH = path.join(process.cwd(), 'src', 'data', 'annihilation.json');

export async function GET() {
  try {
    // let data;
    // if (fs.existsSync(LOCAL_DATA_PATH)) {
    //   const localData = JSON.parse(fs.readFileSync(LOCAL_DATA_PATH, 'utf-8'));
    //   const currentTime = Date.now();

    //   if (localData.current.datetime_utc > currentTime) {
    //     data = localData;
    //   }
    // }

    // if (!data) {
    //   const response = await fetch(DATA_URL);
    //   data = await response.json();

    //   fs.writeFileSync(LOCAL_DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
    // }
    const data = JSON.parse(fs.readFileSync(LOCAL_DATA_PATH, 'utf-8'));
    // Send response
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching or reading data:", error);
    return NextResponse.json({ error: 'Unable to fetch data' }, { status: 500 });
  }
}
