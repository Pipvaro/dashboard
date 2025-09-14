"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

const RegisterPage = () => {
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
    const firstName = String(f.get("firstName") || "").trim();
    const lastName = String(f.get("lastName") || "").trim();
    const email = String(f.get("email") || "").trim();
    const password = String(f.get("password") || "");
    const confirm = String(f.get("confirm") || "");

    if (password !== confirm) {
      setLoading(false);
      setError("Passwords do not match.");
      return;
    }

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, password }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d?.message ?? "Registration failed.");
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
              Create a new account
            </h1>
            <p className="text-sm text-[#d3d5f0] mt-2">
              Already a member?{" "}
              <Link href={"/login"} className="text-[#3f4bf2]">
                Log in here!
              </Link>
            </p>
          </div>

          <div className="flex md:flex-row flex-col space-x-2">
            <div className="w-full md:w-1/2">
              <Label htmlFor="firstName" className="mt-8">
                First name
              </Label>
              <Input
                className="bg-gray-800/50 outline-0 ring-0 border-gray-700 text-[#d3d5f0] mt-2"
                type="text"
                id="firstName"
                name="firstName"
                placeholder="First name"
                required
              />
            </div>
            <div className="w-full md:w-1/2">
              <Label htmlFor="lastName" className="mt-4 md:mt-8">
                Last name
              </Label>
              <Input
                className="bg-gray-800/50 outline-0 ring-0 border-gray-700 text-[#d3d5f0] mt-2"
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Last name"
                required
              />
            </div>
          </div>

          <Label htmlFor="email" className="mt-2">
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
            minLength={8}
          />

          <Label htmlFor="confirm" className="mt-2">
            Confirm password
          </Label>
          <Input
            className="bg-gray-800/50 outline-0 ring-0 border-gray-700 text-[#d3d5f0]"
            type="password"
            id="confirm"
            name="confirm"
            placeholder="Confirm password"
            required
            minLength={8}
          />

          {error && <p className="text-red-400 text-sm mt-1">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="bg-[#3f4bf2] hover:bg-[#3f4bf2]/80 cursor-pointer mt-2"
          >
            {loading ? "Creating..." : "Create account"}
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

export default RegisterPage;
