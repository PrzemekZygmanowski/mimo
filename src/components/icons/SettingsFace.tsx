import type { IconProps } from "../../types";

export const SettingsFace = ({ className }: IconProps) => {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Gear/cog outer circle */}
      <circle cx="50" cy="50" r="30" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="2" />

      {/* Inner circle */}
      <circle cx="50" cy="50" r="15" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2" />

      {/* Gear teeth - 8 rectangular teeth around the circle */}
      <rect x="47" y="15" width="6" height="8" rx="1" fill="currentColor" />
      <rect x="68" y="25" width="8" height="6" rx="1" fill="currentColor" />
      <rect x="77" y="47" width="8" height="6" rx="1" fill="currentColor" />
      <rect x="68" y="69" width="8" height="6" rx="1" fill="currentColor" />
      <rect x="47" y="77" width="6" height="8" rx="1" fill="currentColor" />
      <rect x="24" y="69" width="8" height="6" rx="1" fill="currentColor" />
      <rect x="15" y="47" width="8" height="6" rx="1" fill="currentColor" />
      <rect x="24" y="25" width="8" height="6" rx="1" fill="currentColor" />
    </svg>
  );
};
