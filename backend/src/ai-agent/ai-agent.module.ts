import { Module } from '@nestjs/common';
import { AiAgentService } from './ai-agent.service';
import { ChatSessionModule } from 'src/chat-session/chat-session.module';
import { AiAgentController } from './ai-agent.controller';

@Module({
  providers: [AiAgentService],
  imports: [ChatSessionModule],
  controllers: [AiAgentController],
})
export class AiAgentModule {}
