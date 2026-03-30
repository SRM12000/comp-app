import { useState } from "react";
import { Button, buttonVariants } from "~/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import type { Button as ButtonPrimitive } from "@base-ui/react/button";

interface ConfirmButtonProps extends Omit<ButtonPrimitive.Props & VariantProps<typeof buttonVariants>, "onClick"> {
  onClick: () => void;
  confirmMessage?: string;
}

export function ConfirmButton({
  onClick,
  confirmMessage = "Are you sure?",
  children,
  disabled,
  variant,
  size,
  className,
  ...props
}: ConfirmButtonProps) {
  const [pending, setPending] = useState(false);

  if (pending) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{confirmMessage}</span>
        <Button
          size={size}
          variant={variant}
          onClick={() => {
            setPending(false);
            onClick();
          }}
        >
          Confirm
        </Button>
        <Button size={size} variant="outline" onClick={() => setPending(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={disabled}
      onClick={() => setPending(true)}
      {...props}
    >
      {children}
    </Button>
  );
}
