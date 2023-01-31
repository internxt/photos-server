import { randomBytes } from 'crypto';

export function getRandomString(size: number) {
  return randomBytes(size).toString('hex');
}
