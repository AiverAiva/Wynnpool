import { Controller, Get, Param } from '@nestjs/common';
import { WynncraftService } from './wynncraft.service';

@Controller('wynncraft')
export class WynncraftController {
  constructor(private readonly wynncraftService: WynncraftService) {}

  @Get('articles/list/:type')
  async listArticles(@Param('type') type: string) {
    return this.wynncraftService.listArticles(type);
  }

  @Get('articles/fetch/:type/:id')
  async fetchArticle(@Param('type') type: string, @Param('id') id: string) {
    return this.wynncraftService.fetchArticle(type, id);
  }
}
