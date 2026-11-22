/** Pomožne funkcije za prikaz denarnih zneskov in donosov (sl-SI). */

export const eur = (v: number | null) =>
  v === null ? '–' : `${v.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

const predznak = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '');

/** Število s predznakom (+/−), ne samo barvo. */
export const odstotek = (v: number | null) =>
  v === null ? '–' : `${predznak(v)}${Math.abs(v).toLocaleString('sl-SI', { maximumFractionDigits: 2 })} %`;

export const zasluzekText = (v: number | null) =>
  v === null ? '–' : `${predznak(v)}${eur(Math.abs(v))}`;

/** CSS razred za obarvanje pozitivnih/negativnih vrednosti. */
export const barva = (v: number | null) => (v === null || v === 0 ? '' : v > 0 ? 'exp__up' : 'exp__down');
