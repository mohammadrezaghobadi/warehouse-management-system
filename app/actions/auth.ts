'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/prisma';
import { AUTH_COOKIE, createSession } from '@/lib/aut';

export interface LoginState {
  success: boolean;
  error?: string;
}

export async function login(
  _previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = String(
    formData.get('username') ?? ''
  ).trim();

  const password = String(
    formData.get('password') ?? ''
  );

  if (!username || !password) {
    return {
      success: false,
      error: 'نام کاربری و رمز عبور را وارد کنید.',
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (!user || !user.active) {
    return {
      success: false,
      error: 'نام کاربری یا رمز عبور اشتباه است.',
    };
  }

  const passwordValid = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordValid) {
    return {
      success: false,
      error: 'نام کاربری یا رمز عبور اشتباه است.',
    };
  }

  const token = await createSession({
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  });

  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect('/admin');
}

export async function logout() {
  const cookieStore = await cookies();

  cookieStore.delete(AUTH_COOKIE);

  redirect('/login');
}