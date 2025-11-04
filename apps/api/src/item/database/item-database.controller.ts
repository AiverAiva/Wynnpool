import { Controller, Get, Post, Param, Body, UseGuards, Req, Delete } from '@nestjs/common';
import { DatabaseItemService } from './item-database.service';
import { AuthenticatedGuard } from '../../auth/authenticated.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';

@Controller('item/database')
export class DatabaseItemController {
  constructor(private readonly databaseItemService: DatabaseItemService) { }

  @Get(':itemName')
  async getDatabaseItems(@Param('itemName') itemName: string) {
    return this.databaseItemService.getVerifyItems(itemName);
  }

  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('ITEM_DATABASE')
  async addVerifyItem(@Body() body: { itemName: string; originalString: string; owner: string }, @Req() req) {
    // Optionally, you can use req.user to set owner automatically
    return this.databaseItemService.addVerifyItem(body);
  }

  @Post('search')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('ITEM_DATABASE')
  async searchDatabaseItems(
    @Body() body: { itemName?: string; owner?: string }
  ) {
    return this.databaseItemService.searchDatabaseItems(body);
  }

  @Throttle({ default: { limit: 5, ttl: 86400 } })
  @Delete(':id')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('ITEM_DATABASE')
  async deleteDatabaseItem(@Param('id') id: string, @Req() req: Request) {
    // pass the authenticated user so the service can include who deleted the item
    return this.databaseItemService.deleteDatabaseItem(id, req?.user);
  }
}
