import type { IconProps } from "../../types";

export const HappyFace = ({ className }: IconProps) => {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Face circle */}
      <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="2" />

      {/* Left eye */}
      <circle cx="35" cy="40" r="5" fill="currentColor" />

      {/* Right eye */}
      <circle cx="65" cy="40" r="5" fill="currentColor" />

      {/* Big smile */}
      <path d="M 30 55 Q 50 75 70 55" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
};
