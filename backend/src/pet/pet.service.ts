import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Pet } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import * as crypto from 'crypto';
import { AiAgentService } from 'src/ai-agent/ai-agent.service';

@Injectable()
export class PetService {
  private readonly logger = new Logger(PetService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => AiAgentService))
    private readonly aiAgentService: AiAgentService,
  ) {}

  async createPet(data: Prisma.PetCreateInput): Promise<Pet> {
    const pet = await this.prisma.pet.create({
      data,
    });

    await this.generateAndStoreKeypair(pet.id);
    return pet;
  }

  /**
   * Get or create a passphrase for encryption
   */
  private getOrCreatePassphrase(): string {
    const passphrase = process.env.ENCRYPTION_PASSPHRASE || 'pawmise';
    // if (!passphrase) {
    //   passphrase = crypto.randomBytes(32).toString('hex');
    //   this.logger.warn(
    //     'Generated new encryption passphrase. Please set ENCRYPTION_PASSPHRASE in your environment variables.',
    //   );
    // }
    return passphrase;
  }

  /**
   * Encrypt a private key
   */
  private encryptPrivateKey(privateKey: string): string {
    const passphrase = this.getOrCreatePassphrase();
    this.logger.debug('PASSPHRASE: ', passphrase);
    const key = crypto.createHash('sha256').update(passphrase).digest();
    this.logger.debug('KEY: ', key);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt a private key
   */
  private decryptPrivateKey(encryptedKey: string): string {
    const passphrase = this.getOrCreatePassphrase();
    const key = crypto.createHash('sha256').update(passphrase).digest();

    const parts = encryptedKey.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate and store a keypair for a pet
   */
  private async generateAndStoreKeypair(petId: string): Promise<string> {
    // Generate a new keypair
    const keypair = new Ed25519Keypair();
    const privateKey = keypair.getSecretKey();
    const walletAddress = keypair.getPublicKey().toSuiAddress();
    const encryptedKey = this.encryptPrivateKey(privateKey);

    // Store in database
    await this.prisma.pet.update({
      where: { id: petId },
      data: {
        privateKey: encryptedKey,
        walletAddress: walletAddress,
      },
    });

    return privateKey;
  }

  /**
   * Get a pet's private key, generating one if it doesn't exist
   */
  async getPetPrivateKey(petId: string): Promise<string> {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      select: { privateKey: true },
    });

    if (!pet) {
      throw new Error('Pet not found');
    }

    if (!pet.privateKey) {
      return this.generateAndStoreKeypair(petId);
    }

    return this.decryptPrivateKey(pet.privateKey);
  }

  /**
   * Get active pet for a specific user
   * Uses the unique constraint on [userId, active]
   */
  async getActivePetByUserId(userId: string): Promise<Pet | null> {
    this.logger.debug(`Finding active pet for user: ${userId}`);

    try {
      const pet = await this.prisma.pet.findFirst({
        where: {
          userId: userId,
          active: true,
        },
      });

      if (pet) {
        this.logger.debug(`Found active pet for user: ${userId}`);
      } else {
        this.logger.debug(`No active pet found for user: ${userId}`);
        return null;
      }

      if (!pet.walletAddress || !pet.privateKey) {
        await this.generateAndStoreKeypair(pet.id);
      }

      return pet;
    } catch (error) {
      this.logger.error(`Error finding active pet: ${error}`);
      throw error;
    }
  }

  /**
   * Get the most recent pet for a user regardless of active status
   * This is specifically for the app page to handle both active and inactive pets
   */
  async getPetByUserId(userId: string): Promise<Pet | null> {
    this.logger.debug(`Finding any pet for user: ${userId}`);

    try {
      const pet = await this.prisma.pet.findFirst({
        where: {
          userId: userId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      if (pet) {
        this.logger.debug(
          `Found pet for user: ${userId}, active status: ${pet.active}`,
        );
      } else {
        this.logger.debug(`No pet found for user: ${userId}`);
        return null;
      }

      if (!pet.walletAddress || !pet.privateKey) {
        await this.generateAndStoreKeypair(pet.id);
      }

      return pet;
    } catch (error) {
      this.logger.error(`Error finding pet: ${error}`);
      throw error;
    }
  }

  async getPet<T extends Prisma.PetInclude | undefined = undefined>(params: {
    where: Prisma.PetWhereUniqueInput;
    include?: T;
  }): Promise<Omit<Prisma.PetGetPayload<{ include: T }>, 'privateKey'> | null> {
    const { where, include } = params;
    this.logger.debug(`Finding user with criteria: ${JSON.stringify(where)}`);

    try {
      const pet = await this.prisma.pet.findUnique({
        where,
        select: {
          ...Object.keys(include || {}).reduce(
            (acc, key) => ({ ...acc, [key]: true }),
            {},
          ),
          id: true,
          walletAddress: true,
          balance: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          active: true,
          breed: true,
          userId: true,
          user: include?.user || false,
        },
      });

      if (pet) {
        this.logger.debug(`Found pet with address: ${where.walletAddress}`);
      } else {
        this.logger.debug(
          `No pet found for criteria: ${JSON.stringify(where)}`,
        );
      }

      return pet as Omit<
        Prisma.PetGetPayload<{ include: T }>,
        'privateKey'
      > | null;
    } catch (error) {
      this.logger.error(`Error finding pet: ${error}`);
      throw error;
    }
  }

  async updatePetBalance(petId: string, amount: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      include: { user: true },
    });

    if (!pet) throw new NotFoundException(`Pet with ${petId} not found`);

    this.logger.debug('Pet before balance: ', pet.balance);
    this.logger.debug('Amount: ', amount);

    const newAmount = BigInt(pet.balance) + BigInt(amount);
    this.logger.debug('New Amount: ', newAmount);
    await this.aiAgentService.upgradeOrMintNFT(
      pet.user.walletAddress,
      newAmount,
    );

    return await this.prisma.pet.update({
      where: { id: petId },
      data: {
        balance: newAmount.toString(),
      },
    });
  }

  async updatePetActive(petId: string, active: boolean): Promise<Pet> {
    const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
    if (!pet) throw new NotFoundException(`Pet with ID ${petId} not found`);

    this.logger.debug(`Setting pet ${petId} active status to ${active}`);
    return await this.prisma.pet.update({
      where: { id: petId },
      data: { active },
    });
  }
}
