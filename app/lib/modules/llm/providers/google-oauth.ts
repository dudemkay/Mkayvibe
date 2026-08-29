import { importPKCS8, SignJWT } from 'jose';

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_CLOUD_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

let cachedToken: { accessToken: string; expiresAt: number; cacheKey: string } | undefined;

export function normalizeGooglePrivateKey(privateKey: string): string {
  return privateKey.replace(/\\n/g, '\n');
}

export async function getGoogleCloudAccessToken(options: {
  accessToken?: string;
  clientEmail?: string;
  privateKey?: string;
}): Promise<string> {
  if (options.accessToken?.trim()) {
    return options.accessToken.trim();
  }

  const clientEmail = options.clientEmail?.trim();
  const privateKey = options.privateKey ? normalizeGooglePrivateKey(options.privateKey) : undefined;

  if (!clientEmail || !privateKey) {
    throw new Error(
      'Missing Google Vertex credentials. Set GOOGLE_VERTEX_ACCESS_TOKEN or GOOGLE_VERTEX_CLIENT_EMAIL and GOOGLE_VERTEX_PRIVATE_KEY.',
    );
  }

  const cacheKey = `${clientEmail}:${privateKey.slice(-48)}`;
  const now = Math.floor(Date.now() / 1000);

  if (cachedToken && cachedToken.cacheKey === cacheKey && cachedToken.expiresAt > now + 60) {
    return cachedToken.accessToken;
  }

  const signingKey = await importPKCS8(privateKey, 'RS256');
  const assertion = await new SignJWT({ scope: GOOGLE_CLOUD_SCOPE })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(clientEmail)
    .setAudience(GOOGLE_TOKEN_ENDPOINT)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(signingKey);

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google OAuth token exchange failed (${response.status}): ${errorBody}`);
  }

  const tokenResponse = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!tokenResponse.access_token) {
    throw new Error('Google OAuth token exchange did not return an access token');
  }

  cachedToken = {
    accessToken: tokenResponse.access_token,
    expiresAt: now + (tokenResponse.expires_in || 3600),
    cacheKey,
  };

  return tokenResponse.access_token;
}
