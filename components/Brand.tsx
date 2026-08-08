import logoWhite from "@/public/logo-white.png";
import logoNavy from "@/public/logo-navy.png";

export function InstagramIcon({
  size = 18,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke={color}
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="1.8" />
      <circle cx="17.5" cy="6.5" r="1.2" fill={color} />
    </svg>
  );
}

// Logo real de SFG. Blanco sobre superficies navy, navy sobre superficies cream.
// El PNG ya incluye el wordmark (globe + "SIN FRONTERAS GLOBAL") — no lo repetimos.
export function BrandStrip({
  variant = "on-navy",
}: {
  variant?: "on-navy" | "on-cream";
}) {
  const src = variant === "on-navy" ? logoWhite.src : logoNavy.src;
  const iconColor = variant === "on-navy" ? "var(--cream)" : "var(--navy)";
  return (
    <div className={`brand-strip brand-strip--${variant}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Sin Fronteras Global"
        className="brand-strip__logo"
      />
      <a
        className="brand-strip__ig"
        href="https://instagram.com/sinfronterasglobal"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram @sinfronterasglobal"
      >
        <InstagramIcon size={16} color={iconColor} />
        <span>@sinfronterasglobal</span>
      </a>
    </div>
  );
}
