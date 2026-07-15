import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const expected = this.configService.get<string>('API_INTERNAL_KEY');
    if (!expected) {
      throw new Error('API_INTERNAL_KEY not configured');
    }

    if (authHeader !== `Bearer ${expected}`) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
