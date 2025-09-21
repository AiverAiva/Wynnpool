import { forwardRef, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { LinkController } from './link/link.controller';
import { LinkService } from './link/link.service';
import { DiscordStrategy } from './discord.strategy';
import { UsersModule } from '../users/users.module';
import { SessionSerializer } from './session.serializer';
import { JwtModule } from '@nestjs/jwt';
import { AuthenticatedGuard } from './authenticated.guard';

@Module({
  imports: [
    PassportModule.register({ session: true }),
    forwardRef(() => UsersModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [AuthController, LinkController],
  providers: [DiscordStrategy, SessionSerializer, AuthenticatedGuard, LinkService],
  exports: [JwtModule, AuthenticatedGuard, UsersModule],
})
export class AuthModule {}
