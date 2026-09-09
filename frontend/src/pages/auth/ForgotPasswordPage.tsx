import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { forgotPassword } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await forgotPassword(email);
    } finally {
      // Always show the same success state regardless of outcome —
      // matches the backend's own design exactly: forgotPassword never
      // reveals whether an email exists, so the frontend shouldn't
      // either. A different message for "email not found" would
      // silently defeat the whole point of that backend protection.
      setIsLoading(false);
      setSubmitted(true);
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
          <p className="mt-1 text-sm text-paper/50">Reset your password</p>
        </div>

        {submitted ? (
          <div className="rounded border border-line bg-white/[0.02] p-4 text-center">
            <p className="text-sm text-paper/80">
              If an account exists for <span className="text-paper">{email}</span>, a reset code has
              been sent to it.
            </p>
            <Link to="/reset-password" className="mt-4 inline-block text-sm text-signal hover:underline">
              I have a code
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Send reset code
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-paper/50">
          <Link to="/login" className="text-signal hover:underline">
            Back to login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}