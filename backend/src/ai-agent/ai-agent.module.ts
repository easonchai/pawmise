import { Module } from '@nestjs/common';
import { AiAgentService } from './ai-agent.service';
import { ChatSessionModule } from 'src/chat-session/chat-session.module';
import { AiAgentController } from './ai-agent.controller';
import { UserModule } from 'src/user/user.module';
import { PetModule } from 'src/pet/pet.module';
import { UserService } from 'src/user/user.service';
import { PetService } from 'src/pet/pet.service';

@Module({
  providers: [AiAgentService, UserService, PetService],
  imports: [ChatSessionModule, UserModule, PetModule],
  controllers: [AiAgentController],
})
export class AiAgentModule {}
