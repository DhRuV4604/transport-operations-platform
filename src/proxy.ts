import { NextResponse, type NextRequest } from "next/server";

// Coarse auth gate: redirects unauthenticated visitors to /login.
// Real session verification happens server-side in getSession().
export default function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("top_session");
  const { pathname } = request.nextUrl;

  if (!hasSession && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (hasSession && (pathname === "/login" || pathname === "/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (!hasSession && pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)).*)"],
};
