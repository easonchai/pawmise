import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AiAgentModule } from './ai-agent/ai-agent.module';
import { UserModule } from './user/user.module';
import { PetModule } from './pet/pet.module';
import { ChatSessionModule } from './chat-session/chat-session.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AiAgentModule,
    UserModule,
    PetModule,
    ChatSessionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
