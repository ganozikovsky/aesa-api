import { Controller, Get, Header, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Roles('ADMIN', 'OWNER')
  @Get('reports/daily')
  daily(@Query('date') date: string) {
    return this.reports.daily(date);
  }

  @Roles('ADMIN', 'OWNER')
  @Get('reports/range')
  range(@Query('from') from: string, @Query('to') to: string) {
    return this.reports.range(from, to);
  }

  @Roles('ADMIN', 'OWNER')
  @Get('export/csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="export.csv"')
  exportCsv(@Query('date') date: string) {
    return this.reports.exportCsvDaily(date);
  }
}
