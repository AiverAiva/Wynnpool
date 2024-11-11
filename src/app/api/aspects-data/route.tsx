import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get the path to the JSON file
    const dataFilePath = path.join(process.cwd(), 'src', 'data', 'aspects_data.json');
    
    // Read the file
    const fileContents = await fs.readFile(dataFilePath, 'utf8');
    
    // Parse the JSON data
    const aspectData = JSON.parse(fileContents);

    // Send the response with the parsed data
    return NextResponse.json(aspectData, { status: 200 });
  } catch (error) {
    // Handle errors
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}
