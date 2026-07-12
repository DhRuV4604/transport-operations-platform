"use client";

import { useActionState } from "react";
import { login, type AuthState } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck } from "lucide-react";

const DEMO_ACCOUNTS = [
  { email: "fleet@transitops.com", role: "Fleet Manager" },
  { email: "dispatch@transitops.com", role: "Dispatcher" },
  { email: "safety@transitops.com", role: "Safety Officer" },
  { email: "finance@transitops.com", role: "Financial Analyst" },
];

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(login, {});

  return (
    <div className="min-h-svh flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center justify-center gap-2 text-2xl font-bold">
          <Truck className="h-7 w-7" />
          TransitOps
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Smart Transport Operations Platform</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@transitops.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              {state.error && <p className="text-sm text-destructive">{state.error}</p>}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Demo accounts</CardTitle>
            <CardDescription className="text-xs">
              Password for all: <code className="font-mono">password123</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            {DEMO_ACCOUNTS.map((a) => (
              <div key={a.email} className="flex justify-between">
                <code className="font-mono">{a.email}</code>
                <span className="text-muted-foreground">{a.role}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
