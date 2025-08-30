import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const LoginPage = () => {
  return (
    <div className="w-full flex flex-row h-screen max-h-screen">
      <div className="w-full md:w-1/2 flex items-center justify-center">
        <div className="grid w-full max-w-sm items-center gap-3">
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
            placeholder="Email"
          />
          <Label htmlFor="password" className="mt-2">
            Password
          </Label>
          <Input
            className="bg-gray-800/50 outline-0 ring-0 border-gray-700 text-[#d3d5f0]"
            type="password"
            id="password"
            placeholder="Password"
          />
          <Link
            className="text-[#3f4bf2] font-semibold text-sm text-end"
            href={""}
          >
            Forgot Password?
          </Link>
          <Button className="bg-[#3f4bf2] hover:bg-[#3f4bf2]/80 cursor-pointer mt-2">
            Sign in
          </Button>
        </div>
      </div>
      <div className="w-1/2 hidden md:block">
        <Image
          src={"/assets/login-image-4.png"}
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
