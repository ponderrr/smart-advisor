import { Card, CardDescription, CardTitle } from "@/components/cards-demo-3";

export default function FeaturesSectionDemo() {
  const cardClassName =
    "!max-w-none !rounded-3xl !border-slate-200/80 !bg-white/80 !p-6 !shadow-sm !backdrop-blur-md dark:!border-slate-700/70 dark:!bg-slate-900/65";

  return (
    <section
      id="why-smart-advisor"
      className="scroll-mt-32 px-6 py-20 md:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center md:mb-12">
          <h2 className="mx-auto max-w-5xl text-4xl font-black tracking-tighter text-slate-900 dark:text-slate-100 md:text-5xl">
            Why Use Smart Advisor
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 md:text-base dark:text-slate-300">
            Private by design, fast by default, and open source so you can see
            how it works.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* 1. Private Profile */}
          <Card className={cardClassName}>
            <div className="mt-5 h-[10rem] flex items-center justify-center">
              <video
                src="/animations/security-status-safe.webm"
                autoPlay
                loop
                muted
                className="h-full w-auto max-w-[180px]"
              />
            </div>
            <CardTitle>Private Profile</CardTitle>
            <CardDescription>
              Your preferences stay tied to your account and are used to improve
              your picks.
            </CardDescription>
          </Card>

          {/* 2. Warp Speed */}
          <Card className={cardClassName}>
            <div className="mt-5 h-[10rem] flex items-center justify-center">
              <video
                src="/animations/time-animation.webm"
                autoPlay
                loop
                muted
                className="h-full w-auto max-w-[180px]"
              />
            </div>
            <CardTitle>Warp Speed Results</CardTitle>
            <CardDescription>
              Quick results and smooth updates help you decide without waiting
              around.
            </CardDescription>
          </Card>

          {/* 3. Easy Trust */}
          <Card className={cardClassName}>
            <div className="mt-5 h-[10rem] flex items-center justify-center">
              <video
                src="/animations/error-animation.webm"
                autoPlay
                loop
                muted
                className="h-full w-auto max-w-[180px]"
              />
            </div>
            <CardTitle>Easy-To-Trust Picks</CardTitle>
            <CardDescription>
              Clear reasons make each suggestion easier to trust and choose,
              with open-source transparency.
            </CardDescription>
          </Card>

          {/* 4. Choose Both */}
          <Card className={cardClassName}>
            <div className="mt-5 h-[10rem] flex items-center justify-center">
              <video
                src="/animations/Popcorn.webm"
                autoPlay
                loop
                muted
                className="h-full w-auto max-w-[280px]"
              />
            </div>
            <CardTitle>Choose Across Both</CardTitle>
            <CardDescription>
              See book and movie results in one place so choosing feels faster
              and easier.
            </CardDescription>
          </Card>
        </div>
      </div>
    </section>
  );
}
