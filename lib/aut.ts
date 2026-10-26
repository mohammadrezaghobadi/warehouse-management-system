import { jwtVerify, SignJWT } from 'jose';

export const AUTH_COOKIE = 'warehouse_session';

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error(
      'AUTH_SECRET is not configured in .env'
    );
  }

  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: number;
  username: string;
  name: string;
  role: string;
}

export async function createSession(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    username: payload.username,
    name: payload.name,
    role: payload.role,
  })
    .setProtectedHeader({
      alg: 'HS256',
    })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(
      token,
      getSecretKey(),
      {
        algorithms: ['HS256'],
      }
    );

    const userId =
      typeof payload.userId === 'number'
        ? payload.userId
        : typeof payload.userId === 'string'
          ? Number(payload.userId)
          : NaN;

    if (
      !Number.isInteger(userId) ||
      typeof payload.username !== 'string' ||
      typeof payload.name !== 'string' ||
      typeof payload.role !== 'string'
    ) {
      return null;
    }

    return {
      userId,
      username: payload.username,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}