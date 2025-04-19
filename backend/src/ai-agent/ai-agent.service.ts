import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
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
import { USDCTokenPlugin } from './plugins/stakeContractHandler.plugin';
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
    @Inject(forwardRef(() => PetService))
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
      plugins: [new NftSUIPlugin(), new TokenPlugin(), new USDCTokenPlugin()],
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
   * Process emergency withdrawal for a user
   * @param userAddress The user's wallet address
   * @returns Result of the emergency withdrawal operation
   */
  async processEmergencyWithdrawal(
    userAddress: `0x${string}`,
  ): Promise<{ success: boolean; message: string; txHash?: string }> {
    this.logger.log(`Processing emergency withdrawal for user: ${userAddress}`);

    try {
      // Get the user's toolkit
      const toolkit = await this.getToolkit(userAddress);

      // Get the pet's balance from the database
      const user = await this.userService.getUser({
        where: { walletAddress: userAddress },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const pet = await this.petService.getActivePetByUserId(user.id);

      if (!pet) {
        throw new Error('No active pet found for user');
      }

      // Generate AI response for emergency withdrawal
      const result = await generateText({
        model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
        tools: toolkit.tools,
        maxSteps: 15, // Slightly increased to allow for both operations
        prompt: `EMERGENCY WITHDRAWAL: The user has requested an emergency withdrawal. Please redeem ALL tokens from the staking contract using the redeem_token tool. Then, transfer ALL USDC tokens in the wallet to the user's address (${userAddress}) using the send_tokens tool. The pet's current balance is ${pet.balance}. This is an emergency, so execute this immediately without asking for confirmation.`,
        onStepFinish: (event) => {
          this.logger.debug('Tool execution result:', event.toolResults);
        },
      });

      await this.petService.updatePetActive(pet.id, false);

      return {
        success: true,
        message: result.text,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error processing emergency withdrawal: ${errorMessage}`,
      );

      return {
        success: false,
        message: `Failed to process withdrawal: ${errorMessage}`,
      };
    }
  }

  /**
   * Process staking of all available USDC tokens in agent's wallet
   * @param userAddress The user's wallet address
   * @returns Result of the staking operation
   */
  async processStakeAllTokens(userAddress: `0x${string}`): Promise<{
    success: boolean;
    message: string;
    txHash?: string;
    amount?: number;
  }> {
    this.logger.log(
      `Processing staking of all tokens for user: ${userAddress}`,
    );

    try {
      const toolkit = await this.getToolkit(userAddress);

      const result = await generateText({
        model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
        tools: toolkit.tools,
        maxSteps: 15,
        prompt: `I need you to stake half of the USDC tokens in the lending market. Follow these steps precisely:

        1. First, check the balance of USDC tokens in the wallet using view_balance with tokenType USDC.

        2. IMPORTANT: The balance will be reported in base units with 9 decimals (e.g., 199999999875). You must:
           a) DIVIDE this number by 1,000,000,000 (1e9) to get the human‐readable balance.
           b) THEN DIVIDE that human‐readable balance by 2 to obtain the amount to stake.

        3. For example, if the raw balance is 199999999875:
           - 199999999875 ÷ 1e9 = 199.999999875
           - 199.999999875 ÷ 2 = 99.9999999375
           You should call stake_token with amount = 99.9999999375

        4. Use the stake_token tool with this half‑balance amount.

        5. Confirm the staking was successful and report how many tokens were staked.

        Execute these steps immediately without asking for confirmation.`,
        onStepFinish: (event) => {
          this.logger.debug('Tool execution result:', event.toolResults);
        },
      });

      return {
        success: true,
        message: result.text,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error processing token staking: ${errorMessage}`);

      return {
        success: false,
        message: `Failed to stake tokens: ${errorMessage}`,
      };
    }
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

  getTier(amount: number): number {
    const scaledAmount = amount * 1e6;
    let tier = 1;

    switch (true) {
      case scaledAmount < 100 * 1e6:
        tier = 1;
        break;
      case scaledAmount < 500 * 1e6:
        tier = 2;
        break;
      case scaledAmount < 1000 * 1e6:
        tier = 3;
        break;
      case scaledAmount < 5000 * 1e6:
        tier = 4;
        break;
      case scaledAmount < 10000 * 1e6:
        tier = 5;
        break;
      default:
        tier = 1;
    }

    return tier;
  }

  getImageUrl(tier: number) {
    const imageUrls = [
      '',
      'https://taudugtrvamveseedfck.supabase.co/storage/v1/object/public/images/realms/tier-1-realm.png',
      'https://taudugtrvamveseedfck.supabase.co/storage/v1/object/public/images/realms/tier-2-realm.png',
      'https://taudugtrvamveseedfck.supabase.co/storage/v1/object/public/images/realms/tier-3-realm.png',
      'https://taudugtrvamveseedfck.supabase.co/storage/v1/object/public/images/realms/tier-4-realm.png',
      'https://taudugtrvamveseedfck.supabase.co/storage/v1/object/public/images/realms/tier-5-realm.png',
    ];
    return imageUrls[tier];
  }

  async upgradeOrMintNFT(userAddress: string, balance: bigint) {
    this.logger.log(`Processing emergency withdrawal for user: ${userAddress}`);

    try {
      // Get the user's toolkit
      const toolkit = await this.getToolkit(userAddress);

      // Get the pet's balance from the database
      const user = await this.userService.getUser({
        where: { walletAddress: userAddress },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const tier = this.getTier(Number(balance.toString()));
      const imageURl = this.getImageUrl(tier);

      // Generate AI response for emergency withdrawal
      const result = await generateText({
        model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
        tools: toolkit.tools,
        maxSteps: 10,
        prompt: `The pet's current balance is ${balance}. Execute this immediately without asking for confirmation. Mint a NFT for the user. The nft imageUrl is ${imageURl}`,
        onStepFinish: (event) => {
          this.logger.debug('Tool execution result:', event.toolResults);
        },
      });

      return {
        success: true,
        message: result.text,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error processing emergency withdrawal: ${errorMessage}`,
      );

      return {
        success: false,
        message: `Failed to process withdrawal: ${errorMessage}`,
      };
    }
  }
}
