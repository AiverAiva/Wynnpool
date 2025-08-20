import { Injectable, HttpException, HttpStatus, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model } from 'mongoose';
import { Item } from './item.schema';
import { parseIdString } from 'src/lib/wynntils-decode';
import { calculateIdentificationRoll } from 'src/lib/itemUtils';

@Injectable()
export class ItemService implements OnModuleInit {
    constructor(
        @InjectModel(Item.name) private readonly itemModel: Model<Item>,
        @InjectConnection() private readonly connection: Connection
    ) { }
    private readonly ID_KEYS_URL = 'https://raw.githubusercontent.com/Wynntils/Static-Storage/refs/heads/main/Reference/id_keys.json';
    private readonly SHINY_STATS_URL = 'https://raw.githubusercontent.com/Wynntils/Static-Storage/main/Data-Storage/shiny_stats.json';

    private idMap = new Map<number, string>();
    private shinyStatsMap = new Map<number, { key: string; displayName: string }>();

    private readonly logger = new Logger(ItemService.name);

    async onModuleInit() {
        try {
            // Load ID map
            const idMapRes = await fetch(this.ID_KEYS_URL);
            const idRaw = await idMapRes.json();
            for (const [name, id] of Object.entries(idRaw)) {
                if (typeof id === 'number') {
                    this.idMap.set(id, name);
                }
            }

            // Load shiny stat map
            const shinyRes = await fetch(this.SHINY_STATS_URL);
            const shinyRaw = await shinyRes.json();
            for (const entry of shinyRaw) {
                this.shinyStatsMap.set(entry.id, {
                    key: entry.key,
                    displayName: entry.displayName,
                });
            }

            this.logger.log(`Preloaded ${this.idMap.size} ID keys and ${this.shinyStatsMap.size} shiny stats.`);
        } catch (err) {
            this.logger.error('Failed to preload id_keys.json', err);
        }
    }

    async searchItems(query: FilterQuery<any>) {
        return await this.itemModel.find(query).lean();
    }

    async streamSearch(query: any) {
        return this.itemModel.find(query).lean().cursor();
    }

    async findItemById(itemId: string, changelog = false) {
        const projection = changelog
            ? '-_id' // include all fields
            : { _id: 0, changelog: 0 }; // exclude changelog

        const item = await this.itemModel.findOne({ id: itemId }).select(projection).lean();

        if (!item) {
            throw new HttpException('Item not found', HttpStatus.NOT_FOUND);
        }

        return item;
    }

    decode(id: string) {
        return parseIdString(id);
    }

    summarize(id: string) {
        const blocks = parseIdString(id);
        const summary: {
            itemName: string;
            powderSlots?: number;
            powders?: any[];
            identifications?: Record<string, number>;
            shinyStat?: { key: string; displayName: string; rerollCount?: number; value: number };
            rerollCount?: number;
        } = { itemName: '' };

        for (const block of blocks) {
            if (block.name === 'NameData') {
                summary.itemName = block.nameStr;
            }

            if (block.name === 'PowderData') {
                summary.powderSlots = block.powderSlots;
                summary.powders = block.powders;
            }

            if (block.name === 'IdentificationData') {
                summary.identifications = {}
                for (const id of block.identifications) {
                    const name = this.idMap.get(id.kind);
                    if (name && typeof id.roll === 'number') {
                        summary.identifications[name] = id.roll;
                    }
                }
            }

            if (block.name === 'ShinyData') {
                const shiny = this.shinyStatsMap.get(block.shinyId);
                if (shiny && typeof block.val === 'number') {
                    summary.shinyStat = {
                        key: shiny.key,
                        displayName: shiny.displayName,
                        value: block.val,
                    };
                    if (block.rerollCount) {
                        summary.shinyStat.rerollCount = block.rerollCount;
                    }
                }
            }

            if (block.name === 'RerollData') {
                summary.rerollCount = block.rerollCount;
            }
        }

        return summary;
    }

    async findWeightsByItemName(itemName: string): Promise<any[]> {
        const collection = this.connection.collection('weight_data')
        return collection.find({ item_name: itemName }).toArray();
    }

    processIdentification(original, input) {
        if (!original?.identifications || !input?.identifications) return {};

        const result = {};
        Object.entries(input.identifications)
            .filter(([key]) => original.identifications && key in original.identifications)
            .forEach(([key, value]) => {
                const originalStat = original.identifications?.[key];
                if (!originalStat || typeof originalStat !== 'object') return;
                if (typeof value !== 'number') return;

                result[key] = calculateIdentificationRoll(
                    key,
                    originalStat,
                    value
                );
            });
        return result;
    }

    calculateWeightedScore(
        identications: Record<string, any>,
        weight: Record<string, number>
    ): number {
        let total = 0;
        const weightIdentifications = weight.identifications || {};

        const detailed = Object.entries(identications).map(([key, data]) => {
            const weight = weightIdentifications[key] ?? 0;
            let score: number;

            if (weight < 0) {
                // If the weight is negative, we need to invert the percentage
                const invertedPercentage = 100 - data.percentage;
                score = Math.abs(invertedPercentage * weight);
                total += score;
            } else {
                score = data.percentage * weight;
                total += score;
            }

            return { name: key, score: parseFloat(score.toFixed(3)) };
        })

        return parseFloat(total.toFixed(2))
        // {
        //     total: ,
        //     detailed,
        // };
    }

}
