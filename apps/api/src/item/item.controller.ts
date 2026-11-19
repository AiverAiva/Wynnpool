import { Controller, Post, Get, Body, Param, HttpException, HttpStatus, Query } from '@nestjs/common';
import { ItemService } from './item.service';
import { SearchItemDto } from './item.schema';
import { ItemDecodeDetails, ItemDecodeError } from '@lib/wynntils-decode';

@Controller('item')
export class ItemController {
    constructor(private readonly itemService: ItemService) { }

    @Post("search")
    async searchItems(
        @Body() query: SearchItemDto,
        @Query('changelog') changelog?: string
    ) {
        const containChangelog = changelog === 'true';
        return this.itemService.searchItems(query, containChangelog);
    }


    @Get(':itemId')
    async getItem(
        @Param('itemId') itemId: string,
        @Query('changelog') changelog?: string
    ) {
        const containChangelog = changelog === 'true';
        return this.itemService.findItemById(itemId, containChangelog);
    }

    @Get(':itemName/weight')
    async getItemWeights(@Param('itemName') itemName: string) {
        if (!itemName) {
            throw new HttpException('Missing itemName parameter', HttpStatus.BAD_REQUEST);
        }
        const weights = await this.itemService.findWeightsByItemName(itemName);
        // Remove _id and userId from each object
        const result = weights.map(({ _id, userId, ...rest }) => rest);
        return result;
    }

    @Post('decode')
    decodeId(@Body('item') item: string) {
        if (!item) {
            throw new HttpException('Missing id string', HttpStatus.BAD_REQUEST);
        }

        try {
            return this.itemService.decode(item);
        } catch (err) {
            throw this.itemDecodeException(err);
        }
    }

    @Post('decode/summary')
    decodeSummary(@Body('item') item: string) {
        if (!item) {
            throw new HttpException('Missing id string', HttpStatus.BAD_REQUEST);
        }

        try {
            return this.itemService.summarize(item);
        } catch (err) {
            throw this.itemDecodeException(err);
        }
    }

    @Post('full-decode')
    async getFullDecodedInfo(@Body('item') item: string) {
        if (!item) {
            throw new HttpException('Missing item', HttpStatus.BAD_REQUEST);
        }

        const summary = this.summarizeOrBadRequest(item);
        const original = await this.findOriginalOrNotFound(summary.itemName);
        this.itemService.normalizeIdentificationsToRolls(summary, original);
        const weights = await this.itemService.findWeightsByItemName(summary.itemName);

        return {
            original,
            input: summary,
            weights,
        };
    }

    @Post('analyze')
    async analyzeItem(@Body('item') item: string) {
        if (!item) {
            throw new HttpException('Missing item', HttpStatus.BAD_REQUEST);
        }

        const summary = this.summarizeOrBadRequest(item);
        const original = await this.findOriginalOrNotFound(summary.itemName);
        this.itemService.normalizeIdentificationsToRolls(summary, original);
        const weights = await this.itemService.findWeightsByItemName(summary.itemName);
        const result: any = { ...summary };
        // Add processedIdentifications to the response
        const processedIdentifications = this.itemService.processIdentification(original, summary);
        result.identifications = processedIdentifications;

        // Calculate overall average percentage from identifications
        if (processedIdentifications && typeof processedIdentifications === 'object') {
            const percentages = Object.values(processedIdentifications)
                .map((id: any) => typeof id.percentage === 'number' ? id.percentage : null)
                .filter((p): p is number => p !== null);
            if (percentages.length > 0) {
                const avg = percentages.reduce((a, b) => a + b, 0) / percentages.length;
                result.overall = avg;
            } else {
                result.overall = null;
            }
        } else {
            result.overall = null;
        }

        const weightedscores = {};
        // Use the first weight map if available
        if (weights && weights.length > 0) {
            weights.forEach(weight => {
                weightedscores[weight.weight_name] = this.itemService.calculateWeightedScore(processedIdentifications, weight);
            });
        }

        result.weightedScores = weightedscores;

        return {
            ...result,
        };
    }

    /** An undecodable item string is a client error, not a server fault. */
    private summarizeOrBadRequest(item: string) {
        try {
            return this.itemService.summarize(item);
        } catch (err) {
            throw this.itemDecodeException(err);
        }
    }

    /**
     * Build a 400 response that names the failure and carries the fields a
     * report needs: encoding version, byte offset and the blocks already read.
     */
    private itemDecodeException(err: unknown): HttpException {
        const body = {
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'ItemDecodeError',
        };

        if (err instanceof ItemDecodeError) {
            return new HttpException(
                {
                    ...body,
                    message: this.describeDecodeFailure(err.details),
                    diagnostics: err.details,
                },
                HttpStatus.BAD_REQUEST,
            );
        }

        return new HttpException(
            {
                ...body,
                message: 'The item string could not be decoded.',
            },
            HttpStatus.BAD_REQUEST,
        );
    }

    private describeDecodeFailure(details: ItemDecodeDetails): string {
        switch (details.code) {
            case 'invalid-characters':
                return 'This text contains characters that are not part of a Wynncraft item string. Copy the string again from the game.';
            case 'invalid-start':
                return 'This text is not a Wynncraft item string. Copy the string again from the game.';
            case 'unsupported-version':
                return `This item uses an encoding version Wynnpool cannot read yet (${details.versionName}). Please report it with the debug info below so support can be added.`;
            case 'unsupported-block':
                return `This item string contains data Wynnpool cannot read yet (${details.versionName ?? 'unknown encoding'}). Please report it with the debug info below.`;
            case 'truncated':
                return `This item string looks incomplete: decoding stopped after byte ${details.offset} of ${details.byteLength}. Copy the whole string and try again.`;
            default:
                return `This item string could not be decoded (${details.versionName ?? 'unknown encoding'}). Please report it with the debug info below.`;
        }
    }

    /** A string can decode cleanly yet name an item the database does not hold. */
    private async findOriginalOrNotFound(itemName: string) {
        try {
            return await this.itemService.findItemById(itemName);
        } catch (err) {
            if (err instanceof HttpException && err.getStatus() === HttpStatus.NOT_FOUND) {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.NOT_FOUND,
                        error: 'ItemNotInDatabase',
                        message: `The string decoded to "${itemName}", but that item is not in Wynnpool's item database yet. Please report it with the item string so the item can be added.`,
                        diagnostics: { itemName },
                    },
                    HttpStatus.NOT_FOUND,
                );
            }
            throw err;
        }
    }
}
