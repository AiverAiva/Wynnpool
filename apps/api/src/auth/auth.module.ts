import { forwardRef, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
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
  controllers: [AuthController],
  providers: [DiscordStrategy, SessionSerializer, AuthenticatedGuard],
  exports: [JwtModule, AuthenticatedGuard, UsersModule],
})
export class AuthModule {}
