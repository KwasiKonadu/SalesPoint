"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FieldLabel } from "@/components/atoms/field-label";
import { TextField } from "@/components/atoms/text-field";
import { cn } from "@/lib/utils";

type SendMethod = "whatsapp" | "sms" | "email";

const SEND_METHODS: { value: SendMethod; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
];

/**
 * "Send this receipt to the customer" dialog. V1 just shows a success toast —
 * wiring to a real delivery API is a follow-up.
 */
export function SendReceiptDialog({
  open,
  onOpenChange,
  defaultTo = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTo?: string;
}) {
  const [method, setMethod] = useState<SendMethod>("whatsapp");
  const [to, setTo] = useState(defaultTo);

  // Seed the recipient from the customer's phone each time the dialog opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setMethod("whatsapp");
      setTo(defaultTo);
    }
  }

  const handleSend = () => {
    if (!to.trim()) {
      toast.error("Please enter a recipient", {
        description:
          method === "email"
            ? "Enter a valid email address"
            : "Enter a valid phone number",
      });
      return;
    }
    toast.success(`Receipt sent via ${method}`, {
      description: `Sent to ${to}`,
    });
    onOpenChange(false);
    setTo("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Receipt</DialogTitle>
          <DialogDescription>
            Choose how to send the receipt to the customer
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <FieldLabel>Send via</FieldLabel>
            <RadioGroup
              value={method}
              onValueChange={(val) => {
                setMethod(val as SendMethod);
                setTo("");
              }}
              className="flex gap-2"
            >
              {SEND_METHODS.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all",
                    method === opt.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "hover:bg-muted/50",
                  )}
                >
                  <RadioGroupItem value={opt.value} className="sr-only" />
                  {opt.label}
                </label>
              ))}
            </RadioGroup>
          </div>
          <TextField
            label={method === "email" ? "Email Address" : "Phone Number"}
            id="send-to"
            type={method === "email" ? "email" : "tel"}
            placeholder={
              method === "email" ? "customer@example.com" : "+233 XX XXX XXXX"
            }
            value={to}
            onChange={(e) => setTo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend}>
            <Send className="size-4" />
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
