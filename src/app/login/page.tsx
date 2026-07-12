"use client";

import { useActionState, useState } from "react";
import { login, type AuthState } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoMark } from "@/components/brand/logo";
import { ArrowRight } from "lucide-react";

const DEMO_ACCOUNTS = [
  { email: "fleet@transitops.com", role: "Fleet Manager" },
  { email: "dispatch@transitops.com", role: "Dispatcher" },
  { email: "safety@transitops.com", role: "Safety Officer" },
  { email: "finance@transitops.com", role: "Financial Analyst" },
];

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(login, {});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="relative grid min-h-svh place-items-center overflow-hidden bg-background p-4">
      {/* precision backdrop */}
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.55]" />
      <div className="bg-signal-glow pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 40%, transparent, var(--background) 78%)",
        }}
      />

      <div className="relative w-full max-w-sm space-y-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <LogoMark className="size-11" />
          <div>
            <h1 className="text-xl font-semibold tracking-tighter">
              Transit<span className="text-primary">Ops</span>
            </h1>
            <p className="text-sm text-muted-foreground">Smart transport operations</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@transitops.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {state.error && <p className="text-sm text-destructive">{state.error}</p>}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Signing in…" : "Sign in"}
                {!pending && <ArrowRight className="size-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Demo accounts
              <span className="text-xs font-normal text-muted-foreground">
                Click to fill · password123
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-1">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => {
                  setEmail(a.email);
                  setPassword("password123");
                }}
                className="group flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent"
              >
                <code className="font-mono text-foreground">{a.email}</code>
                <span className="flex items-center gap-1 text-muted-foreground">
                  {a.role}
                  <ArrowRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
