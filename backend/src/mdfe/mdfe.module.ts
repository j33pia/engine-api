import { Module } from '@nestjs/common';
import { MdfeController } from './mdfe.controller';
import { MdfeService } from './mdfe.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NfeModule } from '../nfe/nfe.module';

@Module({
  imports: [PrismaModule, NfeModule],
  controllers: [MdfeController],
  providers: [MdfeService],
  exports: [MdfeService],
})
export class MdfeModule {}
