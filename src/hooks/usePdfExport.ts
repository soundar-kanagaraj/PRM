import { useCallback, useState } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * Walks the DOM tree under `root` and replaces every oklch()/oklab() color
 * in inline styles and computed styles with an rgb() equivalent so html2canvas
 * (which doesn't understand oklch) can render correctly.
 *
 * Returns a cleanup function that restores the original inline styles.
 */
function neutralizeOklch(root: HTMLElement): () => void {
  const originals: Array<{ el: HTMLElement; style: string }> = []

  const all = root.querySelectorAll<HTMLElement>('*')
  const elements: HTMLElement[] = [root, ...Array.from(all)]

  for (const el of elements) {
    const original = el.getAttribute('style') || ''
    originals.push({ el, style: original })

    const computed = getComputedStyle(el)
    const propsToCheck = [
      'color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderBottomColor',
      'borderLeftColor', 'borderRightColor', 'fill', 'stroke', 'outlineColor',
      'boxShadow', 'background',
    ]

    let changed = false
    for (const prop of propsToCheck) {
      const val = computed[prop as keyof CSSStyleDeclaration]
      if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
        const rgb = convertToRgb(val)
        if (rgb) {
          el.style.setProperty(
            prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()),
            rgb
          )
          changed = true
        }
      }
    }
    // Also handle CSS variables set inline
    if (original.includes('oklch') || original.includes('oklab')) {
      const cleaned = original.replace(/oklch\([^)]+\)/g, '#888888').replace(/oklab\([^)]+\)/g, '#888888')
      el.setAttribute('style', cleaned)
      changed = true
    }
    if (!changed && original) {
      el.setAttribute('style', original)
    }
  }

  return () => {
    for (const { el, style } of originals) {
      if (style) el.setAttribute('style', style)
      else el.removeAttribute('style')
    }
  }
}

function convertToRgb(colorStr: string): string | null {
  const el = document.createElement('div')
  el.style.color = colorStr
  document.body.appendChild(el)
  const computed = getComputedStyle(el).color
  document.body.removeChild(el)
  // computed will be rgb(...) or rgba(...)
  return computed
}

export function usePdfExport() {
  const [exporting, setExporting] = useState(false)

  const exportToPdf = useCallback(async (filename: string, targetSelector?: string) => {
    setExporting(true)
    try {
      const target = (targetSelector
        ? document.querySelector(targetSelector)
        : document.querySelector('main')) as HTMLElement | null

      if (!target) throw new Error('No content found to export')

      // Neutralize oklch colors before capture
      const restore = neutralizeOklch(target)

      await new Promise((r) => requestAnimationFrame(() => r(null)))

      try {
        const canvas = await html2canvas(target, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: target.scrollWidth,
        })

        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF('p', 'mm', 'a4')
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()
        const imgWidth = pdfWidth
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        let heightLeft = imgHeight
        let position = 0

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight

        while (heightLeft > 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pdfHeight
        }

        pdf.save(filename)
      } finally {
        restore()
      }
    } catch (err) {
      console.error('PDF export failed:', err)
      throw err
    } finally {
      setExporting(false)
    }
  }, [])

  return { exportToPdf, exporting }
}
