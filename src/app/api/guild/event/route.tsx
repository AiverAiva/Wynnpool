import { NextResponse } from 'next/server';
import mongoose, { Schema, model, Document } from 'mongoose';

// MongoDB Configuration
const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = 'wynnpool';
const COLLECTION_NAME = 'guild_member_events';

// Define Mongoose Schema and Model
interface GuildMemberEvent extends Document {
    timestamp: number;
    event: string;
    name: string;
    guild_uuid: string;
    guild_name: string;
    rank?: string;
    old_rank?: string;
    new_rank?: string;
}

const GuildMemberEventSchema = new Schema<GuildMemberEvent>(
    {
        timestamp: { type: Number, required: true },
        event: { type: String, required: true },
        name: { type: String, required: true },
        guild_uuid: { type: String, required: true },
        guild_name: { type: String, required: true },
        rank: { type: String },
        old_rank: { type: String },
        new_rank: { type: String },
    },
    {
        collection: COLLECTION_NAME, // Explicitly specify the collection name
    }
);

const GuildMemberEventModel =
    mongoose.models.GuildMemberEvent ||
    model<GuildMemberEvent>('GuildMemberEvent', GuildMemberEventSchema);

const connectToDatabase = async () => {
    if (mongoose.connection.readyState === 0) {
        try {
            await mongoose.connect(MONGODB_URI, {
                dbName: MONGODB_DB,
                maxPoolSize: 5,
                connectTimeoutMS: 10000,
            });
            console.log('Connected to MongoDB with Mongoose');
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
            throw new Error('Failed to connect to database');
        }
    }
};

export async function POST(req: Request) {
    try {
        await connectToDatabase();

        const body = await req.json();
        const query = body.query || {};
        const page = body.page || 1;
        const limit = body.limit || 10;

        const skip = (page - 1) * limit;

        const data = await GuildMemberEventModel.find(query)
            .sort({ timestamp: -1 }) // Sort from latest to oldest
            .skip(skip)
            .limit(limit);

        const totalCount = await GuildMemberEventModel.countDocuments(query);

        return NextResponse.json(
            {
                data,
                page,
                totalPages: Math.ceil(totalCount / limit),
                totalCount,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error querying MongoDB with Mongoose:', error);
        return NextResponse.json(
            { error: 'Failed to fetch guild events' },
            { status: 500 }
        );
    }
}
