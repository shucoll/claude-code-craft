import type { ReactNode } from 'react'
import { useLanguage } from '../../context/LanguageContext'

export function WhenLang({ is, children }: { is: string | string[]; children: ReactNode }) {
  const { language } = useLanguage()
  const langs = Array.isArray(is) ? is : [is]
  return langs.includes(language) ? <>{children}</> : null
}
