import { describe, it, expect } from 'vitest'
import { deriveInApp } from './FeedbackTrigger'

describe('deriveInApp', () => {
  it('gibt gpa zurück für /atlas', () => {
    expect(deriveInApp('/atlas')).toBe('gpa')
  })

  it('gibt gpa zurück für /atlas/details', () => {
    expect(deriveInApp('/atlas/details')).toBe('gpa')
  })

  it('gibt deltat zurück für /deltat', () => {
    expect(deriveInApp('/deltat')).toBe('deltat')
  })

  it('gibt bohrkost zurück für /bohrkost', () => {
    expect(deriveInApp('/bohrkost')).toBe('bohrkost')
  })

  it('gibt allgemein zurück für /dashboard', () => {
    expect(deriveInApp('/dashboard')).toBe('allgemein')
  })

  it('gibt allgemein zurück für /projects', () => {
    expect(deriveInApp('/projects')).toBe('allgemein')
  })

  it('gibt allgemein zurück für /', () => {
    expect(deriveInApp('/')).toBe('allgemein')
  })
})
