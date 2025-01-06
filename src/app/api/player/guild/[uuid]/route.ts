import mongoose, { Schema, Document, Model } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = 'wynnpool';
const COLLECTION_NAME = 'guild_data';

interface Guild extends Document {
  uuid: string;
  name: string;
  prefix: string;
  members: {
    owner: Record<string, any>;
    chief: Record<string, any>;
    strategist: Record<string, any>;
    captain: Record<string, any>;
    recruiter: Record<string, any>;
    recruit: Record<string, any>;
    [key: string]: Record<string, any>;
  };
}

const guildSchema = new Schema<Guild>(
  {
    uuid: { type: String, required: true },
    name: { type: String, required: true },
    prefix: { type: String, required: true },
    members: {
      owner: { type: Object, default: {} },
      chief: { type: Object, default: {} },
      strategist: { type: Object, default: {} },
      captain: { type: Object, default: {} },
      recruiter: { type: Object, default: {} },
      recruit: { type: Object, default: {} },
    }
  },
  {
    collection: COLLECTION_NAME,
  }
);

const GuildModel: Model<Guild> = mongoose.models.Guild || mongoose.model<Guild>('Guild', guildSchema);

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ uuid: string }> }): Promise<NextResponse> {
  const playerUuid = (await params).uuid;

  if (!playerUuid) {
    return NextResponse.json({ error: 'Player UUID is required' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const guild = await GuildModel.findOne({
      $or: [
        { [`members.owner.${playerUuid}`]: { $exists: true } },
        { [`members.chief.${playerUuid}`]: { $exists: true } },
        { [`members.strategist.${playerUuid}`]: { $exists: true } },
        { [`members.captain.${playerUuid}`]: { $exists: true } },
        { [`members.recruiter.${playerUuid}`]: { $exists: true } },
        { [`members.recruit.${playerUuid}`]: { $exists: true } },
      ],
    });

    if (!guild) {
      return NextResponse.json({ error: 'Player not found in any guild' }, { status: 404 });
    }

    let playerRank = '';
    for (const rank of ['owner', 'chief', 'strategist', 'captain', 'recruiter', 'recruit']) {
      if (guild.members[rank] && guild.members[rank][playerUuid]) {
        playerRank = rank;
        break;
      }
    }

    const guildObj = guild.toObject();  //exlusive for prefix becasue somehow it justs doesnt work with direct accessing

    return NextResponse.json(
      {
        guild_uuid: guild.uuid,
        guild_name: guild.name, 
        guild_prefix: guildObj.prefix, //exlusive for prefix becasue somehow it justs doesnt work with direct accessing
        player_uuid: playerUuid,
        player_rank: playerRank,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error serving player:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
