
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const PlanFeature = ({ text, included = true }: { text: string; included?: boolean }) => (
    <li className="flex items-center gap-3">
        {included ? (
            <CheckCircle className="w-5 h-5 text-primary" />
        ) : (
            <XCircle className="w-5 h-5 text-muted-foreground/50" />
        )}
        <span className={cn("text-left", !included && "text-muted-foreground/80 line-through")}>{text}</span>
    </li>
);
