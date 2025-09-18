import Image from "next/image";

export default function Loading() {
  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="animate-pulse">
        <Image
          src="/assets/Transparent/logo-beta.svg"
          alt="Loading..."
          width={180}
          height={180}
        />
      </div>
    </div>
  );
}
