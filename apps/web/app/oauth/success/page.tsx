import { OAuthSuccessClient } from "./oauth-success-client";

interface OAuthSuccessPageProps {
  searchParams: Promise<{ token?: string | string[] }>;
}

export default async function OAuthSuccessPage({
  searchParams,
}: OAuthSuccessPageProps) {
  const params = await searchParams;
  const raw = params.token;
  const token = Array.isArray(raw) ? raw[0] : raw;

  return <OAuthSuccessClient token={token ?? null} />;
}
