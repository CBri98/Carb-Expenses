import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import type { Request, Response } from 'express';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();
const backendOrigin = backendInternalOrigin();
const configuredLanHosts = new Set(
  (process.env['LAN_ALLOWED_HOSTS'] ?? '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean),
);

app.use(validateLanHost);

/**
 * Keep API calls on the same public origin as the Angular application. This
 * lets browsers on the LAN use the host they opened instead of a hardcoded
 * localhost, while the frontend container reaches NestJS over Docker DNS.
 */
app.use('/api', proxyApiRequest);

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = Number(process.env['PORT'] ?? 4000);
  app.listen(port, '0.0.0.0', (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://0.0.0.0:${port}`);
  });
}

function proxyApiRequest(request: Request, response: Response): void {
  const target = new URL(request.originalUrl, backendOrigin);
  const forwardedHeaders = {
    ...request.headers,
    host: target.host,
    'x-forwarded-for': request.ip,
    'x-forwarded-host': request.get('host') ?? '',
    'x-forwarded-proto': request.protocol,
  };

  const requestToBackend = backendOrigin.protocol === 'https:' ? httpsRequest : httpRequest;
  const upstream = requestToBackend(
    target,
    { method: request.method, headers: forwardedHeaders },
    (upstreamResponse) => {
      response.writeHead(
        upstreamResponse.statusCode ?? 502,
        upstreamResponse.statusMessage,
        upstreamResponse.headers,
      );
      upstreamResponse.pipe(response);
    },
  );

  upstream.on('error', () => {
    if (response.headersSent) {
      response.destroy();
      return;
    }
    response.status(502).json({
      statusCode: 502,
      message: 'Servizio API temporaneamente non disponibile',
    });
  });
  request.on('aborted', () => upstream.destroy());
  request.pipe(upstream);
}

function backendInternalOrigin(): URL {
  const value = process.env['BACKEND_INTERNAL_URL'] ?? 'http://localhost:3000';
  const origin = new URL(value);
  if (origin.protocol !== 'http:' && origin.protocol !== 'https:') {
    throw new Error('BACKEND_INTERNAL_URL deve usare il protocollo http o https');
  }
  return origin;
}

function validateLanHost(request: Request, response: Response, next: () => void): void {
  const hostHeader = request.get('host');
  if (!hostHeader) {
    response.status(400).send('Host non valido');
    return;
  }

  let hostname: string;
  try {
    hostname = new URL(`http://${hostHeader}`).hostname.replace(/^\[|\]$/g, '').toLowerCase();
  } catch {
    response.status(400).send('Host non valido');
    return;
  }

  if (!isAllowedLanHost(hostname)) {
    response.status(400).send('Host non consentito');
    return;
  }
  next();
}

function isAllowedLanHost(hostname: string): boolean {
  if (hostname === 'localhost' || configuredLanHosts.has(hostname)) return true;

  const ipVersion = isIP(hostname);
  if (ipVersion === 4) {
    const [first, second] = hostname.split('.').map(Number);
    return first === 127
      || first === 10
      || (first === 172 && second >= 16 && second <= 31)
      || (first === 192 && second === 168);
  }
  if (ipVersion === 6) {
    return hostname === '::1'
      || hostname.startsWith('fe80:')
      || hostname.startsWith('fc')
      || hostname.startsWith('fd');
  }
  return false;
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
