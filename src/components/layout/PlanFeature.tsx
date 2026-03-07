"use client"

import * as React from "react"
import { CheckCircle, XCircle, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const PlanFeature = ({
  text,
  included = true,
  icon: Icon,
  highlight = false,
}: {
  text: string;
  included?: boolean;
  icon?: LucideIcon;
  highlight?: boolean;
}) => {
  const FinalIcon = Icon || (included ? CheckCircle : XCircle);

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 -mx-3 transition-colors duration-200",
        highlight && included && "bg-purple-500/10 border border-purple-500/20",
        !included && "opacity-50"
      )}
    >
      <span
        className={cn(
          "flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full",
          included
            ? highlight
              ? "text-purple-300"
              : "text-emerald-400"
            : "text-zinc-600"
        )}
      >
        <FinalIcon className="w-4 h-4" />
      </span>
      <span
        className={cn(
          "text-left text-sm",
          !included && "line-through text-zinc-600",
          highlight && included && "text-white font-medium",
          !highlight && included && "text-zinc-300"
        )}
      >
        {text}
      </span>
      {highlight && included && (
        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded-full whitespace-nowrap">
          Exclusivo
        </span>
      )}
    </li>
  );
};
