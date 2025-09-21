import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { LinkService } from './link.service';
import { AuthenticatedGuard } from '../authenticated.guard';

class LinkMinecraftDto {
  credential: string
  code: string
}

@Controller('auth/link')
export class LinkController {
  constructor(private readonly linkService: LinkService) {}

  @UseGuards(AuthenticatedGuard)
  @Post('minecraft')
  async linkMinecraft(@Req() req: Request, @Body() body: LinkMinecraftDto) {
    const user = req.user as any
    // prefer authenticated user id as credential, otherwise use provided credential
    const credential = user?.id
    const { code } = body
    return this.linkService.verifyMinecraftLink(credential, code)
  }

  @UseGuards(AuthenticatedGuard)
  @Post('minecraft/disconnect')
  async disconnectMinecraft(@Req() req: Request) {
    const user = req.user as any
    const credential = user?.id
    return this.linkService.disconnectMinecraftLink(credential)
  }
}
