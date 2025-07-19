import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IsOptional, IsString, IsNumber, IsArray } from "class-validator";

@Schema({ collection: 'item_data' })
export class Item extends Document {
    @Prop({ required: true }) id: string;
}

export class SearchItemDto {
    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsArray()
    typeFilter?: string[];
}

export const ItemSchema = SchemaFactory.createForClass(Item);
