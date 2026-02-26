import { forwardRef, Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { SuggestionController } from './suggestion.controller';
import { SuggestionService } from './suggestion.service';
import { AuthModule } from '../../../auth/auth.module';
import { OptionalAuthenticatedGuard } from '../../../shared/guards/optional-authenticated.guard';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [FeedbackController, SuggestionController],
  providers: [FeedbackService, SuggestionService, OptionalAuthenticatedGuard],
  exports: [FeedbackService, SuggestionService],
})
export class FeedbackModule {}
