import { Button } from "@/components/ui/button";
import type { HomePageContentProps } from "@/types";

/**
 * HomePageContent Component
 *
 * Presentational component displaying the main home page content
 * Shows hero section with title, description, and dynamic CTA button
 * The CTA button changes based on user authentication and check-in status
 *
 * @param {HomePageContentProps} props - Component props
 * @param {CTAConfig} props.ctaConfig - Configuration for the CTA button (text, href, variant)
 */
export const HomePageContent = ({ ctaConfig }: HomePageContentProps) => {
  const handleCTAClick = () => {
    window.location.href = ctaConfig.href;
  };

  return (
    <main className='flex flex-col items-center justify-center min-h-[60vh] px-4 py-12'>
      <div className='max-w-3xl w-full space-y-12'>
        {/* Hero Section */}
        <section className='text-center space-y-6' aria-labelledby='hero-title'>
          {/* App Title */}
          <h1 id='hero-title' className='text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground'>
            Mimo
          </h1>

          {/* Value Proposition */}
          <p className='text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed'>
            Każdy dzień jest inny i to w porządku. Sprawdź jak się dziś czujesz, otrzymaj zadanie dopasowane do Twojego
            tempa i zobacz jak rośnie Twój ogród małych kroków.
          </p>
        </section>

        {/* CTA Button */}
        <div className='flex justify-center'>
          <Button
            onClick={handleCTAClick}
            variant={ctaConfig.variant || "default"}
            size='lg'
            className='text-lg px-8 py-6 min-w-[200px]'
            aria-label={`${ctaConfig.text} - przekierowanie do ${ctaConfig.href}`}>
            {ctaConfig.text}
          </Button>
        </div>

        {/* Feature Highlights - Optional visual enhancement */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 text-center'>
          <div className='space-y-2'>
            <div className='text-3xl' aria-hidden='true'>
              ✓
            </div>
            <p className='text-sm text-muted-foreground'>Dzienny check-in</p>
          </div>
          <div className='space-y-2'>
            <div className='text-3xl' aria-hidden='true'>
              🎯
            </div>
            <p className='text-sm text-muted-foreground'>Spersonalizowane zadania</p>
          </div>
          <div className='space-y-2'>
            <div className='text-3xl' aria-hidden='true'>
              🌱
            </div>
            <p className='text-sm text-muted-foreground'>Ogród postępów</p>
          </div>
        </div>
      </div>
    </main>
  );
};
