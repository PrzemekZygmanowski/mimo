import type { IconProps } from "../../types";

export const FullBattery = ({ className }: IconProps) => {
  return (
    <svg className={className} viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'>
      {/* Battery body */}
      <rect
        x='20'
        y='30'
        width='55'
        height='40'
        rx='4'
        fill='currentColor'
        opacity='0.1'
        stroke='currentColor'
        strokeWidth='2'
      />

      {/* Battery terminal */}
      <rect x='75' y='42' width='5' height='16' rx='2' fill='currentColor' />

      {/* Full charge indicator - 3 bars */}
      <rect x='27' y='37' width='12' height='26' rx='2' fill='currentColor' />
      <rect x='42' y='37' width='12' height='26' rx='2' fill='currentColor' />
      <rect x='57' y='37' width='12' height='26' rx='2' fill='currentColor' />
    </svg>
  );
};
