import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import * as fs from 'fs';
import * as path from 'path';

// The auth cookie's name and attributes depend on NODE_ENV, and Nest reads some of
// them at module decoration time — so pin NODE_ENV and load .env before requiring
// AppModule (jest sets NODE_ENV=test by default).
process.env.NODE_ENV = 'production';

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      const value = match[2]
        .replace(/\s+#.*$/, '')
        .trim()
        .replace(/^["']|["']$/g, '');
      process.env[match[1]] = value;
    }
  }
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret';
}

// Deliberate runtime require: the env setup above must run before AppModule is
// evaluated, and a static import would be hoisted above it.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
const { AppModule } = require('./../src/app.module');

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 90000);

  afterAll(async () => {
    await app?.close();
  });

  it('GET /auth/logout expires the session cookie with the same attributes it was set with', async () => {
    const setRes = await request(app.getHttpServer())
      .get('/auth/test-cookie')
      .expect(200);
    const setCookie: string = setRes.headers['set-cookie'][0];

    const logoutRes = await request(app.getHttpServer())
      .get('/auth/logout')
      .expect(200);
    const clearCookie: string = logoutRes.headers['set-cookie'][0];

    // In production the session cookie is __Secure--prefixed and scoped to
    // .wynnpool.com, so a browser only deletes it when the deletion Set-Cookie
    // repeats Domain / Path / Secure exactly (the __Secure- prefix additionally
    // requires Secure on the deletion cookie itself).
    expect(setCookie).toContain('__Secure-wynnpool.session-token=');
    expect(clearCookie).toContain('__Secure-wynnpool.session-token=;');

    const attributes = (cookie: string) =>
      cookie
        .split(';')
        .slice(1)
        .map((attribute) => attribute.trim().toLowerCase());
    const clearAttrs = attributes(clearCookie);

    for (const required of [
      'domain=.wynnpool.com',
      'path=/',
      'httponly',
      'secure',
      'samesite=none',
    ]) {
      expect(clearAttrs).toContain(required);
    }
    expect(clearAttrs).toContain('expires=thu, 01 jan 1970 00:00:00 gmt');
  });
});
