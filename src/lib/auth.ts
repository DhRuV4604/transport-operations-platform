import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, Permission } from "@/lib/constants";
import { hasPermission } from "@/lib/constants";

const COOKIE_NAME = "top_session";
const SESSION_HOURS = 8;

export type Session = {
  userId: string;
  role: Role;
  name: string;
  email: string;
};

function secret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET!);
}

export async function createSession(user: {
  id: string;
  role: string;
  name: string;
  email: string;
}) {
  const token = await new SignJWT({
    role: user.role,
    name: user.name,
    email: user.email,
  })
    .setSubject(user.id)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_HOURS * 60 * 60,
    path: "/",
  });
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      userId: payload.sub as string,
      role: payload.role as Role,
      name: payload.name as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requirePermission(permission: Permission): Promise<Session> {
  const session = await requireSession();
  if (!hasPermission(session.role, permission)) {
    throw new Error("You do not have permission to perform this action.");
  }
  return session;
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
