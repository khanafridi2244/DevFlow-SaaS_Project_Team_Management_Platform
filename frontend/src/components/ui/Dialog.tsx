import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, title, children }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60"
              />
            </RadixDialog.Overlay>

            {/* Centering happens here, via flexbox, on a plain (non-animated)
                wrapper — this is what actually fixes the bug. Framer Motion
                is now free to own the `transform` property on the content
                below for scale/fade only, with zero conflict, since
                positioning no longer depends on transform at all. */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <RadixDialog.Content asChild forceMount>
                <motion.div
                  initial={{ opacity: 0, scale: 0.97, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="w-full max-w-md rounded-lg border border-line bg-ink p-5 shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <RadixDialog.Title className="text-sm font-semibold text-paper">
                      {title}
                    </RadixDialog.Title>
                    <RadixDialog.Close className="text-paper/40 hover:text-paper">
                      <X className="h-4 w-4" />
                    </RadixDialog.Close>
                  </div>
                  <div className="mt-4">{children}</div>
                </motion.div>
              </RadixDialog.Content>
            </div>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}