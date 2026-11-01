import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-6xl font-extrabold text-gradient">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-600">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link to="/" className="btn-primary mt-6">Back to Home</Link>
    </div>
  );
}
