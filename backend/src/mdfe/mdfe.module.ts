import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MdfeController } from './mdfe.controller';
import { MdfeService } from './mdfe.service';
import { MdfeWrapperService } from './mdfe-wrapper.service';
import { MockMdfeProvider } from './providers/mdfe-mock.provider';
import { RealMdfeProvider } from './providers/mdfe-real.provider';
import { PrismaModule } from '../prisma/prisma.module';
import { NfeModule } from '../nfe/nfe.module';

@Module({
  imports: [PrismaModule, ConfigModule, NfeModule],
  controllers: [MdfeController],
  providers: [
    MdfeService,
    MdfeWrapperService,
    MockMdfeProvider,
    RealMdfeProvider,
  ],
  exports: [MdfeService, MdfeWrapperService],
})
export class MdfeModule {}
