import { describe, expect, it } from 'vitest';
import { barva, eur, odstotek, zasluzekText } from './format';

// sl-SI uporablja nedeljivi presledek za tisočice, zato ga v primerjavah normaliziramo
const norm = (s: string) => s.replace(/\s/g, ' ');

describe('eur', () => {
  it('prikaže pomišljaj za manjkajočo vrednost', () => {
    expect(eur(null)).toBe('–');
  });

  it('prikaže dve decimalki in znak €', () => {
    expect(norm(eur(12345.5))).toBe('12.345,50 €');
  });
});

describe('odstotek', () => {
  it('pozitiven donos ima predznak +', () => {
    expect(odstotek(12.345)).toBe('+12,35 %');
  });

  it('negativen donos ima predznak −', () => {
    expect(odstotek(-3.5)).toBe('−3,5 %');
  });

  it('ničla nima predznaka', () => {
    expect(odstotek(0)).toBe('0 %');
  });

  it('manjkajoča vrednost', () => {
    expect(odstotek(null)).toBe('–');
  });
});

describe('zasluzekText', () => {
  it('izguba je prikazana z − pred zneskom', () => {
    expect(norm(zasluzekText(-15000))).toBe('−15.000,00 €');
  });

  it('dobiček je prikazan s +', () => {
    expect(zasluzekText(20)).toBe('+20,00 €');
  });
});

describe('barva', () => {
  it('vrne razred glede na predznak', () => {
    expect(barva(5)).toBe('exp__up');
    expect(barva(-5)).toBe('exp__down');
    expect(barva(0)).toBe('');
    expect(barva(null)).toBe('');
  });
});
