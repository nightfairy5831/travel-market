// Country mapping that matches react-phone-input-2 library
// This uses the same country codes and dial codes as the library
const countryDialCodes = {
  // Americas
  '+1': 'us',     // USA/Canada
  '+1242': 'bs',  // Bahamas
  '+1246': 'bb',  // Barbados
  '+1264': 'ai',  // Anguilla
  '+1268': 'ag',  // Antigua and Barbuda
  '+1284': 'vg',  // British Virgin Islands
  '+1340': 'vi',  // US Virgin Islands
  '+1441': 'bm',  // Bermuda
  '+1473': 'gd',  // Grenada
  '+1649': 'tc',  // Turks and Caicos
  '+1664': 'ms',  // Montserrat
  '+1670': 'mp',  // Northern Mariana Islands
  '+1671': 'gu',  // Guam
  '+1684': 'as',  // American Samoa
  '+1758': 'lc',  // Saint Lucia
  '+1767': 'dm',  // Dominica
  '+1784': 'vc',  // Saint Vincent and the Grenadines
  '+1849': 'do',  // Dominican Republic
  '+1868': 'tt',  // Trinidad and Tobago
  '+1869': 'kn',  // Saint Kitts and Nevis
  '+1876': 'jm',  // Jamaica
  '+1939': 'pr',  // Puerto Rico
  
  // Asia
  '+7': 'ru',     // Russia/Kazakhstan
  '+20': 'eg',    // Egypt
  '+27': 'za',    // South Africa
  '+30': 'gr',    // Greece
  '+31': 'nl',    // Netherlands
  '+32': 'be',    // Belgium
  '+33': 'fr',    // France
  '+34': 'es',    // Spain
  '+36': 'hu',    // Hungary
  '+39': 'it',    // Italy
  '+40': 'ro',    // Romania
  '+41': 'ch',    // Switzerland
  '+43': 'at',    // Austria
  '+44': 'gb',    // UK
  '+45': 'dk',    // Denmark
  '+46': 'se',    // Sweden
  '+47': 'no',    // Norway
  '+48': 'pl',    // Poland
  '+49': 'de',    // Germany
  
  // Middle East & South Asia
  '+51': 'pe',    // Peru
  '+52': 'mx',    // Mexico
  '+53': 'cu',    // Cuba
  '+54': 'ar',    // Argentina
  '+55': 'br',    // Brazil
  '+56': 'cl',    // Chile
  '+57': 'co',    // Colombia
  '+58': 've',    // Venezuela
  '+60': 'my',    // Malaysia
  '+61': 'au',    // Australia
  '+62': 'id',    // Indonesia
  '+63': 'ph',    // Philippines
  '+64': 'nz',    // New Zealand
  '+65': 'sg',    // Singapore
  '+66': 'th',    // Thailand
  '+81': 'jp',    // Japan
  '+82': 'kr',    // South Korea
  '+84': 'vn',    // Vietnam
  '+86': 'cn',    // China
  '+90': 'tr',    // Turkey
  '+91': 'in',    // India
  '+92': 'pk',    // Pakistan
  '+93': 'af',    // Afghanistan
  '+94': 'lk',    // Sri Lanka
  '+95': 'mm',    // Myanmar
  '+98': 'ir',    // Iran
  
  // Middle East continued
  '+211': 'ss',   // South Sudan
  '+212': 'ma',   // Morocco
  '+213': 'dz',   // Algeria
  '+216': 'tn',   // Tunisia
  '+218': 'ly',   // Libya
  '+220': 'gm',   // Gambia
  '+221': 'sn',   // Senegal
  '+222': 'mr',   // Mauritania
  '+223': 'ml',   // Mali
  '+224': 'gn',   // Guinea
  '+225': 'ci',   // Ivory Coast
  '+226': 'bf',   // Burkina Faso
  '+227': 'ne',   // Niger
  '+228': 'tg',   // Togo
  '+229': 'bj',   // Benin
  '+230': 'mu',   // Mauritius
  '+231': 'lr',   // Liberia
  '+232': 'sl',   // Sierra Leone
  '+233': 'gh',   // Ghana
  '+234': 'ng',   // Nigeria
  '+235': 'td',   // Chad
  '+236': 'cf',   // Central African Republic
  '+237': 'cm',   // Cameroon
  '+238': 'cv',   // Cape Verde
  '+239': 'st',   // Sao Tome and Principe
  '+240': 'gq',   // Equatorial Guinea
  '+241': 'ga',   // Gabon
  '+242': 'cg',   // Republic of the Congo
  '+243': 'cd',   // DR Congo
  '+244': 'ao',   // Angola
  '+245': 'gw',   // Guinea-Bissau
  '+246': 'io',   // British Indian Ocean Territory
  '+248': 'sc',   // Seychelles
  '+249': 'sd',   // Sudan
  '+250': 'rw',   // Rwanda
  '+251': 'et',   // Ethiopia
  '+252': 'so',   // Somalia
  '+253': 'dj',   // Djibouti
  '+254': 'ke',   // Kenya
  '+255': 'tz',   // Tanzania
  '+256': 'ug',   // Uganda
  '+257': 'bi',   // Burundi
  '+258': 'mz',   // Mozambique
  '+260': 'zm',   // Zambia
  '+261': 'mg',   // Madagascar
  '+262': 're',   // Reunion
  '+263': 'zw',   // Zimbabwe
  '+264': 'na',   // Namibia
  '+265': 'mw',   // Malawi
  '+266': 'ls',   // Lesotho
  '+267': 'bw',   // Botswana
  '+268': 'sz',   // Swaziland
  '+269': 'km',   // Comoros
  '+290': 'sh',   // Saint Helena
  '+291': 'er',   // Eritrea
  '+297': 'aw',   // Aruba
  '+298': 'fo',   // Faroe Islands
  '+299': 'gl',   // Greenland
  
  // Middle East
  '+350': 'gi',   // Gibraltar
  '+351': 'pt',   // Portugal
  '+352': 'lu',   // Luxembourg
  '+353': 'ie',   // Ireland
  '+354': 'is',   // Iceland
  '+355': 'al',   // Albania
  '+356': 'mt',   // Malta
  '+357': 'cy',   // Cyprus
  '+358': 'fi',   // Finland
  '+359': 'bg',   // Bulgaria
  '+370': 'lt',   // Lithuania
  '+371': 'lv',   // Latvia
  '+372': 'ee',   // Estonia
  '+373': 'md',   // Moldova
  '+374': 'am',   // Armenia
  '+375': 'by',   // Belarus
  '+376': 'ad',   // Andorra
  '+377': 'mc',   // Monaco
  '+378': 'sm',   // San Marino
  '+379': 'va',   // Vatican City
  '+380': 'ua',   // Ukraine
  '+381': 'rs',   // Serbia
  '+382': 'me',   // Montenegro
  '+383': 'xk',   // Kosovo
  '+385': 'hr',   // Croatia
  '+386': 'si',   // Slovenia
  '+387': 'ba',   // Bosnia and Herzegovina
  '+389': 'mk',   // North Macedonia
  '+420': 'cz',   // Czech Republic
  '+421': 'sk',   // Slovakia
  '+423': 'li',   // Liechtenstein
  '+500': 'fk',   // Falkland Islands
  '+501': 'bz',   // Belize
  '+502': 'gt',   // Guatemala
  '+503': 'sv',   // El Salvador
  '+504': 'hn',   // Honduras
  '+505': 'ni',   // Nicaragua
  '+506': 'cr',   // Costa Rica
  '+507': 'pa',   // Panama
  '+508': 'pm',   // Saint Pierre and Miquelon
  '+509': 'ht',   // Haiti
  '+590': 'gp',   // Guadeloupe
  '+591': 'bo',   // Bolivia
  '+592': 'gy',   // Guyana
  '+593': 'ec',   // Ecuador
  '+594': 'gf',   // French Guiana
  '+595': 'py',   // Paraguay
  '+596': 'mq',   // Martinique
  '+597': 'sr',   // Suriname
  '+598': 'uy',   // Uruguay
  '+599': 'cw',   // Curacao
  '+670': 'tl',   // East Timor
  '+672': 'nf',   // Norfolk Island
  '+673': 'bn',   // Brunei
  '+674': 'nr',   // Nauru
  '+675': 'pg',   // Papua New Guinea
  '+676': 'to',   // Tonga
  '+677': 'sb',   // Solomon Islands
  '+678': 'vu',   // Vanuatu
  '+679': 'fj',   // Fiji
  '+680': 'pw',   // Palau
  '+681': 'wf',   // Wallis and Futuna
  '+682': 'ck',   // Cook Islands
  '+683': 'nu',   // Niue
  '+685': 'ws',   // Samoa
  '+686': 'ki',   // Kiribati
  '+687': 'nc',   // New Caledonia
  '+688': 'tv',   // Tuvalu
  '+689': 'pf',   // French Polynesia
  '+690': 'tk',   // Tokelau
  '+691': 'fm',   // Micronesia
  '+692': 'mh',   // Marshall Islands
  '+850': 'kp',   // North Korea
  '+852': 'hk',   // Hong Kong
  '+853': 'mo',   // Macau
  '+855': 'kh',   // Cambodia
  '+856': 'la',   // Laos
  '+872': 'pn',   // Pitcairn Islands
  '+880': 'bd',   // Bangladesh
  '+886': 'tw',   // Taiwan
  '+960': 'mv',   // Maldives
  '+961': 'lb',   // Lebanon
  '+962': 'jo',   // Jordan
  '+963': 'sy',   // Syria
  '+964': 'iq',   // Iraq
  '+965': 'kw',   // Kuwait
  '+966': 'sa',   // Saudi Arabia
  '+967': 'ye',   // Yemen
  '+968': 'om',   // Oman
  '+970': 'ps',   // Palestine
  '+971': 'ae',   // UAE
  '+972': 'il',   // Israel
  '+973': 'bh',   // Bahrain
  '+974': 'qa',   // Qatar
  '+975': 'bt',   // Bhutan
  '+976': 'mn',   // Mongolia
  '+977': 'np',   // Nepal
  '+992': 'tj',   // Tajikistan
  '+993': 'tm',   // Turkmenistan
  '+994': 'az',   // Azerbaijan
  '+995': 'ge',   // Georgia
  '+996': 'kg',   // Kyrgyzstan
  '+998': 'uz',   // Uzbekistan
};

// Function to detect country from phone number
export function getCountryFromPhone(phone) {
  if (!phone) return 'us';
  
  // Remove any spaces and ensure it starts with +
  const cleanPhone = phone.startsWith('+') ? phone : `+${phone}`;
  
  // Check for exact matches (longest codes first)
  const sortedCodes = Object.keys(countryDialCodes).sort((a, b) => b.length - a.length);
  
  for (const code of sortedCodes) {
    if (cleanPhone.startsWith(code)) {
      const countryCode = countryDialCodes[code];
      console.log(`Detected country: ${countryCode} for phone: ${phone} (dial code: ${code})`);
      return countryCode;
    }
  }

  console.log(`No country match found for phone: ${phone}, defaulting to us`);
  return 'us'; // Default to US if no match found
}