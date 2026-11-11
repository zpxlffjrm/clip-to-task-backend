import { Controller, MessageEvent, Request, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AppService } from 'src/app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Sse()
  getHello(@Request() req: Request): Observable<MessageEvent> {
    console.log(req.headers);
    return this.appService.getHello();
  }
}
