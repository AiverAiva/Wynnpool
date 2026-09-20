import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Online-count buckets, written by the Rust engine
 * (apps/engine/src/tasks/guild_online.rs, `BUCKET_SECS` for the window size).
 *
 * Deliberately distinct from the legacy `guild_online_count` collection, which
 * holds raw per-tick samples and is kept read-only for comparison.
 *
 * The shape carries the information the old model could not express:
 * - `samples`        every tick inside the window, including ticks with nobody online
 * - `activeSamples`  only the ticks where at least one member was online
 * - `countSum`       sum of the per-tick counts (zeroes add nothing, so this doubles
 *                    as the sum over active ticks only)
 * - `countMax`       peak count seen in the window
 *
 * A missing bucket therefore means "not sampled", while a bucket with
 * `samples > 0 && countMax === 0` is a genuinely observed empty window. The previous
 * model recorded no row at all for a guild with nobody online, which made those two
 * cases indistinguishable and is why the chart used to fill gaps with zeroes.
 */
@Schema({ collection: 'guild_online_bucket' })
export class GuildOnlineBucket extends Document {
    @Prop({ required: true }) guild_uuid: string;
    @Prop({ required: true }) guild_name: string;
    @Prop({ required: true }) bucket: number;
    @Prop({ required: true }) samples: number;
    @Prop({ required: true }) activeSamples: number;
    @Prop({ required: true }) countSum: number;
    @Prop({ required: true }) countMax: number;
}

export const GuildOnlineBucketSchema = SchemaFactory.createForClass(GuildOnlineBucket);
