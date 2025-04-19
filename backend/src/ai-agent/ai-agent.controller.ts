import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Delete,
  Logger,
} from '@nestjs/common';
import { AiAgentService } from '../ai-agent/ai-agent.service';

class SendMessageDto {
  message: string;
}

@Controller('ai-agent')
export class AiAgentController {
  private readonly logger = new Logger(AiAgentController.name);

  constructor(private readonly aiAgentService: AiAgentService) {}

  @Post(':userAddress')
  async sendMessage(
    @Param('userAddress') userAddress: string,
    @Body() messageDto: SendMessageDto,
  ) {
    this.logger.log(
      `Received message from ${userAddress}: ${messageDto.message}`,
    );

    try {
      // Ensure the address is properly formatted
      const response = await this.aiAgentService.processMessage(
        messageDto.message,
        userAddress as `0x${string}`,
      );

      return {
        success: true,
        message: response,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Error processing message: ${errorMessage}`,
        errorStack,
      );
      return {
        success: false,
        error: 'Failed to process message',
      };
    }
  }

  @Get('history/:userAddress')
  getHistory(@Param('userAddress') userAddress: string) {
    this.logger.debug('fetching chat history');
    const history = this.aiAgentService.getSessionHistory(userAddress);

    // For privacy/security, only return the role and content, not any internal properties
    // const sanitizedHistory = history.map((message) => ({
    //   role: message.role,
    //   content: message.content,
    // }));

    return {
      success: true,
      history: history,
    };
  }

  @Delete(':userAddress')
  clearChat(@Param('userAddress') userAddress: string) {
    const wasDeleted = this.aiAgentService.clearSessionHistory(
      userAddress as `0x${string}`,
    );

    return {
      success: wasDeleted,
    };
  }

  @Post(':userAddress/emergency-withdrawal')
  async triggerEmergencyWithdrawal(@Param('userAddress') userAddress: string) {
    this.logger.log(`Emergency withdrawal requested for: ${userAddress}`);

    try {
      const result = await this.aiAgentService.processEmergencyWithdrawal(
        userAddress as `0x${string}`,
      );

      return {
        success: result.success,
        message: result.message,
        txHash: result.txHash,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error processing emergency withdrawal: ${errorMessage}`,
      );

      return {
        success: false,
        error: 'Failed to process emergency withdrawal',
      };
    }
  }

  @Post(':userAddress/stake-all-tokens')
  async stakeAllTokens(@Param('userAddress') userAddress: string) {
    this.logger.log(`Staking all tokens requested for: ${userAddress}`);

    try {
      const result = await this.aiAgentService.processStakeAllTokens(
        userAddress as `0x${string}`,
      );

      return {
        success: result.success,
        message: result.message,
        txHash: result.txHash,
        amount: result.amount,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error staking all tokens: ${errorMessage}`);

      return {
        success: false,
        error: 'Failed to stake tokens',
      };
    }
  }
}
