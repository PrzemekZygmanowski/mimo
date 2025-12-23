import { CheckInProvider } from "../contexts/CheckInContext";
import CheckInPage from "./CheckInPage";

/**
 * Wrapper component that provides CheckInContext to CheckInPage
 * This is necessary because Astro hydrates each component with client:* directive
 * as a separate React island, so context can't be shared across separate islands.
 */
export default function CheckInPageWrapper() {
  return (
    <CheckInProvider>
      <CheckInPage />
    </CheckInProvider>
  );
}

