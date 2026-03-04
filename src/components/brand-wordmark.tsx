import { cn } from "@/lib/utils";

type BrandWordmarkProps = {
  className?: string;
  imageClassName?: string;
};

export function BrandWordmark({ className, imageClassName }: BrandWordmarkProps) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <img
        src="/SmartAdvisor-LM.svg"
        alt="Smart Advisor"
        className={cn("h-8 w-auto dark:hidden", imageClassName)}
      />
      <img
        src="/SmartAdvisor-DM.svg"
        alt="Smart Advisor"
        className={cn("hidden h-8 w-auto dark:block", imageClassName)}
      />
    </span>
  );
}
