import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { verifyEmail } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await verifyEmail(token);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Invalid or expired code");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <h1 className="font-mono text-lg font-semibold text-paper">DevFlow</h1>
          <p className="mt-1 text-sm text-paper/50">Verify your email</p>
        </div>

        {success ? (
          <div className="rounded border border-done/20 bg-done-muted/10 p-4 text-center">
            <p className="text-sm text-paper/80">Your email has been verified.</p>
            <Button className="mt-4 w-full" onClick={() => navigate("/dashboard")}>
              Continue to dashboard
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-paper/50">
              We sent a verification code to your email when you registered. Paste it below.
            </p>
            <Input
              id="token"
              label="Verification code"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste the code from your email"
              required
            />

            {error && (
              <p className="rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Verify email
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-paper/50">
          <Link to="/dashboard" className="text-signal hover:underline">
            Skip for now
          </Link>
        </p>
      </motion.div>
    </div>
  );
}