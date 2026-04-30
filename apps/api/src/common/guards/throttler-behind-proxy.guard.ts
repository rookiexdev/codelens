import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

interface RequestShape {
  ip?: string;
  ips?: string[];
  body?: { email?: unknown };
}

@Injectable()
export class CompositeThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const r = req as RequestShape;
    const ip = r.ips?.[0] ?? r.ip ?? 'unknown';
    const email =
      typeof r.body?.email === 'string' ? r.body.email.toLowerCase() : null;
    return Promise.resolve(email ? `${ip}:${email}` : ip);
  }
}
