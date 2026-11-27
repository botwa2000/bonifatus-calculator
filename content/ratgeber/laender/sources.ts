// Official sources for the Halbjahreszeugnis pages per Land (/de/ratgeber/halbjahreszeugnis-<land>).
// Texts and URLs match the overview article (content/ratgeber/de/halbjahreszeugnis-bedeutung.ts).
import type { RatgeberSource } from '../types'

export const LAND_SOURCES = {
  bw_nvo: {
    text: 'Notenbildungsverordnung Baden-Württemberg (NVO), § 3 Abs. 2 und 4, gültig ab 05.02.2025.',
    url: 'https://www.landesrecht-bw.de/perma?d=jlr-NNLBW00007BBDNN00000000016',
  },
  by_km: {
    text: 'Bayerisches Staatsministerium für Unterricht und Kultus: Prüfungen und Zeugnisse – Termine für das Schuljahr 2026/2027 (Stand 05.10.2026).',
    url: 'https://www.km.bayern.de/termine/pruefungen-und-zeugnisse',
  },
  be_ferien: {
    text: 'Senatsverwaltung für Bildung, Jugend und Familie Berlin: Änderung der Ferienordnung für das Land Berlin von 2024/2025 bis 2029/2030 vom 30.08.2024, Nr. 3 (Schuljahr 2026/2027).',
    url: 'https://www.berlin.de/sen/bjf/service/kalender/ferien/ferienordnung-des-landes-berlin-2024_2025-bis-2029_2030.pdf',
  },
  bb_kalender: {
    text: 'Ministerium für Bildung, Jugend und Sport Brandenburg: Schuljahreskalender.',
    url: 'https://mbjs-fachportal.brandenburg.de/bildung/infos-fuer-schulen/schuljahreskalender.html',
  },
  hb_ferien: {
    text: 'Verordnung über die Ferien für die Schulen der Stadtgemeinden Bremen und Bremerhaven für die Schuljahre 2024/2025 bis 2029/2030 vom 1. November 2022 (Brem.GBl. 2022, 871), § 9.',
    url: 'https://www.transparenz.bremen.de/metainformationen/verordnung-ueber-die-ferien-fuer-die-schulender-stadtgemeinden-bremen-und-bremerhaven-fuer-die-schuljahre-2024-2025-bis-2029-2030-vom-1-november-2022-186886?template=20_gp_ifg_meta_detail_d',
  },
  hh_ferien: {
    text: 'Behörde für Schule und Berufsbildung Hamburg: Ferienordnung für die Schuljahre 2024/25 bis 2029/30.',
    url: 'https://dokumente.hamburg.de/resource/blob/134372/5bc131bdd36a604f67b361d21f7df37e/ferienordnung-hamburg-2024-2030-data.pdf',
  },
  he_vogsv: {
    text: 'Verordnung zur Gestaltung des Schulverhältnisses (VOGSV) Hessen, § 62 Abs. 1, i. d. F. v. 20.07.2023.',
    url: 'https://www.rv.hessenrecht.hessen.de/perma?d=hevr-SchulVerhGVHE2011V10P62',
  },
  mv_ferien: {
    text: 'Landesregierung Mecklenburg-Vorpommern: Ferientermine (Schuljahr 2026/2027).',
    url: 'https://land-mv.de/seite/ferientermine',
  },
  ni_ferien: {
    text: 'Niedersächsisches Kultusministerium: Ferienordnung für die Schuljahre 2024/2025 bis 2029/2030, RdErl. v. 18.11.2022, Nr. 1.3 und 4.',
    url: 'https://www.mk.niedersachsen.de/download/190060/Ferienordnung_2024_25-_2029_30.pdf',
  },
  nw_bass: {
    text: 'Ministerium für Schule und Bildung NRW: Ordnung der Ferien und Termine für die Aushändigung der Halbjahreszeugnisse (BASS 12-65 Nr. 1).',
    url: 'https://bass.schule.nrw/191.htm',
  },
  rp_schulo: {
    text: 'Schulordnung für die öffentlichen Grundschulen Rheinland-Pfalz, § 40 Abs. 1; ebenso Übergreifende Schulordnung, § 58.',
    url: 'https://landesrecht.rlp.de/bsrp/document/jlr-NNLRP00005A37NN00000000079',
  },
  sl_termine: {
    text: 'Ministerium für Bildung und Kultur Saarland: Terminplanung für das Schuljahr 2026/2027 (Gymnasien und Gemeinschaftsschulen), Nr. 7.',
    url: 'https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Bildungsserver/allgemeine-informationen/Termine_Gymnasien-Gemeinschaftsschulen.pdf?__blob=publicationFile&v=22',
  },
  sn_vwv: {
    text: 'Sächsisches Staatsministerium für Kultus: Verwaltungsvorschrift Bedarf und Schuljahresablauf 2026/2027 vom 23. April 2026, Teil C.',
    url: 'https://www.revosax.sachsen.de/vorschrift/21547-VwV-Bedarf-und-Schuljahresablauf-2026-2027',
  },
  st_ferien: {
    text: 'Ministerium für Bildung Sachsen-Anhalt: Ferientermine 2024 bis 2030 (Schuljahr 2026/2027).',
    url: 'https://mb.sachsen-anhalt.de/api/media/Ferientermine_2024_bis_2030.pdf?collection=document',
  },
  sh_zvo: {
    text: 'Zeugnisverordnung Schleswig-Holstein (ZVO) vom 18. Juni 2018, § 8 Abs. 5.',
    url: 'https://www.gesetze-rechtsprechung.sh.juris.de/perma?d=jlr-NNLSH00002BC4NN00000000020',
  },
  sh_ferienvo: {
    text: 'Ferienverordnung Schleswig-Holstein 2024/25 bis 2030/31 vom 2. September 2022, § 1 Abs. 4.',
    url: 'https://www.gesetze-rechtsprechung.sh.juris.de/perma?d=jlr-NNLSH000032C8NN00000000002',
  },
  th_schulo: {
    text: 'Thüringer Schulordnung (ThürSchulO) vom 20. Januar 1994, § 60 Abs. 3 Satz 1 und Abs. 5 Satz 3; Abs. 5 in der Fassung der Dreizehnten Änderungsverordnung vom 6. Juni 2025 (GVBl. S. 179), in Kraft seit 1. August 2025.',
    url: 'https://landesrecht.thueringen.de/bsth/document/jlr-NNLTH0000384ENN00000000302',
  },
  he_ferien: {
    text: 'Hessisches Kultusministerium: Ferientermine (Schuljahr 2026/2027).',
    url: 'https://kultus.hessen.de/schulsystem/ferien/ferientermine',
  },
  kmk: {
    text: 'Kultusministerkonferenz: Ferien im Schuljahr 2026/2027 (Stand 09.10.2025).',
    url: 'https://www.kmk.org/service/ferienregelung/ferienkalender.html',
  },
  nw_schulg: {
    text: 'Schulgesetz für das Land Nordrhein-Westfalen (SchulG), § 11 Abs. 5 und 6, § 49 Abs. 1 und 2, § 50 Abs. 1 bis 4.',
    url: 'https://bass.schule.nrw/6043.htm',
  },
  nw_schulg44: {
    text: 'Schulgesetz für das Land Nordrhein-Westfalen (SchulG), § 44 Abs. 2 – Information und Beratung.',
    url: 'https://bass.schule.nrw/6043.htm#1-1p44',
  },
  th_gvbl: {
    text: 'Gesetz- und Verordnungsblatt für den Freistaat Thüringen 2025, Nr. 9 vom 27. Juni 2025, S. 179–181: Dreizehnte Verordnung zur Änderung der Thüringer Schulordnung.',
    url: 'https://parldok.thueringer-landtag.de/ParlDok/dokument/102391',
  },
  hh_elternkammer: {
    text: 'Elternkammer Hamburg: Pressemitteilung „Das Schulhalbjahr ist beendet und zeigt deutliche Grenzen im Hamburger Schulsystem auf“ vom 30.01.2026.',
    url: 'https://ker51.hamburg.de/wp-content/uploads/sites/227/2026/01/PM-Schulhalbjahr.pdf',
  },
} satisfies Record<string, RatgeberSource>

export type LandSourceKey = keyof typeof LAND_SOURCES
