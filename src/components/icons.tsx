import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 22, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/** مقص */
export const ScissorsIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="6.5" cy="18" r="2.8" />
    <circle cx="17.5" cy="18" r="2.8" />
    <path d="M8.4 15.9 19.5 3.5M15.6 15.9 4.5 3.5" />
  </Icon>
);

/** بكرة خيط */
export const SpoolIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="5" y="3" width="14" height="3" rx="1" />
    <rect x="5" y="18" width="14" height="3" rx="1" />
    <path d="M7 6v12M17 6v12M7 9l10 2.2M7 12.5l10 2.2M7 16l10 1.5" />
  </Icon>
);

/** مانيكان */
export const MannequinIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 2.5v2.2" />
    <path d="M8.5 6.5c.8-.9 2-1.2 3.5-.2 1.5-1 2.7-.7 3.5.2.5 3.6-.3 6.6-3.5 9-3.2-2.4-4-5.4-3.5-9z" />
    <path d="M12 15.5v5M8.5 20.5h7" />
  </Icon>
);

/** فلوس */
export const CashIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="6.5" width="18" height="11" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6.5 12h.01M17.5 12h.01" />
  </Icon>
);

/** إبرة وخيط (للتسوية) */
export const NeedleIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M19.5 3.5 6 17" />
    <ellipse cx="17.6" cy="5.4" rx="0.9" ry="1.8" transform="rotate(45 17.6 5.4)" />
    <path d="M6 17c-2 .5-3 1.5-3 3.5 2 0 3-1 3.5-3" strokeDasharray="2 2" />
  </Icon>
);
