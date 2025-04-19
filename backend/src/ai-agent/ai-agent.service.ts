import { Injectable, Logger } from '@nestjs/common';
import {
  ChatSessionService,
  Message,
} from 'src/chat-session/chat-session.service';
import { openai } from '@ai-sdk/openai';
import { generateText, ToolSet } from 'ai';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { SuiKeyPairWalletClient } from '@goat-sdk/wallet-sui';
import { getOnChainTools } from '@goat-sdk/adapter-vercel-ai';
import { TokenPlugin } from './plugins/tokenHandler.plugin';
import { NftSUIPlugin } from './plugins/nftHandler.plugin';

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);
  private wallet: SuiKeyPairWalletClient;
  private tools: ToolSet;

  constructor(private readonly chatSessionService: ChatSessionService) {
    // Initialize the wallet asynchronously when service is constructed
    void this.initializeWallet();
  }

  /**
   * Initialize the wallet and tools
   */
  private async initializeWallet() {
    try {
      // Initialize Sui client
      const suiClient = new SuiClient({
        url: process.env.SUI_RPC_URL || 'https://fullnode.devnet.sui.io:443',
      });

      // Create or import a keypair using private key from env
      const bech32PrivateKey = process.env.PK;
      if (!bech32PrivateKey) {
        throw new Error('PK environment variable is not set');
      }

      const { secretKey } = decodeSuiPrivateKey(bech32PrivateKey);
      const keypair = Ed25519Keypair.fromSecretKey(secretKey);

      // Initialize the wallet client
      this.wallet = new SuiKeyPairWalletClient({
        client: suiClient,
        keypair: keypair,
      });

      try {
        // Get on-chain tools
        const onChainTools = await getOnChainTools({
          wallet: this.wallet,
          plugins: [new NftSUIPlugin(), new TokenPlugin()],
        });

        // Convert the tools to a format we can work with
        this.tools = onChainTools as Record<string, any>;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed to initialize on-chain tools: ${errorMessage}`,
        );
        throw new Error(
          `Failed to initialize blockchain tools: ${errorMessage}`,
        );
      }

      this.logger.log('Wallet and tools initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize wallet:', error);
      throw error;
    }
  }

  /**
   * Process a message from a user
   * @param message The message text
   * @param userAddress The user's wallet address
   * @returns The AI's response
   */
  async processMessage(
    message: string,
    userAddress: `0x${string}`,
  ): Promise<string> {
    this.logger.log(`Processing message for user: ${userAddress}`);

    // Get existing history
    const history = this.chatSessionService.getSessionHistory(userAddress);

    // Add user message to history
    this.chatSessionService.addMessage(userAddress, {
      role: 'user',
      content: message,
    });

    // Get updated history after adding user message
    const updatedHistory =
      this.chatSessionService.getSessionHistory(userAddress);

    // Generate response
    const aiResponse = await this.chat(updatedHistory);

    // Store AI response
    this.chatSessionService.addMessage(userAddress, {
      role: 'assistant',
      content: aiResponse,
    });

    return aiResponse;
  }

  /**
   * Generate AI response based on conversation history
   * @param history Conversation history
   * @returns AI response text
   */
  async chat(history: Message[]): Promise<string> {
    try {
      // Wait for tools to be initialized if they're not ready yet
      if (Object.keys(this.tools).length === 0) {
        this.logger.log('Waiting for tools initialization...');
        await this.initializeWallet();
      }

      // Create a formatted history with system message if not present
      // const formattedHistory = this.ensureSystemMessage(history);

      const result = await generateText({
        model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
        tools: this.tools,
        maxSteps: 10,
        messages: history,
        onStepFinish: (event) => {
          this.logger.debug('Tool execution result:', event.toolResults);
        },
      });

      return result.text;
    } catch (error) {
      // Safe error handling
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error generating AI response: ${errorMessage}`);
      return "I'm sorry, I encountered an error while processing your request.";
    }
  }

  getSessionHistory(userAddress: string) {
    return this.chatSessionService.getSessionHistory(userAddress);
  }

  clearSessionHistory(userAddress: string) {
    return this.chatSessionService.clearSessionHistory(userAddress);
  }

  /**
   * Ensure the history has a system message
   */
  // private ensureSystemMessage(history: Message[]): Message[] {
  //   const hasSystemMessage = history.some((msg) => msg.role === 'system');
  //
  //   if (!hasSystemMessage) {
  //     return [
  //       {
  //         role: 'system',
  //         content:
  //           'You are a helpful assistant with access to Sui blockchain tools. Answer concisely and accurately.',
  //       },
  //       ...history,
  //     ];
  //   }
  //
  //   return history;
  // }

  /**
   * Get wallet address
   * @returns The current wallet address
   */
  getWalletAddress(): string {
    return this.wallet ? this.wallet.getAddress() : 'Wallet not initialized';
  }
}
