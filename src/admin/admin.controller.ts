import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { AdminService } from './admin.service'
import { AdminGuard } from './guards/admin.guard'
import { ListUsersDto } from './dto/list-users.dto'

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboardStats() {
    return this.adminService.getDashboardStats()
  }

  @Get('skills')
  getDistinctSkills() {
    return this.adminService.getDistinctSkills()
  }

  @Get('resumes/:resumeId/url')
  getResumeDownloadUrl(@Param('resumeId') resumeId: string) {
    return this.adminService.getResumeDownloadUrl(resumeId)
  }

  @Get('users')
  listUsers(@Query() query: ListUsersDto) {
    return this.adminService.listUsers(query)
  }

  @Get('users/:id')
  getUserProfile(@Param('id') id: string) {
    return this.adminService.getUserProfile(id)
  }
}
