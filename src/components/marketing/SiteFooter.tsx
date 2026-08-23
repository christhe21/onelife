import { Link } from "@tanstack/react-router";
import { Github } from "lucide-react";
import { GITHUB_URL, APP_NAME, APP_TAGLINE } from "@/lib/site";
import { BrandMark } from "@/components/marketing/BrandMark";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <BrandMark />
            <span className="font-display text-base font-semibold">{APP_NAME}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{APP_TAGLINE}</p>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pages
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/" className="text-foreground hover:underline">
                Home
              </Link>
            </li>
            <li>
              <Link to="/how-it-works" className="text-foreground hover:underline">
                How it works
              </Link>
            </li>
            <li>
              <Link to="/features" className="text-foreground hover:underline">
                Features
              </Link>
            </li>
            <li>
              <Link to="/about" className="text-foreground hover:underline">
                About
              </Link>
            </li>
            <li>
              <Link
                to="/app"
                search={{ onboarding: undefined }}
                className="text-foreground hover:underline"
              >
                Open the app
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Project
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {GITHUB_URL && (
              <li>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 text-foreground hover:underline"
                >
                  <Github className="h-4 w-4" /> GitHub repository
                </a>
              </li>
            )}
            <li className="text-muted-foreground">Free to use — no cost, no catch.</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-5 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {APP_NAME}. Built for people who want their plans to happen.
      </div>
    </footer>
  );
}
