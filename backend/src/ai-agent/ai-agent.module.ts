// src/ai-agent/ai-agent.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { AiAgentService } from './ai-agent.service';
import { AiAgentController } from './ai-agent.controller';
import { ChatSessionModule } from 'src/chat-session/chat-session.module';
import { UserModule } from 'src/user/user.module';
import { PetModule } from 'src/pet/pet.module';

@Module({
  imports: [ChatSessionModule, UserModule, forwardRef(() => PetModule)],
  providers: [AiAgentService],
  controllers: [AiAgentController],
  exports: [AiAgentService],
})
export class AiAgentModule {}
