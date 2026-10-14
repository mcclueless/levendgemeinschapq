/**
 * Who last saved the document from the backend (organisation-accounts D9):
 * an account's email, or the administrator. Nothing for documents that
 * predate the stamp, or came in through the public form or an import.
 */
export function SavedBy({ by }: { by?: string }) {
  if (!by) return null;
  return (
    <p className="text-sm text-muted">
      Laatst opgeslagen door {by === "beheerder" ? "de beheerder" : by}.
    </p>
  );
}
