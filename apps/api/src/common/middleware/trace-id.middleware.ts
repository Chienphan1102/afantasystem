import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(req: Request & { traceId?: string }, res: Response, next: NextFunction): void {
    const incoming = req.headers['x-trace-id'];
    const traceId = typeof incoming === 'string' && incoming.length > 0 ? incoming : uuidv4();
    req.traceId = traceId;
    res.setHeader('X-Trace-Id', traceId);
    next();
  }
}
