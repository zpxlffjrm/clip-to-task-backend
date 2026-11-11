import { Test, TestingModule } from '@nestjs/testing';
import { firstValueFrom, take, toArray } from 'rxjs';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should stream Korean characters one by one via SSE', async () => {
      const events = await firstValueFrom(
        appController
          .getHello({ headers: {} } as unknown as Request)
          .pipe(take(5), toArray()),
      );

      expect(events.map((event) => event.data)).toEqual([
        '안',
        '녕',
        '하',
        '세',
        '요',
      ]);
    }, 10000);
  });
});
