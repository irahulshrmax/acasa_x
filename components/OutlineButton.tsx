import Link from "next/link";
import { ReactNode } from "react";

interface OutlineButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export default function OutlineButton({ href, children, className = "" }: OutlineButtonProps) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-center border border-[#192334] text-[9.5px] font-bold uppercase tracking-[0.22em] text-[#192334] transition-all duration-300 hover:bg-[#192334] hover:text-white ${className}`}
      style={{
        width: "145px",
        height: "46px",
      }}
    >
      {children}
    </Link>
  );
}