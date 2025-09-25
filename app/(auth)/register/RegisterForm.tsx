"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "../../../public/assets/Transparent/logo-beta.svg";
import loginImage9 from "../../../public/assets/login-image-9.png";

function Spinner({ label }: { label?: string }) {
  return (
    <div className="mt-8 flex items-center gap-3 text-[#d3d5f0]">
      <span
        aria-label="Loading"
        className="inline-block h-5 w-5 rounded-full border-2 border-indigo-400/60 border-t-transparent animate-spin"
      />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}


export default function RegisterForm({ next }: { next: string }) {
  const router = useRouter();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 👇 NEU: Flag aus SiteSettings
  const [regOpen, setRegOpen] = useState<boolean | null>(null);

useEffect(() => {
  let mounted = true;
  (async () => {
    try {
      const r = await fetch("/api/site-settings", { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      if (!mounted) return;

      // ✅ read from d.item.allowRegistration
      const allow =
        typeof d?.item?.allowRegistration === "boolean"
          ? d.item.allowRegistration
          : true; // safe default

      setRegOpen(allow);
    } catch {
      if (!mounted) return;
      setRegOpen(true); // fail-open
    }
  })();
  return () => {
    mounted = false;
  };
}, []);


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    // 👇 Wenn deaktiviert, früh abbrechen (sollte wegen UI nie passieren, ist aber sicherer)
    if (regOpen === false) {
      setErr("Registrations are currently disabled.");
      return;
    }

    if (pw !== pw2) {
      setErr("Passwords do not match");
      return;
    }
    setLoading(true);

    const payload = {
      first_name: first.trim(),
      last_name: last.trim(),
      email: email.trim(),
      password: pw,
    };

    const r = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const d = await r.json().catch(() => ({}));
    setLoading(false);

    if (!r.ok) {
      setErr(d?.message ?? "Registration failed");
      return;
    }
    router.push(next || "/accounts");
  }

  // 👇 Loading-State: Settings werden geladen
  if (regOpen === null) {
    return (
      <div className="w-full flex flex-row h-screen max-h-screen">
        <div className="w-full md:w-1/2 flex items-center justify-center">
          <div className="grid w-full max-w-sm items-center gap-3">
            <div className="w-full flex flex-col items-center">
              <Image src={logo} alt="logo" width={200} height={50} />
              <Spinner label="Loading..." />
            </div>
          </div>
        </div>
        <div className="w-1/2 hidden md:block">
          <Image
            src={loginImage9}
            alt="login-image"
            width={1908}
            height={1433}
            className="w-full h-screen object-cover"
          />
        </div>
      </div>
    );
  }

  // 👇 Registrierungen deaktiviert: Nur Hinweis, KEINE Felder
  if (regOpen === false) {
    return (
      <div className="w-full flex flex-row h-screen max-h-screen">
        <div className="w-full md:w-1/2 flex items-center justify-center">
          <div className="grid w-full max-w-sm items-center gap-3 text-center">
            <div className="w-full flex flex-col items-center">
              <Image src={logo} alt="logo" width={200} height={50} />
              <h1 className="text-3xl text-white font-semibold mt-2">
                Registrations are currently disabled
              </h1>
              <p className="text-sm text-[#d3d5f0] mt-4">
                New accounts cannot be created at the moment. Please check back
                later or{" "}
                <Link href="/login" className="text-[#3f4bf2]">
                  log in here
                </Link>{" "}
                if you already have an account.
              </p>
            </div>
          </div>
        </div>
        <div className="w-1/2 hidden md:block">
          <Image
            src={loginImage9}
            alt="login-image"
            width={1908}
            height={1433}
            className="w-full h-screen object-cover"
          />
        </div>
      </div>
    );
  }

  // 👇 Default: Formular anzeigen
  return (
    <div className="w-full flex flex-row h-screen max-h-screen">
      <div className="w-full md:w-1/2 flex items-center justify-center">
        <form onSubmit={onSubmit} className="grid w-full max-w-sm items-center gap-3">
          <div className="w-full flex flex-col items-center">
            <Image src={logo} alt="logo" width={200} height={50} />
            <h1 className="text-3xl text-white font-semibold">Create a new account</h1>
            <p className="text-sm text-[#d3d5f0] mt-2">
              Already a member?{" "}
              <Link href={"/login"} className="text-[#3f4bf2]">
                Log in here!
              </Link>
            </p>
          </div>

          <div className="flex md:flex-row flex-col space-x-0 md:space-x-2">
            <div className="w-full md:w-1/2">
              <Label htmlFor="fname" className="mt-8">
                First name
              </Label>
              <Input
                id="fname"
                type="text"
                placeholder="First name"
                className="bg-gray-800/50 outline-0 ring-0 border-gray-700 text-[#d3d5f0] mt-2"
                value={first}
                onChange={(e) => setFirst(e.target.value)}
              />
            </div>
            <div className="w-full md:w-1/2">
              <Label htmlFor="lname" className="mt-4 md:mt-8">
                Last name
              </Label>
              <Input
                id="lname"
                type="text"
                placeholder="Last name"
                className="bg-gray-800/50 outline-0 ring-0 border-gray-700 text-[#d3d5f0] mt-2"
                value={last}
                onChange={(e) => setLast(e.target.value)}
              />
            </div>
          </div>

          <Label htmlFor="email" className="mt-2">
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
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />

          <Label htmlFor="password2" className="mt-2">
            Confirm password
          </Label>
          <Input
            id="password2"
            type="password"
            placeholder="Confirm password"
            className="bg-gray-800/50 outline-0 ring-0 border-gray-700 text-[#d3d5f0]"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
          />

          {err && <p className="text-sm text-red-400 mt-2">{err}</p>}

          <Button
            type="submit"
            className="bg-[#3f4bf2] hover:bg-[#3f4bf2]/80 cursor-pointer mt-2"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create account"}
          </Button>
        </form>
      </div>

      <div className="w-1/2 hidden md:block">
        <Image
          src={loginImage9}
          alt="login-image"
          width={1908}
          height={1433}
          className="w-full h-screen object-cover"
        />
      </div>
    </div>
  );
}
