import { Module, forwardRef } from '@nestjs/common';
import { PetService } from './pet.service';
import { PetController } from './pet.controller';
import { AiAgentModule } from 'src/ai-agent/ai-agent.module';

@Module({
  imports: [forwardRef(() => AiAgentModule)],
  providers: [PetService],
  controllers: [PetController],
  exports: [PetService],
})
export class PetModule {}
