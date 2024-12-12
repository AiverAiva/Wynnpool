import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Define Schema
const GuildOnlineCountSchema = new mongoose.Schema({
    guild_name: { type: String, required: true },
    guild_uuid: { type: String, required: true },
    timestamp: { type: Number, required: true },
    count: { type: Number, required: true },
},
    {
        collection: 'guild_online_count', // Explicitly specify the collection name
    });

const GuildOnlineCountModel =
    mongoose.models.GuildOnlineCount ||
    mongoose.model('GuildOnlineCount', GuildOnlineCountSchema);

// Connect to Database
const connectToDatabase = async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI || '', {
            dbName: 'wynnpool',
        });
    }
};

// Fetch Online Count Data
export async function POST(req: Request) {
    try {
        await connectToDatabase();

        const body = await req.json();
        const { guild_uuid, startTime } = body;
        const now = Math.floor(Date.now() / 1000);

        const data = await GuildOnlineCountModel.find({
            guild_uuid,
            timestamp: { $gte: startTime, $lte: now },
        }).sort({ timestamp: 1 });

        return NextResponse.json({ data }, { status: 200 });
    } catch (error) {
        console.error('Error fetching guild online count data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch data' },
            { status: 500 }
        );
    }
}
