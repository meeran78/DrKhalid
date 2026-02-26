import { AuthPageClient } from "./AuthPageClient";

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;
  return <AuthPageClient path={path ?? "sign-in"} />;
}
