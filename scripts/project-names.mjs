export const readyName='Ready Sustainable Employment and Training Cooperative (Ready SET Co-op)';
export const gajraName='Global Association for Joyful Responsible Abundance on Earth (GAJRA Earth)';
export function fullProjectNames(value){
 const text=String(value);
 return text.replaceAll(readyName,'\u0001READY\u0001').replaceAll(gajraName,'\u0001GAJRA\u0001')
  .replace(/\bReady\s+S\.?E\.?T\.?\s+Co[- ]?op(?:erative)?\b/gi,readyName)
  .replace(/\bGAJRA\s+Earth\b/gi,gajraName)
  .replaceAll('\u0001READY\u0001',readyName).replaceAll('\u0001GAJRA\u0001',gajraName);
}
