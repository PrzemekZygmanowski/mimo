import type { IconProps } from "../../types";

export const TaskFace = ({ className }: IconProps) => {
  return (
    <svg className={className} viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'>
      {/* Document/paper background */}
      <rect
        x='25'
        y='20'
        width='50'
        height='60'
        rx='4'
        fill='currentColor'
        opacity='0.1'
        stroke='currentColor'
        strokeWidth='2'
      />

      {/* Checkbox 1 - checked */}
      <rect x='32' y='32' width='10' height='10' rx='2' stroke='currentColor' strokeWidth='2' fill='none' />
      <path
        d='M 34 37 L 37 40 L 40 34'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />

      {/* Task line 1 */}
      <line x1='46' y1='37' x2='65' y2='37' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />

      {/* Checkbox 2 - unchecked */}
      <rect x='32' y='50' width='10' height='10' rx='2' stroke='currentColor' strokeWidth='2' fill='none' />

      {/* Task line 2 */}
      <line x1='46' y1='55' x2='65' y2='55' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />

      {/* Checkbox 3 - unchecked */}
      <rect x='32' y='68' width='10' height='10' rx='2' stroke='currentColor' strokeWidth='2' fill='none' />

      {/* Task line 3 */}
      <line x1='46' y1='73' x2='65' y2='73' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
    </svg>
  );
};
