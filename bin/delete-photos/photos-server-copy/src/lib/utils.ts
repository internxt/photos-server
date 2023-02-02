import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

export function dateToUTC(date: Date): Date {
  return dayjs.utc(date).toDate();
}
