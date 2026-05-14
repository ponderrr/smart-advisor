"use client";

import type { ReactNode } from "react";
import { IconCheck } from "@tabler/icons-react";

import { PillButton } from "@/components/ui/pill-button";
import {
  getAccentName,
  type ContentAccent,
} from "@/features/quiz/utils/content-accent";
import type { ContentType } from "@/features/quiz/store/quiz-store";
import { cn } from "@/lib/utils";

export type QuestionType = "single_select" | "select_all" | "fill_in_blank";
export type QuestionValue = string | string[];

interface OptionTone {
  selectedText: string;
  selectedBorder: string;
  selectedBg: string;
  hoverBorder: string;
  subtitle: string;
  focusBorder: string;
  focusRing: string;
}

const OPTION_TONES: Record<ContentAccent, OptionTone> = {
  amber: {
    selectedText: "text-amber-700 dark:text-amber-300",
    selectedBorder: "border-amber-400 dark:border-amber-500/70",
    selectedBg: "bg-amber-50 dark:bg-amber-500/15",
    hoverBorder:
      "hover:border-amber-300 dark:hover:border-amber-500/50 group-hover:border-amber-300",
    subtitle: "text-amber-600 dark:text-amber-400",
    focusBorder: "focus:border-amber-400 dark:focus:border-amber-500/70",
    focusRing: "focus:ring-amber-500/20",
  },
  emerald: {
    selectedText: "text-emerald-700 dark:text-emerald-300",
    selectedBorder: "border-emerald-400 dark:border-emerald-500/70",
    selectedBg: "bg-emerald-50 dark:bg-emerald-500/15",
    hoverBorder:
      "hover:border-emerald-300 dark:hover:border-emerald-500/50 group-hover:border-emerald-300",
    subtitle: "text-emerald-600 dark:text-emerald-400",
    focusBorder: "focus:border-emerald-400 dark:focus:border-emerald-500/70",
    focusRing: "focus:ring-emerald-500/20",
  },
  rose: {
    selectedText: "text-rose-700 dark:text-rose-300",
    selectedBorder: "border-rose-400 dark:border-rose-500/70",
    selectedBg: "bg-rose-50 dark:bg-rose-500/15",
    hoverBorder:
      "hover:border-rose-300 dark:hover:border-rose-500/50 group-hover:border-rose-300",
    subtitle: "text-rose-600 dark:text-rose-400",
    focusBorder: "focus:border-rose-400 dark:focus:border-rose-500/70",
    focusRing: "focus:ring-rose-500/20",
  },
  violet: {
    selectedText: "text-violet-700 dark:text-violet-300",
    selectedBorder: "border-violet-400 dark:border-violet-500/70",
    selectedBg: "bg-violet-50 dark:bg-violet-500/15",
    hoverBorder:
      "hover:border-violet-300 dark:hover:border-violet-500/50 group-hover:border-violet-300",
    subtitle: "text-violet-600 dark:text-violet-400",
    focusBorder: "focus:border-violet-400 dark:focus:border-violet-500/70",
    focusRing: "focus:ring-violet-500/20",
  },
};

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
  /** Drives the accent color of selected option pills and the subtitle.
   *  Defaults to violet so existing surfaces (group-quiz, demo) look the same. */
  contentType?: ContentType | null;
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
  contentType,
}: QuestionCardProps) {
  const tone = OPTION_TONES[getAccentName(contentType ?? null)];
  return (
    <>
      <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
        {title}
      </h1>
      {subtitle ? (
        <p
          className={cn(
            "mt-2 text-sm font-semibold sm:text-base",
            tone.subtitle,
          )}
        >
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
          tone={tone}
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
  tone,
}: Pick<
  QuestionCardProps,
  "type" | "options" | "placeholder" | "value" | "onChange"
> & { tone: OptionTone }) {
  if (type === "fill_in_blank") {
    return (
      <div className="mt-7">
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Type your answer here..."}
          rows={3}
          className={cn(
            "w-full resize-none rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:ring-2 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder-slate-500",
            tone.focusBorder,
            tone.focusRing,
          )}
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
            <PillButton
              key={option}
              onClick={() => toggle(option)}
              active={isSelected}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                isSelected
                  ? cn(tone.selectedBorder, tone.selectedBg, tone.selectedText)
                  : cn(
                      "border-slate-200/80 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200",
                      tone.hoverBorder,
                    ),
              )}
            >
              {isSelected && <IconCheck className="h-4 w-4" />}
              {option}
            </PillButton>
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
          <PillButton
            key={option}
            onClick={() => onChange(option)}
            active={selected}
            className={cn(
              "group flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all",
              selected
                ? cn(tone.selectedBorder, tone.selectedBg, tone.selectedText)
                : "border-slate-200/80 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200",
            )}
          >
            <span className="text-sm font-semibold sm:text-base">{option}</span>
            {selected ? (
              <IconCheck className="h-5 w-5" />
            ) : (
              <span
                className={cn(
                  "h-5 w-5 rounded-full border border-slate-300 transition dark:border-slate-600",
                  tone.hoverBorder,
                )}
              />
            )}
          </PillButton>
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
