import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

interface DialogProps extends DialogPrimitive.DialogProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  ({ title, description, children, ...props }, ref) => (
    <DialogPrimitive.Root {...props}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-[calc(100%-16px)] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg border-2 border-[#392E1F] bg-[#F6D998] p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            "font-patrick-hand text-[#392E1F]"
          )}
        >
          <div className="relative">
            <DialogPrimitive.Close className="absolute right-0 top-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
            <DialogPrimitive.Title className="text-2xl font-medium">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-4 text-lg leading-normal">
              {description}
            </DialogPrimitive.Description>
            <div className="mt-6 flex justify-center gap-4">{children}</div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
);
Dialog.displayName = "Dialog";

export { Dialog };
