import { Module } from '@nestjs/common';
import { NfeService } from './nfe.service';
import { NfeController } from './nfe.controller';
import { AcbrWrapperService } from './acbr-wrapper.service';
import { MockNfeProvider } from './provider/nfe-mock.provider';
import { RealNfeProvider } from './provider/nfe-real.provider';
import { PartnersModule } from '../partners/partners.module';

import { AcbrConfigService } from './acbr-config.service';

@Module({
  imports: [PartnersModule],
  controllers: [NfeController],
  providers: [NfeService, AcbrWrapperService, MockNfeProvider, RealNfeProvider, AcbrConfigService],
  exports: [NfeService, AcbrWrapperService, AcbrConfigService]
})
export class NfeModule { }
