export function detectCountry(request: Request): string {
  const cf = request.headers.get("cf-ipcountry");
  if (cf && cf !== "XX") return cf;

  const vercel = request.headers.get("x-vercel-ip-country");
  if (vercel) return vercel;

  const lang = request.headers.get("accept-language");
  if (lang) {
    const locale = lang.split(",")[0]?.split("-")[1]?.split(";")[0];
    if (locale) return locale.toUpperCase();
  }

  return "US";
}

export function countryToRegion(country: string): string {
  const euCountries = [
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
    "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
    "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  ];
  const gbCountries = ["GB", "UK"];
  const inCountries = ["IN"];
  const brCountries = ["BR"];
  const jpCountries = ["JP"];
  const auCountries = ["AU", "NZ"];

  if (euCountries.includes(country)) return "EU";
  if (gbCountries.includes(country)) return "GB";
  if (inCountries.includes(country)) return "IN";
  if (brCountries.includes(country)) return "BR";
  if (jpCountries.includes(country)) return "JP";
  if (auCountries.includes(country)) return "AU";
  return "US";
}
