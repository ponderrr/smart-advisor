"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { IconArrowRight, IconUsers } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

const GroupQuizCta = () => {
  const t = useTranslations("Home");

  return (
    <section
      id="group-quiz-cta"
      className="scroll-mt-32 px-4 py-16 sm:px-6 sm:py-20 md:py-24"
    >
      <motion.div
        style={{ opacity: 0, transform: "translateY(24px)" }}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-6xl"
      >
        <div className="mb-4 flex justify-center sm:mb-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-indigo-600 backdrop-blur-sm dark:border-indigo-500/30 dark:bg-slate-900/40 dark:text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
            {t("groupQuizCta.newFeature")}
          </span>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 shadow-sm transition-shadow duration-300 hover:shadow-lg sm:p-8 md:p-10 dark:border-indigo-500/30 dark:from-indigo-500/10 dark:via-slate-900/40 dark:to-violet-500/10">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br from-indigo-400/30 to-violet-500/30 blur-3xl"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-gradient-to-br from-rose-400/20 to-amber-400/20 blur-3xl"
          />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-white shadow-sm shadow-indigo-500/30">
                  <IconUsers size={16} />
                </span>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
                  {t("groupQuizCta.eyebrow")}
                </p>
              </div>
              <h2 className="mt-3 text-3xl font-black tracking-tighter text-slate-900 sm:text-4xl md:text-5xl dark:text-slate-100">
                {t("groupQuizCta.titleLead")}{" "}
                <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 bg-clip-text text-transparent">
                  {t("groupQuizCta.titleHighlight")}
                </span>
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
                {t("groupQuizCta.description")}
              </p>
            </div>

            <Link
              href="/group-quiz"
              className="group/cta relative z-10 inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-slate-900 px-6 py-3 text-sm font-black tracking-tight text-white shadow-md transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] sm:self-auto sm:text-base dark:bg-white dark:text-slate-900"
            >
              {t("groupQuizCta.cta")}
              <IconArrowRight
                size={16}
                className="transition-transform duration-200 group-hover/cta:translate-x-0.5"
              />
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default GroupQuizCta;
