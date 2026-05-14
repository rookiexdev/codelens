"use client";

import { Check } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import {
  BitbucketLogo,
  GitHubLogo,
  GitLabLogo,
} from "@/components/oauth/provider-icons";
import {
  getProviderInitiationUrl,
  type OAuthProvider,
} from "@/lib/oauth-api";

interface ProviderTile {
  id: OAuthProvider;
  name: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  accent: string;
}

const TILES: ProviderTile[] = [
  { id: "github", name: "GitHub", Icon: GitHubLogo, accent: "#24292e" },
  { id: "gitlab", name: "GitLab", Icon: GitLabLogo, accent: "#FC6D26" },
  { id: "bitbucket", name: "Bitbucket", Icon: BitbucketLogo, accent: "#0052CC" },
];

interface ProviderButtonsProps {
  connected: ReadonlySet<OAuthProvider>;
  onConnectedClick?: () => void;
}

export function ProviderButtons({
  connected,
  onConnectedClick,
}: ProviderButtonsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      {TILES.map((tile) => {
        const isConnected = connected.has(tile.id);
        return (
          <ProviderTileButton
            key={tile.id}
            tile={tile}
            connected={isConnected}
            onClick={() => {
              if (isConnected) {
                onConnectedClick?.();
              } else {
                window.location.assign(getProviderInitiationUrl(tile.id));
              }
            }}
          />
        );
      })}
    </div>
  );
}

interface ProviderTileButtonProps {
  tile: ProviderTile;
  connected: boolean;
  onClick: () => void;
}

function ProviderTileButton({
  tile,
  connected,
  onClick,
}: ProviderTileButtonProps) {
  const { Icon, name, accent } = tile;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={connected ? `${name} connected` : `Connect ${name}`}
      className="group relative flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-border bg-surface/60 px-5 py-6 text-center transition hover:border-fg-subtle hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:py-8"
    >
      {connected ? (
        <span
          aria-hidden
          className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-emerald-400 ring-1 ring-emerald-500/30"
        >
          <Check className="h-3 w-3" strokeWidth={3} />
          Connected
        </span>
      ) : null}

      <span
        aria-hidden
        className="inline-flex h-12 w-12 items-center justify-center rounded-xl ring-1 ring-border"
        style={{ backgroundColor: `${accent}1A`, color: accent }}
      >
        <Icon className="h-6 w-6" />
      </span>

      <div className="space-y-0.5">
        <p className="text-sm font-bold tracking-tight text-fg sm:text-base">
          {name}
        </p>
        <p className="text-xs font-medium text-fg-muted">
          {connected ? "Pick a repo below" : "Connect to import repos"}
        </p>
      </div>
    </button>
  );
}
