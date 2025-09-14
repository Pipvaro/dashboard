"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const d = await r.json().catch(() => ({}));
    setLoading(false);
    if (!r.ok) return setErr(d?.message ?? "Login failed");
    router.push(next || "/accounts");
  }

  return (
    <div className="w-full flex flex-row h-screen max-h-screen">
      <div className="w-full md:w-1/2 flex items-center justify-center">
        <form
          onSubmit={onSubmit}
          className="grid w-full max-w-sm items-center gap-3"
        >
          <div className="w-full flex flex-col items-center">
            <Image
              src={"/assets/Transparent/logo-transparent-wide.png"}
              alt="logo"
              width={200}
              height={50}
            />
            <h1 className="text-3xl text-white font-semibold">
              Sign in to your account
            </h1>
            <p className="text-sm text-[#d3d5f0] mt-2">
              Not a member?{" "}
              <Link href={"/register"} className="text-[#3f4bf2]">
                Register now!
              </Link>
            </p>
          </div>

          <Label htmlFor="email" className="mt-8">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Email"
            className="bg-gray-800/50 outline-0 ring-0 border-gray-700 text-[#d3d5f0]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Label htmlFor="password" className="mt-2">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Password"
            className="bg-gray-800/50 outline-0 ring-0 border-gray-700 text-[#d3d5f0]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {err && <p className="text-sm text-red-400 mt-2">{err}</p>}

          <Link
            className="text-[#3f4bf2] font-semibold text-sm text-end"
            href=""
          >
            Forgot Password?
          </Link>

          <Button
            type="submit"
            className="bg-[#3f4bf2] hover:bg-[#3f4bf2]/80 cursor-pointer mt-2"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>

      <div className="w-1/2 hidden md:block">
        <Image
          src={"/assets/login-image-9.png"}
          alt="login-image"
          width={1908}
          height={1433}
          className="w-full h-screen object-cover"
        />
      </div>
    </div>
  );
}
