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
import { PetService } from 'src/pet/pet.service';
import { UserService } from 'src/user/user.service';
import { MockTokenPlugin } from './plugins/stakeContractHandler.plugin';
import { systemPrompt } from './prompts/systemPrompt';

interface UserToolkit {
  walletClient: SuiKeyPairWalletClient;
  tools: ToolSet;
  userAddress: string;
}

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);
  private userToolkits: Map<string, UserToolkit> = new Map();

  constructor(
    private readonly chatSessionService: ChatSessionService,
    private readonly petService: PetService,
    private readonly userService: UserService,
  ) {}

  /**
   * Get or create a toolkit for a user
   * @param userAddress The user's wallet address
   * @returns The user's toolkit
   */
  private async getToolkit(userAddress: string): Promise<UserToolkit> {
    // Check if we already have a toolkit for this user
    if (this.userToolkits.has(userAddress)) {
      return this.userToolkits.get(userAddress)!;
    }

    const user = await this.userService.getUser({
      where: { walletAddress: userAddress },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const pet = await this.petService.getPet({
      where: {
        oneActivePetPerUser: {
          userId: user.id,
          active: true,
        },
      },
    });

    if (!pet) {
      throw new Error('No active pet found for user');
    }

    // Get the pet's private key (will generate if not exists)
    const privateKey = await this.petService.getPetPrivateKey(pet.id);

    // Initialize Sui client
    const suiClient = new SuiClient({
      url: process.env.SUI_RPC_URL || 'https://fullnode.devnet.sui.io:443',
    });

    // Create keypair from private key
    const { secretKey } = decodeSuiPrivateKey(privateKey);
    const keypair = Ed25519Keypair.fromSecretKey(secretKey);

    // Create wallet client
    const walletClient = new SuiKeyPairWalletClient({
      client: suiClient,
      keypair: keypair,
    });

    // Initialize tools for this wallet
    const tools = (await getOnChainTools({
      wallet: walletClient,
      plugins: [new NftSUIPlugin(), new TokenPlugin(), new MockTokenPlugin()],
    })) as ToolSet;

    // Create and store the toolkit
    const toolkit: UserToolkit = {
      walletClient,
      tools,
      userAddress,
    };

    this.userToolkits.set(userAddress, toolkit);
    return toolkit;
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

    // Get the user's toolkit
    const toolkit = await this.getToolkit(userAddress);

    // Add user message to history
    this.chatSessionService.addMessage(userAddress, {
      role: 'user',
      content: message,
    });

    // Get updated history after adding user message
    const updatedHistory =
      this.chatSessionService.getSessionHistory(userAddress);

    // Generate response
    const aiResponse = await this.chat(updatedHistory, toolkit);

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
   * @param toolkit The user's toolkit
   * @returns AI response text
   */
  async chat(history: Message[], toolkit: UserToolkit): Promise<string> {
    try {
      const result = await generateText({
        model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
        tools: toolkit.tools,
        maxSteps: 10,
        system: systemPrompt(toolkit.userAddress),
        messages: history,
        onStepFinish: (event) => {
          this.logger.debug('Tool execution result:', event.toolResults);
        },
      });

      return result.text;
    } catch (error) {
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
   * Get wallet address for a user
   * @param userAddress The user's wallet address
   * @returns The pet's wallet address
   */
  async getWalletAddress(userAddress: string): Promise<string> {
    const toolkit = await this.getToolkit(userAddress);
    return toolkit.walletClient.getAddress();
  }

  /**
   * Clear a user's toolkit from cache
   * @param userAddress The user's wallet address
   */
  clearToolkit(userAddress: string) {
    this.userToolkits.delete(userAddress);
  }
}
