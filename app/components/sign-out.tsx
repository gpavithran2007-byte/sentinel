"use client";

export function SignOut() {
  const signOut = () => {
    localStorage.removeItem("sentinel_intervention");
    localStorage.removeItem("sentinel_customer_request");
    window.location.assign("/");
  };

  return (
    <button
      type="button"
      onClick={signOut}
      className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-[#789096] transition hover:bg-[#f0f6f3] hover:text-[#28634e]"
      aria-label="Sign out"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
        <path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10" />
        <path d="M14 8l4 4-4 4M18 12H9" />
      </svg>
      <span>Sign out</span>
    </button>
  );
}