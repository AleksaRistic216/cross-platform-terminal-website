/**
 * Latest release metadata, fetched on the server and cached.
 *
 * This used to run in the browser on every visit. GitHub allows 60 unauthenticated calls per hour
 * per IP, so anyone behind a shared address — an office, a VPN, a university — could arrive at the
 * download page and be told the release info could not be fetched. Fetching once per revalidation
 * window from the server means one call for all visitors, and `GITHUB_TOKEN` lifts the limit
 * further if it is set.
 */

const REPO = "AleksaRistic216/ar-workspace-release";

export const RELEASES_URL = `https://github.com/${REPO}/releases`;
export const ISSUES_URL = `https://github.com/${REPO}/issues`;

/** Ten minutes: releases are rare, and a stale version string is worse than a slightly old one. */
export const RELEASE_REVALIDATE_SECONDS = 600;

export type ReleaseAsset = { name: string; url: string; size: number };

export type Release = {
  version: string;
  publishedAt: string | null;
  notesUrl: string;
  linuxAppImage: ReleaseAsset | null;
  linuxTarGz: ReleaseAsset | null;
  windows: ReleaseAsset | null;
};

type GitHubAsset = { name: string; browser_download_url: string; size: number };

function pick(assets: GitHubAsset[], matches: (name: string) => boolean): ReleaseAsset | null {
  const found = assets.find((a) => matches(a.name));
  return found ? { name: found.name, url: found.browser_download_url, size: found.size } : null;
}

export function formatSize(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
}

/** Returns null on any failure — the page falls back to a plain link to the releases index. */
export async function getLatestRelease(): Promise<Release | null> {
  const token = process.env.GITHUB_TOKEN;

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: RELEASE_REVALIDATE_SECONDS },
    });

    if (!res.ok) {
      console.error(`[release] GitHub returned ${res.status}`);
      return null;
    }

    const data = await res.json();
    const assets: GitHubAsset[] = data.assets ?? [];

    return {
      version: data.tag_name,
      publishedAt: data.published_at ?? null,
      notesUrl: data.html_url ?? RELEASES_URL,
      // The AppImage ships *inside* a tarball (cpt-vX-linux-x86_64-appimage.tar.gz), so matching
      // on `.AppImage` never hit — and because that tarball sorts first in the release, the plain
      // `.tar.gz` matcher claimed it, leaving the AppImage button dead and the tar.gz button
      // serving the AppImage build. Match on the name marker, and exclude it from the plain one.
      linuxAppImage: pick(assets, (n) => /appimage/i.test(n)),
      linuxTarGz: pick(assets, (n) => n.endsWith(".tar.gz") && !/appimage/i.test(n)),
      windows: pick(assets, (n) => n.endsWith(".zip")),
    };
  } catch (e) {
    console.error("[release] Fetch failed:", e);
    return null;
  }
}
