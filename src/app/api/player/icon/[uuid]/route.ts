import mongoose, { Document, Model } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

interface PlayerIconDocument extends Document {
  uuid: string;
  image: Buffer;
  contentType: string;
  createdAt: Date;
}

const PlayerIconSchema = new mongoose.Schema<PlayerIconDocument>({
  uuid: { type: String, required: true, unique: true },
  image: { type: Buffer, required: true }, // Store image as binary data
  contentType: { type: String, default: 'image/png' }, // Image content type (optional)
  createdAt: { type: Date, default: Date.now }
});

const PlayerIcon: Model<PlayerIconDocument> = mongoose.models.PlayerIcon || mongoose.model<PlayerIconDocument>('PlayerIcon', PlayerIconSchema);

const connectToDatabase = async () => {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(process.env.MONGODB_URI as string, {
        dbName: 'wynnpool',
        maxPoolSize: 5
      });
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw new Error('Failed to connect to database');
    }
  }
};

const fetchAndCacheImage = async (uuid: string): Promise<Blob> => {
  try {
    const response = await fetch(`https://vzge.me/face/128/${uuid}.png`, {
      headers: {
        'User-Agent': 'Wynnpool/1.0 (+https://github.com/AiverAiva/Wynnpool; contact@wynnpool.com)'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch image');

    const arrayBuffer = await response.arrayBuffer();

    const imageDocument = new PlayerIcon({
      uuid,
      image: Buffer.from(arrayBuffer),
      contentType: 'image/png',
    });

    await imageDocument.save();

    return new Blob([arrayBuffer], { type: 'image/png' });
  } catch (error) {
    console.error(`Error fetching or caching image for UUID: ${uuid}`, error);
    throw new Error('Failed to fetch or cache image');
  }
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ uuid: string }> }): Promise<NextResponse> {
  const uuid = (await params).uuid

  if (!uuid) {
    return NextResponse.json({ error: 'UUID is required' }, { status: 400 });
  }

  // const useCache = process.env.USE_CACHE === 'true'; // Add an environment variable to toggle

  // if (!useCache) {
  //   console.log(`Fetching directly from API for UUID: ${uuid}`);
  //   try {
  //     const response = await fetch(`https://vzge.me/face/128/${uuid}.png`, {
  //       headers: {
  //         'User-Agent': 'Wynnpool/1.0 (+https://github.com/AiverAiva/Wynnpool; contact@wynnpool.com)',
  //       },
  //     });

  //     if (!response.ok) throw new Error('Failed to fetch image directly');

  //     const imageBlob = await response.blob();

  //     return new NextResponse(imageBlob, {
  //       status: 200,
  //       headers: {
  //         'Content-Type': 'image/png',
  //         'Content-Disposition': 'inline',
  //       },
  //     });
  //   } catch (error) {
  //     console.error(`Error fetching directly for UUID: ${uuid}`, error);
  //     return NextResponse.json({ error: 'Failed to fetch directly' }, { status: 500 });
  //   }
  // }

  await connectToDatabase();

  try {
    const cachedImage = await PlayerIcon.findOne({ uuid }).lean();
    if (cachedImage) {
      console.log(`Serving cached image for UUID: ${uuid}`);
      const blob = new Blob([cachedImage.image.buffer], { type: cachedImage.contentType || 'image/png' });
      return new NextResponse(blob, {
        status: 200,
        headers: {
          'Content-Type': cachedImage.contentType || 'image/png',
          'Content-Disposition': 'inline',
        },
      });
    } else {
      console.log(`Fetching and caching new image for UUID: ${uuid}`);
      const imageBlob = await fetchAndCacheImage(uuid);
      return new NextResponse(imageBlob, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': 'inline',
        },
      });
    }
  } catch (error) {
    console.error('Error serving player icon:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
