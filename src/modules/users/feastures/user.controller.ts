import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/features/jwt-auth.guard';
import { UpdateUserDeviceTokenDto } from 'src/modules/users/dtos/req/UpdateUserDeviceToken.dto';
import { UserService } from 'src/modules/users/feastures/user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.userService.getUser(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/device-token')
  async updateUserDeviceToken(
    @Param('id') id: string,
    @Body() dto: UpdateUserDeviceTokenDto,
  ) {
    console.log(dto);
    return this.userService.updateUserDeviceToken(dto);
  }
}
