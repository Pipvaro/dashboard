"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

const LoginPage = () => {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") || "").trim();
    const password = String(f.get("password") || "");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d?.message ?? "Login failed.");
      setLoading(false);
      return;
    }

    router.push(next);
  }

  return (
    <div className="w-full flex flex-row h-screen max-h-screen">
      <div className="w-full md:w-1/2 flex items-center justify-center">
        {/* form wrapper added */}
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
            className="bg-gray-800/50 outline-0 ring-0 border-gray-700 text-[#d3d5f0]"
            type="email"
            id="email"
            name="email"
            placeholder="Email"
            required
          />

          <Label htmlFor="password" className="mt-2">
            Password
          </Label>
          <Input
            className="bg-gray-800/50 outline-0 ring-0 border-gray-700 text-[#d3d5f0]"
            type="password"
            id="password"
            name="password"
            placeholder="Password"
            required
          />

          <Link
            className="text-[#3f4bf2] font-semibold text-sm text-end"
            href=""
          >
            Forgot Password?
          </Link>

          {error && <p className="text-red-400 text-sm mt-1">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="bg-[#3f4bf2] hover:bg-[#3f4bf2]/80 cursor-pointer mt-2"
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
};

export default LoginPage;
