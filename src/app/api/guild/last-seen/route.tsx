import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Define Schema
const GuildLastSeenSchema = new mongoose.Schema({
    guild_uuid: { type: String, required: true },
    guild_name: { type: String, required: true },
    members: { type: Map, of: { lastSeen: { type: Number } } },
},
    {
        collection: 'guild_last_seen', // Explicitly specify the collection name
    }
);

// Create Model
const GuildLastSeen = mongoose.models.GuildLastSeen || mongoose.model('GuildLastSeen', GuildLastSeenSchema);

// Connect to Database
const connectToDatabase = async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI || '', {
            dbName: 'wynnpool',
            maxPoolSize: 5,
            connectTimeoutMS: 10000,
        });
    }
};

// Fetch Guild Last Seen Data
export async function POST(req: Request) {
    try {
        // Connect to the database
        await connectToDatabase();

        // Parse the request body
        const body = await req.json();
        const { guild_uuid } = body;

        if (!guild_uuid) {
            return NextResponse.json({ error: 'guild_uuid is required' }, { status: 400 });
        }

        // Query the database
        const guildData = await GuildLastSeen.findOne({ guild_uuid });

        if (!guildData) {
            return NextResponse.json({ error: 'Guild not found' }, { status: 404 });
        }

        return NextResponse.json({ data: guildData }, { status: 200 });
    } catch (error) {
        console.error('Error fetching guild last seen data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
