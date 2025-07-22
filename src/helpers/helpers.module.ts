import { Module } from '@nestjs/common';
import { ZipHelper } from './zip.helper';

@Module({
  providers: [ZipHelper],
  exports: [ZipHelper],
})
export class HelpersModule {} 