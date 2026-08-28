import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { register } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function updateField(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const user = await register(form);
      setUser(user);
      navigate("/dashboard");
    } catch (err: any) {
      // Matches the real backend validation error shape from
      // validate.middleware.js — details is an array of { path, message }
      const details = err.response?.data?.details;
      const message = details?.length
        ? details.map((d: any) => d.message).join(", ")
        : err.response?.data?.message ?? "Something went wrong";
      setError(message);
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
          <p className="mt-1 text-sm text-paper/50">Create your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="firstName"
              label="First name"
              value={form.firstName}
              onChange={updateField("firstName")}
              required
            />
            <Input
              id="lastName"
              label="Last name"
              value={form.lastName}
              onChange={updateField("lastName")}
              required
            />
          </div>
          <Input
            id="email"
            type="email"
            label="Email"
            value={form.email}
            onChange={updateField("email")}
            required
          />
          <Input
            id="password"
            type="password"
            label="Password"
            value={form.password}
            onChange={updateField("password")}
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
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-paper/50">
          Already have an account?{" "}
          <Link to="/login" className="text-signal hover:underline">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}