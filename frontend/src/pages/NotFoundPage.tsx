import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 text-center">
      <p className="font-mono text-sm text-paper/40">404</p>
      <h1 className="mt-2 text-xl font-semibold text-paper">Page not found</h1>
      <p className="mt-2 text-sm text-paper/50">
        The page you're looking for doesn't exist or was moved.
      </p>
      <Link to="/dashboard" className="mt-6">
        <Button variant="secondary">Back to dashboard</Button>
      </Link>
    </div>
  );
}