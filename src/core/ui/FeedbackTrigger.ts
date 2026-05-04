type InApp = 'allgemein' | 'gpa' | 'deltat' | 'bohrkost' | 'docs'

const PATH_MAP: Array<[string, InApp]> = [
  ['/gpa', 'gpa'],
  ['/atlas', 'gpa'],
  ['/deltat', 'deltat'],
  ['/bohrkost', 'bohrkost'],
  ['/docs', 'docs'],
]

export function deriveInApp(pathname: string): InApp {
  const match = PATH_MAP.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + '/'))
  return match ? match[1] : 'allgemein'
}
