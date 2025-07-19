import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { DatabaseItemService } from './item-database.service';
import { AuthenticatedGuard } from '../../auth/authenticated.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('item/database')
export class DatabaseItemController {
  constructor(private readonly databaseItemService: DatabaseItemService) {}

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
}
