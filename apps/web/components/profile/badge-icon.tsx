/* eslint-disable @next/next/no-img-element */
interface BadgeIconProps {
  /**
   * Stable badge slug. Resolves to `/badges/icons/<slug>.svg` served
   * directly from `apps/web/public/badges/icons/`. Adding a new badge
   * means adding a matching SVG file at that path.
   */
  slug: string;
  /** Tailwind size classes — e.g. `h-7 w-7`. */
  className?: string;
}

export function BadgeIcon({
  slug,
  className,
}: BadgeIconProps): React.JSX.Element {
  return (
    <img
      src={`/badges/icons/${slug}.svg`}
      alt="Badge"
      aria-hidden
      className={className}
      draggable={false}
    />
  );
}
