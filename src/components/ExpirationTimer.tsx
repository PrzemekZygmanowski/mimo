import { useEffect, useState } from "react";

interface ExpirationTimerProps {
  expirationTime: Date;
  onExpire?: () => void;
}

export default function ExpirationTimer({ expirationTime, onExpire }: ExpirationTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const expireTime = expirationTime.getTime();
      const diff = expireTime - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining("Wygasło");
        if (onExpire) {
          onExpire();
        }
        return;
      }

      // Calculate time components
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Format the time string
      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expirationTime, onExpire]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Pozostały czas:</span>
      <time
        dateTime={expirationTime.toISOString()}
        className={`text-sm font-semibold ${isExpired ? "text-destructive" : "text-foreground"}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {timeRemaining}
      </time>
    </div>
  );
}
