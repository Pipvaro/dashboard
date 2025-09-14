// app/(auth)/login/page.tsx
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = typeof sp?.next === "string" && sp.next ? sp.next : "/accounts";
  return <LoginForm next={next} />;
}
