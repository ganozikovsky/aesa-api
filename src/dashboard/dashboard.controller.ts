import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Roles('ADMIN', 'OWNER')
  @Get('today')
  today() {
    return this.dashboard.today();
  }

  @Roles('ADMIN', 'OWNER')
  @Get('kpis')
  getKpis(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Default to today if no dates provided
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let start = today;
    let end = new Date(today);
    end.setHours(23, 59, 59, 999);

    // Parse provided dates if given
    if (startDate) {
      const parsed = new Date(startDate);
      if (!isNaN(parsed.getTime())) {
        start = parsed;
        start.setHours(0, 0, 0, 0);
      }
    }

    if (endDate) {
      const parsed = new Date(endDate);
      if (!isNaN(parsed.getTime())) {
        end = parsed;
        end.setHours(23, 59, 59, 999);
      }
    }

    return this.dashboard.getKpisByDateRange(start, end);
  }
}
