// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BeforeAfter } from './BeforeAfter.tsx'
import type { ProcessResult, SourceImage } from '#/types/image.ts'

const source: SourceImage = {
  id: 'source',
  file: new File(['source'], 'source.jpg', { type: 'image/jpeg' }),
  url: 'blob:source',
  width: 2400,
  height: 1600,
  size: 3_800_000,
  type: 'image/jpeg',
}

const result: ProcessResult = {
  blob: new Blob(['result'], { type: 'image/webp' }),
  url: 'blob:result',
  width: 1280,
  height: 853,
  size: 624_000,
  format: 'image/webp',
}

beforeEach(() => {
  HTMLElement.prototype.setPointerCapture = vi.fn()
  HTMLElement.prototype.releasePointerCapture = vi.fn()
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => true)
})

afterEach(cleanup)

describe('BeforeAfter', () => {
  it('supports keyboard comparison adjustment and limits', () => {
    render(<BeforeAfter source={source} result={result} />)
    const divider = screen.getByRole('slider', {
      name: 'Before and after comparison',
    })

    expect(divider.getAttribute('aria-valuenow')).toBe('50')
    fireEvent.keyDown(divider, { key: 'ArrowRight' })
    expect(divider.getAttribute('aria-valuenow')).toBe('52')
    fireEvent.keyDown(divider, { key: 'Home' })
    expect(divider.getAttribute('aria-valuenow')).toBe('0')
    fireEvent.keyDown(divider, { key: 'End' })
    expect(divider.getAttribute('aria-valuenow')).toBe('100')
  })

  it('updates the divider from pointer position', () => {
    render(<BeforeAfter source={source} result={result} />)
    const viewport = screen.getByTestId('comparison-viewport')
    vi.spyOn(viewport, 'getBoundingClientRect').mockReturnValue({
      x: 100,
      y: 0,
      left: 100,
      top: 0,
      right: 500,
      bottom: 500,
      width: 400,
      height: 500,
      toJSON: () => ({}),
    })

    const divider = screen.getByTestId('comparison-divider')
    fireEvent.pointerDown(divider, { pointerId: 1, clientX: 200 })
    expect(divider.getAttribute('aria-valuenow')).toBe('25')
  })

  it('zooms and resets to fit', () => {
    render(<BeforeAfter source={source} result={result} />)

    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    expect(screen.getByText('110%')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Fit' }))
    expect(screen.getByText('100%')).toBeTruthy()
  })

  it('announces processing when no result is available', () => {
    render(<BeforeAfter source={source} result={null} />)
    const processingStatus = screen
      .getAllByRole('status')
      .find((element) => element.textContent.includes('Preparing result…'))
    expect(processingStatus).toBeTruthy()
    expect(screen.queryByRole('slider')).toBeNull()
  })
})
