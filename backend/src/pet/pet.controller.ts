import {
  Controller,
  Get,
  Post,
  Param,
  NotFoundException,
  Body,
} from '@nestjs/common';
import { PetService } from './pet.service';
import { Prisma } from '@prisma/client';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('pet')
@Controller('pet')
export class PetController {
  constructor(private readonly petService: PetService) {}

  @Post()
  @ApiOperation({ summary: 'Creates a new pet' })
  async createPet(@Body() petData: Prisma.PetCreateInput) {
    return this.petService.createPet(petData);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pet by ID' })
  async getPetInfo(@Param('id') id: string) {
    const petInfo = await this.petService.getPet({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!petInfo) {
      throw new NotFoundException('Pet not found');
    }

    return petInfo;
  }

  @Get('active/user/:userId')
  @ApiOperation({ summary: 'Get active pet for a user' })
  async getActivePetByUserId(@Param('userId') userId: string) {
    const pet = await this.petService.getActivePetByUserId(userId);

    if (!pet) {
      throw new NotFoundException('Active pet not found for this user');
    }

    return pet;
  }
}
