import { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export function Loader({
    className,
    ...props
}: ComponentPropsWithoutRef<"div">) {
    return (
        <div
            className={cn(
                "flex min-h-[50vh] w-full items-center justify-center",
                className
            )}
            {...props}
        >
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    );
}
