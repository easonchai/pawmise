import { Module } from '@nestjs/common';
import { ChatSessionService } from './chat-session.service';

@Module({
  providers: [ChatSessionService],
  exports: [ChatSessionService],
})
export class ChatSessionModule {}
