"use client";

export function LegalPolicyLink({
  onOpen,
  children,
}: {
  onOpen: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onOpen();
      }}
      className="text-brand font-medium hover:underline underline-offset-2"
    >
      {children}
    </button>
  );
}
