interface MessageBannerProps {
  message: string;
  type?: "motivational" | "neutral" | "warning";
}

export default function MessageBanner({ message, type = "neutral" }: MessageBannerProps) {
  const getStyles = () => {
    switch (type) {
      case "motivational":
        return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100";
      case "neutral":
      default:
        return "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100";
    }
  };

  return (
    <div className={`p-4 rounded-md border ${getStyles()}`} role="status" aria-live="polite">
      <p className="text-sm">{message}</p>
    </div>
  );
}
