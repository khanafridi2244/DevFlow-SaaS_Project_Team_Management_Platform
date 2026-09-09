import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { resetPassword } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await resetPassword(token, newPassword);
      navigate("/login");
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
          <p className="mt-1 text-sm text-paper/50">Enter your reset code</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="token"
            label="Reset code"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste the code from your email"
            required
          />
          <Input
            id="newPassword"
            type="password"
            label="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <p className="text-xs text-paper/40">
            At least 8 characters, with an uppercase letter, lowercase letter, and number.
          </p>

          {error && (
            <p className="rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Reset password
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-paper/50">
          <Link to="/login" className="text-signal hover:underline">
            Back to login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}