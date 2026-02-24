
import { CheckCircle, XCircle, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const PlanFeature = ({ text, included = true, icon: Icon }: { text: string; included?: boolean; icon?: LucideIcon }) => {
    const FinalIcon = Icon || (included ? CheckCircle : XCircle);
    return (
        <li className="flex items-center gap-3">
            <FinalIcon className={cn(
                "w-5 h-5",
                included ? "text-primary" : "text-muted-foreground/50"
            )} />
            <span className={cn("text-left", !included && "text-muted-foreground/80 line-through")}>{text}</span>
        </li>
    );
};
