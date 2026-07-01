// JSON body middleware for the API pipeline (Phase 8 of docs/api-pipeline/).
//
// withBody wraps the existing readBody (server/http_util.ts) as an onion
// middleware: it parses ctx.req into ctx.body and hands the reject reasons
// readBody already distinguishes onto stable HttpError codes. It is JSON-only
// (a binary/card route uses withRawBody instead) and imposes no Content-Type
// check: enforcing application/json is Phase 21's job. Importable but
// UNMOUNTED here; Phase 9 places it in front of the JSON routes.

import { DEFAULT_JSON_BODY_MAX_BYTES, readBody } from '../../http_util';
import { HttpError } from '../errors';
import type { Middleware } from '../types';

/**
 * Parse the request body as JSON into ctx.body, then call next(). On overflow
 * throws HttpError(413, 'body.too_large', { maxBytes }); on malformed JSON
 * throws HttpError(400, 'json.malformed'). readBody already destroys the
 * stream on overflow and drains it on end, so the socket is left reusable;
 * this middleware does not re-drain.
 */
export function withBody(maxBytes?: number): Middleware {
  const cap = maxBytes ?? DEFAULT_JSON_BODY_MAX_BYTES;
  return async (ctx, next) => {
    try {
      ctx.body = await readBody(ctx.req, cap);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message === 'body too large') {
        throw new HttpError(413, 'body.too_large', { maxBytes: cap });
      }
      if (message === 'bad json') {
        throw new HttpError(400, 'json.malformed');
      }
      throw err;
    }
    await next();
  };
}
