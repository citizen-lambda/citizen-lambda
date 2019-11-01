export const AppConfig = {
  appName: 'GeoNature-citizen',
  API_ENDPOINT: 'http://localhost:5002/api',
  // API_TAXHUB: "http://localhost:5000/api",
  URL_APPLICATION: 'http://127.0.0.1:4200',
  FRONTEND: {
    PROD_MOD: true,
    // MULTILINGUAL: false,
    DISPLAY_FOOTER: true,
    DISPLAY_TOPBAR: false,
    DISPLAY_SIDEBAR: true
  },
  ALLOWED_EXTENSIONS: ['png', 'jpg', 'jpeg', 'gif'], // TODO: validate media (ext?) for obs submission
  REWARDS: true,
  termsOfUse: {
    fr: 'assets/cgu.pdf',
    en: 'assets/termsOfUse.pdf'
  },
  platform_intro: {
    fr: 'Bienvenue<br /> sur GeoNature Citizen',
    en: 'Welcome<br /> on GeoNature Citizen'
  },
  platform_greeter: {
    fr:
      // tslint:disable-next-line: max-line-length
      'Hae duae provinciae bello quondam piratico catervis mixtae praedonum a Servilio pro consule missae sub iugum factae sunt vectigales. et hae quidem regiones velut in prominenti terrarum lingua positae ob orbe eoo monte Amano disparantur.',
    en:
      // tslint:disable-next-line: max-line-length
      'Hae duae provinciae bello quondam piratico catervis mixtae praedonum a Servilio pro consule missae sub iugum factae sunt vectigales. et hae quidem regiones velut in prominenti terrarum lingua positae ob orbe eoo monte Amano disparantur.'
  },
  platform_participate: {
    fr: 'PARTICIPER AU PROGRAMME',
    en: 'PARTICIPATE'
  },
  program_share_an_observation: {
    fr: 'PARTAGER UNE OBSERVATION',
    en: 'SHARE AN OBSERVATION'
  },
  program_add_an_observation: {
    fr: 'AJOUTER UNE OBSERVATION',
    en: 'CONTRIBUTE AN OBSERVATION'
  },
  taxonSelectInputThreshold: 2,
  taxonAutocompleteInputThreshold: 6,
  taxonAutocompleteFields: ['nom_complet', 'nom_vern', 'nom_vern_eng', 'cd_nom'],
  program_list_sort: '-timestamp_create'
};
