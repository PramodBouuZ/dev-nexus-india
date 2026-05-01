import logos from "@/assets/startup-logos.png";

export function TrustedBy() {
  return (
    <section className="border-y border-border bg-background py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Trusted by growing companies
        </p>
        <div className="mt-8 overflow-hidden">
          <img
            src={logos}
            alt="A selection of fictional startup logos representing companies hiring on Developer Connect"
            className="mx-auto w-full max-w-5xl opacity-90 mix-blend-multiply dark:mix-blend-screen dark:invert"
            loading="lazy"
            width={1536}
            height={512}
          />
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Logos shown are illustrative.
        </p>
      </div>
    </section>
  );
}
