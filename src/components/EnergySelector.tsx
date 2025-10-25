import { FullBattery } from "./icons/FullBattery";
import { HalfBattery } from "./icons/HalfBattery";
import { LowBattery } from "./icons/LowBattery";

interface EnergyOption {
  value: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const energyOptions: EnergyOption[] = [
  { value: 1, label: "Niska energia", icon: LowBattery },
  { value: 2, label: "Średnia energia", icon: HalfBattery },
  { value: 3, label: "Wysoka energia", icon: FullBattery },
];

interface EnergySelectorProps {
  selected?: number;
  onChange: (value: number) => void;
  error?: string;
}

export function EnergySelector({ selected, onChange, error }: EnergySelectorProps) {
  return (
    <div className="space-y-3">
      <div
        role="radiogroup"
        aria-label="Wybierz poziom energii"
        aria-describedby={error ? "energy-error" : undefined}
        className="grid grid-cols-3 gap-3 sm:gap-4"
      >
        {energyOptions.map((option) => {
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
                p-3 sm:p-4 rounded-lg border-2
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
                  w-12 h-12 sm:w-14 sm:h-14 mb-1.5 sm:mb-2
                  transition-transform duration-200
                  ${isSelected ? "scale-110" : "group-hover:scale-110"}
                `}
              />
              <span className="text-xs sm:text-sm font-medium text-center leading-tight">{option.label}</span>
            </button>
          );
        })}
      </div>
      {error && (
        <p id="energy-error" className="text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
}
