import marketing from '../i18n/en/marketing.json'

export const marketingContent = marketing

export function getCopy(path, fallback = null) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), marketingContent) ?? fallback
}
