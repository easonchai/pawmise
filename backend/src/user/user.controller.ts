import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from './dto/userRequestDto';

@ApiTags('users')
@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Creates a new user' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.userService.getOrCreateUser(
      createUserDto.walletAddress,
      createUserDto.savingsGoal,
    );
  }

  @Get('/address/:address')
  @ApiOperation({ summary: 'Get user by wallet address' })
  async getUserByAddress(@Param('address') walletAddress: `0x${string}`) {
    return await this.userService.getUser({
      where: {
        walletAddress: walletAddress,
      },
    });
  }
}
