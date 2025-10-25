import type { IconProps } from "../../types";

export const CryingFace = ({ className }: IconProps) => {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Face circle */}
      <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="2" />

      {/* Left eye - closed/sad */}
      <path d="M 30 40 Q 35 38 40 40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Right eye - closed/sad */}
      <path d="M 60 40 Q 65 38 70 40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Sad frown */}
      <path d="M 30 68 Q 50 50 70 68" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Tear drop from left eye */}
      <ellipse cx="38" cy="52" rx="3" ry="5" fill="currentColor" opacity="0.6" />
    </svg>
  );
};
