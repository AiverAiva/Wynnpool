import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = 'wynnpool';
const MONGODB_COLLECTION = 'guild_member_events';

let cachedClient: MongoClient | null = null;

async function getMongoClient() {
    if (!cachedClient) {
        cachedClient = new MongoClient(MONGODB_URI);
        await cachedClient.connect();
    }
    return cachedClient;
}

export async function POST(req: Request) {
    try {
        const client = await getMongoClient();
        const db = client.db(MONGODB_DB);
        const collection = db.collection(MONGODB_COLLECTION);

        const body = await req.json();
        const query = body.query || {};
        const page = body.page || 1;
        const limit = body.limit || 10;

        const skip = (page - 1) * limit;

        // Run the query against the collection with pagination
        const data = await collection
            .find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        const totalCount = await collection.countDocuments(query);

        return NextResponse.json({
            data,
            page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
        }, { status: 200 });
    } catch (error) {
        console.error('Error querying MongoDB:', error);
        return NextResponse.json({ error: 'Failed to fetch guild events' }, { status: 500 });
    }
}
