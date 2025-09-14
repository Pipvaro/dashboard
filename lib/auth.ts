import { cookies } from "next/headers";

export async function getAccessToken() {
  const c = (await cookies()).get("access_token")?.value;
  return c ?? null;
}
