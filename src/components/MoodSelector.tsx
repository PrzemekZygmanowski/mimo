import { CryingFace } from "./icons/CryingFace";
import { HappyFace } from "./icons/HappyFace";
import { NeutralFace } from "./icons/NeutralFace";
import { SadFace } from "./icons/SadFace";
import { SmileFace } from "./icons/SmileFace";

interface MoodOption {
  value: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const moodOptions: MoodOption[] = [
  { value: 1, label: "Bardzo źle", icon: CryingFace },
  { value: 2, label: "Źle", icon: SadFace },
  { value: 3, label: "Neutralnie", icon: NeutralFace },
  { value: 4, label: "Dobrze", icon: SmileFace },
  { value: 5, label: "Bardzo dobrze", icon: HappyFace },
];

interface MoodSelectorProps {
  selected?: number;
  onChange: (value: number) => void;
  error?: string;
}

export function MoodSelector({ selected, onChange, error }: MoodSelectorProps) {
  return (
    <div className="space-y-3">
      <div
        role="radiogroup"
        aria-label="Wybierz poziom nastroju"
        aria-describedby={error ? "mood-error" : undefined}
        className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3"
      >
        {moodOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${option.value} - ${option.label}`}
              onClick={() => onChange(option.value)}
              className={`
                group relative flex flex-col items-center justify-center
                p-2.5 sm:p-3 rounded-lg border-2
                transition-all duration-200 ease-in-out
                hover:scale-105 hover:shadow-md
                active:scale-95
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                ${
                  isSelected
                    ? "border-primary bg-accent text-primary shadow-sm scale-105"
                    : "border-input bg-background text-muted-foreground hover:border-primary/50 hover:bg-accent/50"
                }
              `}
            >
              <Icon
                className={`
                  w-10 h-10 sm:w-12 sm:h-12 mb-1.5 sm:mb-2
                  transition-transform duration-200
                  ${isSelected ? "scale-110" : "group-hover:scale-110"}
                `}
              />
              <span className="text-[10px] sm:text-xs font-medium text-center leading-tight">{option.label}</span>
            </button>
          );
        })}
      </div>
      {error && (
        <p id="mood-error" className="text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
}
