"use client";
export default function Error({ error }: { error: Error }) {
  return (
    <div className="p-6 text-red-400">
      Failed to load receiver: {error.message}
    </div>
  );
}
