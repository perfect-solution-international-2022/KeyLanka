import { toast } from "sonner";

/**
 * Shows a toast with Confirm/Cancel actions instead of the native browser
 * confirm() dialog. Resolves true if the user confirms, false otherwise
 * (dismissed, cancelled, or the toast times out unanswered).
 */
export function confirmToast(message: string, options?: { confirmLabel?: string; description?: string }): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    toast(message, {
      description: options?.description,
      duration: 10000,
      action: {
        label: options?.confirmLabel ?? "Confirm",
        onClick: () => settle(true),
      },
      cancel: {
        label: "Cancel",
        onClick: () => settle(false),
      },
      onDismiss: () => settle(false),
      onAutoClose: () => settle(false),
    });
  });
}
