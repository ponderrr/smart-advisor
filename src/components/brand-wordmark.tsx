import { cn } from "@/lib/utils";

type BrandWordmarkProps = {
  className?: string;
  imageClassName?: string;
};

export function BrandWordmark({
  className,
  imageClassName,
}: BrandWordmarkProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap",
        className,
      )}
    >
      <img
        src="/svgs/smartadvisor/SmartAdvisor-LM.svg"
        alt="Smart Advisor"
        className={cn("h-10 w-auto shrink-0 dark:hidden", imageClassName)}
      />
      <img
        src="/svgs/smartadvisor/SmartAdvisor-DM.svg"
        alt="Smart Advisor"
        className={cn("hidden h-10 w-auto shrink-0 dark:block", imageClassName)}
      />
    </span>
  );
}
