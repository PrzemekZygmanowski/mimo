import type { IconProps } from "../../types";

export const TreeFace = ({ className }: IconProps) => {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Tree trunk */}
      <rect x="42" y="65" width="16" height="15" fill="currentColor" opacity="0.3" />

      {/* Bottom tree layer */}
      <path d="M 50 60 L 30 70 L 70 70 Z" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="2" />

      {/* Middle tree layer */}
      <path d="M 50 45 L 32 60 L 68 60 Z" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="2" />

      {/* Top tree layer */}
      <path d="M 50 25 L 35 45 L 65 45 Z" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
};
