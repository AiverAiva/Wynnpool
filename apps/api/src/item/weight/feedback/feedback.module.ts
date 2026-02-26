import { forwardRef, Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { AuthModule } from '../../../auth/auth.module';
import { OptionalAuthenticatedGuard } from '../../../shared/guards/optional-authenticated.guard';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [FeedbackController],
  providers: [FeedbackService, OptionalAuthenticatedGuard],
  exports: [FeedbackService],
})
export class FeedbackModule {}
