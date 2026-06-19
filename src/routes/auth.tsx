import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

const searchSchema = z.object({
  mode: z.enum(["login", "register", "forgot", "reset"]).optional().default("login"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Sign in — ProductivityAI" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isForgot = mode === "forgot";
  const isReset = mode === "reset";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/dashboard" });
      } else if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/dashboard",
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created — you're signed in.");
        navigate({ to: "/dashboard" });
      } else if (isForgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/auth?mode=reset",
        });
        if (error) throw error;
        toast.success("Reset link sent. Check your inbox.");
      } else if (isReset) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success("Password updated. Signing you in…");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  const title = isLogin
    ? "Welcome back"
    : isRegister
    ? "Create your account"
    : isForgot
    ? "Reset your password"
    : "Set a new password";

  const subtitle = isLogin
    ? "Sign in to your AI workplace assistant"
    : isRegister
    ? "Start automating your workday in seconds"
    : isForgot
    ? "We'll email you a secure reset link"
    : "Choose a strong password";

  return (
    <div className="grid min-h-screen w-full md:grid-cols-2">
      {/* Visual side */}
      <div className="relative hidden md:flex flex-col justify-between overflow-hidden bg-gradient-brand p-10 text-white">
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 20% 20%, white, transparent 40%), radial-gradient(circle at 80% 80%, white, transparent 40%)" }} />
        <Link to="/" className="relative flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-semibold">ProductivityAI</span>
        </Link>
        <div className="relative space-y-4">
          <h2 className="text-3xl font-bold leading-tight">
            Your AI coworker for emails, meetings, planning and research.
          </h2>
          <p className="text-white/85">
            Built on structured prompts and responsible AI principles, so every result is ready for professional use after a quick review.
          </p>
        </div>
        <div className="relative text-xs text-white/70">
          ⚠️ AI responses are generated and should be reviewed before professional use.
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="md:hidden mb-6 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold">ProductivityAI</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {isRegister && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={120} />
              </div>
            )}
            {!isReset && (
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} autoComplete="email" />
              </div>
            )}
            {!isForgot && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {isLogin && (
                    <Link to="/auth" search={{ mode: "forgot" }} className="text-xs text-primary hover:underline">
                      Forgot?
                    </Link>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  maxLength={120}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-brand text-white shadow-glow hover:opacity-95"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "Sign in" : isRegister ? "Create account" : isForgot ? "Send reset link" : "Update password"}
            </Button>
          </form>

          <div className="mt-6 text-sm text-muted-foreground">
            {isLogin && (
              <>
                Don't have an account?{" "}
                <Link to="/auth" search={{ mode: "register" }} className="font-medium text-primary hover:underline">
                  Sign up
                </Link>
              </>
            )}
            {isRegister && (
              <>
                Already have an account?{" "}
                <Link to="/auth" search={{ mode: "login" }} className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </>
            )}
            {(isForgot || isReset) && (
              <Link to="/auth" search={{ mode: "login" }} className="font-medium text-primary hover:underline">
                Back to sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
