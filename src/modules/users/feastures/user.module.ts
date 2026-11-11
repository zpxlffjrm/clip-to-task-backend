import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/modules/prisma/prisma.module';
import { UserController } from 'src/modules/users/feastures/user.controller';
import { UserRepository } from 'src/modules/users/feastures/user.repository';
import { UserService } from 'src/modules/users/feastures/user.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
