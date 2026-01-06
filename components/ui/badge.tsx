import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",

        muted:
          "border-transparent bg-[#E1E1E1] text-[#4C4A46] transition-colors duration-200 hover:bg-[#D6D6D6] [a&]:hover:bg-[#D6D6D6]",

        warning:
          "border-transparent bg-[#FEF9C3] text-[#A16207] transition-colors duration-200 hover:bg-[#FDE68A] hover:text-[#854D0E] [a&]:hover:bg-[#FDE68A]",

        success:
          "border-transparent bg-[#B9DDB1] text-[#007C29] transition-colors duration-200 hover:bg-[#A7D4A0] hover:text-[#006622] [a&]:hover:bg-[#A7D4A0]",
        time: "border-transparent h-hug w-hug bg-[#E2E9F3] text-[#013880] [a&]:hover:bg-primary/90 h-fit",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
