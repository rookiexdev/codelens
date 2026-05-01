"use client";

import {
  ChevronRight,
  Home,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  homeHref?: string;
  maxItems?: number;
  className?: string;
}

export function Breadcrumb({
  items,
  separator,
  homeHref,
  maxItems,
  className,
}: BreadcrumbProps): ReactNode {
  if (items.length === 0) return null;

  const sep = separator ?? (
    <ChevronRight
      aria-hidden
      className="h-3.5 w-3.5 shrink-0 text-fg-subtle"
      strokeWidth={2.25}
    />
  );

  const shouldCollapse =
    typeof maxItems === "number" &&
    maxItems >= 2 &&
    items.length > maxItems;

  const visibleItems: Array<BreadcrumbItem | "ellipsis"> = shouldCollapse
    ? [items[0]!, "ellipsis", items[items.length - 1]!]
    : items;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cx("text-xs sm:text-sm", className)}
    >
      <ol className="flex flex-wrap items-center gap-y-1.5">
        {homeHref ? (
          <li className="flex items-center">
            <Link
              href={homeHref}
              aria-label="Home"
              className="inline-flex items-center justify-center rounded-md p-1.5 text-fg-muted transition hover:bg-surface-2/70 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Home aria-hidden className="h-3.5 w-3.5" strokeWidth={2.25} />
            </Link>
          </li>
        ) : null}
        {visibleItems.map((entry, index) => {
          const showSeparator = index > 0 || Boolean(homeHref);
          const isLast = index === visibleItems.length - 1;

          return (
            <li
              key={entry === "ellipsis" ? `ellipsis-${index}` : `${entry.label}-${index}`}
              className="flex min-w-0 items-center"
            >
              {showSeparator ? (
                <span aria-hidden className="px-1 sm:px-1.5">
                  {sep}
                </span>
              ) : null}
              {entry === "ellipsis" ? (
                <span
                  aria-hidden
                  className="inline-flex items-center rounded-md p-1.5 text-fg-subtle"
                  title="Hidden levels"
                >
                  <MoreHorizontal
                    className="h-3.5 w-3.5"
                    strokeWidth={2.25}
                  />
                </span>
              ) : (
                <BreadcrumbCrumb item={entry} isLast={isLast} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function BreadcrumbCrumb({
  item,
  isLast,
}: {
  item: BreadcrumbItem;
  isLast: boolean;
}): ReactNode {
  const Icon = item.icon;
  const content = (
    <>
      {Icon ? (
        <Icon
          aria-hidden
          className="h-3.5 w-3.5 shrink-0"
          strokeWidth={2.25}
        />
      ) : null}
      <span className="truncate">{item.label}</span>
    </>
  );

  const baseClass =
    "inline-flex max-w-[10rem] items-center gap-1.5 truncate rounded-md px-2 py-1 sm:max-w-[16rem] lg:max-w-[20rem]";

  if (isLast || !item.href) {
    return (
      <span
        aria-current={isLast ? "page" : undefined}
        className={cx(baseClass, "font-semibold text-fg")}
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className={cx(
        baseClass,
        "font-medium text-fg-muted transition hover:bg-surface-2/70 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
      )}
    >
      {content}
    </Link>
  );
}

function cx(...classes: Array<string | undefined | false>): string {
  return classes.filter(Boolean).join(" ");
}
