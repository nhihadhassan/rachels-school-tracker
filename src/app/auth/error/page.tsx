type SearchParams = Promise<{ reason?: string }>;

const messages: Record<string, string> = {
  missing_code: "The sign-in link was incomplete. Try requesting a new one.",
  exchange_failed: "The sign-in link has expired or was already used. Request a new one.",
  not_authorized: "This email isn't on the workspace whitelist.",
};

export default async function AuthErrorPage({ searchParams }: { searchParams: SearchParams }) {
  const { reason } = await searchParams;
  const message = (reason && messages[reason]) || "Something went wrong signing you in.";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-xl font-semibold">Sign-in failed</h1>
        <p className="text-sm text-zinc-600">{message}</p>
        <a
          href="/login"
          className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Back to sign in
        </a>
      </div>
    </main>
  );
}
