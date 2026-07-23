import {
  KeyRound,
  ShieldAlert,
  Copy,
  Radio,
  Fingerprint,
  Cpu,
  Siren,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { getIconByName } from "@/lib/service-icon-options";

const SLUG_ICONS: Record<string, LucideIcon> = {
  "car-key-programming": KeyRound,
  "all-keys-lost-solution": ShieldAlert,
  "spare-key-duplication": Copy,
  "remote-programming": Radio,
  "smart-key-programming": Fingerprint,
  "ecu-and-immo-services": Cpu,
  "emergency-lockout-service": Siren,
};

const KEYWORD_ICONS: [RegExp, LucideIcon][] = [
  [/lost|emergency|lockout|24\/7/i, Siren],
  [/smart|fingerprint|proximity/i, Fingerprint],
  [/remote|fob|garage/i, Radio],
  [/duplicat|spare|copy/i, Copy],
  [/ecu|immo|diagnostic|cpu/i, Cpu],
  [/lost|alert|shield/i, ShieldAlert],
  [/key|program/i, KeyRound],
];

export function getServiceIcon(slug: string, title: string, storedIcon?: string | null): LucideIcon {
  const custom = getIconByName(storedIcon);
  if (custom) return custom;
  if (SLUG_ICONS[slug]) return SLUG_ICONS[slug];
  const match = KEYWORD_ICONS.find(([pattern]) => pattern.test(title) || pattern.test(slug));
  return match ? match[1] : Wrench;
}
