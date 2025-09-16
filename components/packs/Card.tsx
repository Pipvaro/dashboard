// components/packs/Card.tsx
import React from "react";

type Props = {
  children?: React.ReactNode;
  className?: string;
};

export default function Card({ children, className }: Props) {
  return (
    <div
      className={[
        "bg-gray-800/50 border border-gray-700 shadow-md rounded-lg p-6 transition-all",
        "hover:bg-gray-800", // nur Styling
        className || "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
