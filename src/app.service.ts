import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, map, take, timer } from 'rxjs';

@Injectable()
export class AppService {
  getHello(): Observable<MessageEvent> {
    const message = '안녕하세요';

    return timer(0, 1000).pipe(
      take(message.length),
      map((index): MessageEvent => ({
        data: message[index],
      })),
    );
  }
}
