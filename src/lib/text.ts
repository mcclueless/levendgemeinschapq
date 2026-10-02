/** Lower case and without accents, so a search for "cafe" finds "Café". */
export const fold = (value: string) =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
