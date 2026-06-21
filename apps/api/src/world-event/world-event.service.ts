import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class WorldEventService {
    constructor(
        @InjectConnection() private readonly connection: Connection,
    ) {}

    /**
     * Get all static world events, optionally filtered.
     */
    async getEvents(filters?: {
        difficulty?: string[];
        levelMin?: number;
        levelMax?: number;
        length?: string[];
    }) {
        try {
            const collection = this.connection.collection('world_events');
            const query: Record<string, any> = {};

            if (filters?.difficulty?.length) {
                query.difficulty = { $in: filters.difficulty };
            }
            if (filters?.levelMin != null || filters?.levelMax != null) {
                query.level = {};
                if (filters.levelMin != null) query.level.$gte = filters.levelMin;
                if (filters.levelMax != null) query.level.$lte = filters.levelMax;
            }
            if (filters?.length?.length) {
                query.length = { $in: filters.length };
            }

            const docs = await collection.find(query).sort({ level: 1 }).toArray();
            return docs;
        } catch (e) {
            console.error('Error in getEvents:', e);
            throw new InternalServerErrorException('Failed to fetch world events');
        }
    }

    /**
     * Get the latest schedule snapshot (all events with their current schedule).
     */
    async getLatestSchedules() {
        try {
            const schedulesColl = this.connection.collection('world_event_schedules');

            // Get the most recent polledAt timestamp
            const latest = await schedulesColl
                .find()
                .sort({ polledAt: -1 })
                .limit(1)
                .toArray();

            if (latest.length === 0) return [];

            const latestPolledAt = latest[0].polledAt;

            // Get all schedules from that poll
            const docs = await schedulesColl
                .find({ polledAt: latestPolledAt })
                .toArray();

            return docs;
        } catch (e) {
            console.error('Error in getLatestSchedules:', e);
            throw new InternalServerErrorException('Failed to fetch event schedules');
        }
    }

    /**
     * Get the changelog of static event data changes.
     */
    async getChangelog(limit = 50) {
        try {
            const collection = this.connection.collection('world_event_changelog');
            const docs = await collection
                .find()
                .sort({ changedAt: -1 })
                .limit(limit)
                .toArray();
            return docs;
        } catch (e) {
            console.error('Error in getChangelog:', e);
            throw new InternalServerErrorException('Failed to fetch event changelog');
        }
    }
}
