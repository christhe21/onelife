import { Link } from "@tanstack/react-router";
import { ArrowRight, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GITHUB_URL } from "@/lib/site";
import { Reveal } from "./Reveal";

export function CTABand() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-20">
      <Reveal from="scale">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/12 via-card to-accent/20 px-6 py-14 text-center shadow-sm">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Free to try. No cost, no catch.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
            Set up your first skill, goal and milestone in a couple of minutes — everything else
            grows from there.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full px-7">
              <Link to="/app" search={{ onboarding: 1 }}>
                Start free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {GITHUB_URL && (
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-7">
                <a href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
                  <Github className="mr-2 h-4 w-4" /> View source
                </a>
              </Button>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
