import { Select } from "@/components/admin/form";
import {
  ADMIN_CHOICES,
  STORED_CHOICE,
  choiceFor,
  type RecurrenceChoice,
} from "@/content/recurrence-form";
import { recurrenceLabel, type RecurrenceLike } from "@/lib/recurrence-label";

/** The option wording: "Elke 2 weken" is the phrase every reader surface uses (D5). */
const LABELS: Record<RecurrenceChoice, string> = {
  weekly: "Wekelijks",
  biweekly: "Elke 2 weken",
  monthly: "Maandelijks",
};

/**
 * The Herhaling select of the backend event forms (recurrence-biweekly D4):
 * Eenmalig, the offered choices and, on the edit form, the stored rhythm when
 * no choice expresses it — an imported every three weeks, say — as its own
 * selected option, worded as the system describes it elsewhere, so the
 * editor sees the truth and an untouched save keeps it (D3).
 */
export function RecurrenceSelect({
  stored,
  choices = ADMIN_CHOICES,
}: {
  stored?: RecurrenceLike;
  choices?: readonly RecurrenceChoice[];
}) {
  const current = choiceFor(stored);
  const keepStored = stored && !current;
  return (
    <Select
      id="recurrence"
      name="recurrence"
      defaultValue={keepStored ? STORED_CHOICE : (current ?? "none")}
    >
      <option value="none">Eenmalig</option>
      {choices.map((c) => (
        <option key={c} value={c}>
          {LABELS[c]}
        </option>
      ))}
      {keepStored ? <option value={STORED_CHOICE}>{recurrenceLabel(stored)}</option> : null}
    </Select>
  );
}
