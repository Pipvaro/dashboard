// app/(auth)/register/page.tsx
import RegisterForm from "./RegisterForm";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams; // <-- wichtig!
  const next = typeof sp?.next === "string" && sp.next ? sp.next : "/accounts";
  return <RegisterForm next={next} />;
}
