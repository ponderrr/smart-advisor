"use client";

import type { ReactNode } from "react";
import { IconCheck } from "@tabler/icons-react";

import { GlowPillButton } from "@/components/ui/glow-pill-button";
import { cn } from "@/lib/utils";

export type QuestionType = "single_select" | "select_all" | "fill_in_blank";
export type QuestionValue = string | string[];

type QuestionCardProps = {
  title: string;
  subtitle?: string;
  type: QuestionType;
  options?: string[];
  placeholder?: string;
  value: QuestionValue | undefined;
  onChange: (next: QuestionValue) => void;
  /** When provided, replaces the type-based body (e.g. for custom card grids). */
  bodyOverride?: ReactNode;
};

export function QuestionCard({
  title,
  subtitle,
  type,
  options,
  placeholder,
  value,
  onChange,
  bodyOverride,
}: QuestionCardProps) {
  return (
    <>
      <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 text-sm font-semibold text-indigo-500 dark:text-indigo-400 sm:text-base">
          {subtitle}
        </p>
      ) : null}

      {bodyOverride ?? (
        <QuestionBody
          type={type}
          options={options}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      )}
    </>
  );
}

function QuestionBody({
  type,
  options,
  placeholder,
  value,
  onChange,
}: Pick<
  QuestionCardProps,
  "type" | "options" | "placeholder" | "value" | "onChange"
>) {
  if (type === "fill_in_blank") {
    return (
      <div className="mt-7">
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Type your answer here..."}
          rows={3}
          className="w-full resize-none rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-indigo-500/70"
        />
      </div>
    );
  }

  if (type === "select_all") {
    const selected = Array.isArray(value) ? value : [];
    const toggle = (option: string) => {
      onChange(
        selected.includes(option)
          ? selected.filter((o) => o !== option)
          : [...selected, option],
      );
    };
    return (
      <div className="mt-7 flex flex-wrap gap-2">
        {options?.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <GlowPillButton
              key={option}
              onClick={() => toggle(option)}
              active={isSelected}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                isSelected
                  ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500/70 dark:bg-indigo-500/15 dark:text-indigo-300"
                  : "border-slate-200/80 bg-white text-slate-700 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-indigo-500/50",
              )}
            >
              {isSelected && <IconCheck className="h-4 w-4" />}
              {option}
            </GlowPillButton>
          );
        })}
      </div>
    );
  }

  // single_select
  const selectedValue = typeof value === "string" ? value : "";
  return (
    <div className="mt-5 grid gap-2 sm:mt-7 sm:gap-3 sm:grid-cols-2">
      {options?.map((option) => {
        const selected = selectedValue === option;
        return (
          <GlowPillButton
            key={option}
            onClick={() => onChange(option)}
            active={selected}
            className={cn(
              "group flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all",
              selected
                ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500/70 dark:bg-indigo-500/15 dark:text-indigo-300"
                : "border-slate-200/80 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200",
            )}
          >
            <span className="text-sm font-semibold sm:text-base">{option}</span>
            {selected ? (
              <IconCheck className="h-5 w-5" />
            ) : (
              <span className="h-5 w-5 rounded-full border border-slate-300 transition group-hover:border-indigo-300 dark:border-slate-600" />
            )}
          </GlowPillButton>
        );
      })}
    </div>
  );
}

export function hasQuestionAnswer(value: QuestionValue | undefined): boolean {
  if (value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  return value.trim().length > 0;
}
