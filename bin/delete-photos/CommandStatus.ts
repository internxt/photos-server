import { PhotoId } from '../../src/models/Photo';
import { DeleteFilesResponse } from './PhotoDeleter';
import { createTimer } from './utils/timer';

export class CommandStatus {
  private timer = createTimer();
  private interval: NodeJS.Timer | undefined;

  public totalFilesRemoved: number;
  public totalRequests: number;
  public failedRequests: number;

  constructor() {
    this.totalFilesRemoved = 0;
    this.totalRequests = 0;
    this.failedRequests = 0;
  }

  public init() {
    this.timer.start();
    this.logIntervalId();
  }

  private logIntervalId() {
    this.interval = setInterval(() => {
      console.log(
        'DELETION RATE: %s/s | FAILURE RATE %s%',
        this.totalFilesRemoved / (this.timer.end() / 1000),
        (this.failedRequests / this.totalRequests) * 100,
      );
    }, 10000);
  }

  public clear() {
    if (!this.interval) return;
    
    clearInterval(this.interval);

    console.log(
      'TOTAL FILES REMOVED %s | DURATION %ss',
      this.totalFilesRemoved,
      (this.timer.end() / 1000).toFixed(2),
    );
  }

  public updateRequest(results: PromiseSettledResult<DeleteFilesResponse>[]) {
    this.totalRequests += results.length;
    this.failedRequests += results.filter((r) => r.status === 'rejected').length;
  }

  public updatePhotosRemoved(photosRemoved: Array<PhotoId>) {
    this.totalFilesRemoved += photosRemoved.length;
  }
}
