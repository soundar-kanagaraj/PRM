import { useCallback, useState } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas-pro'

function sanitizeCssValue(property: string, value: string): string {
  if (!value || value === 'initial' || value === 'inherit' || value === 'unset') {
    return ''
  }

  if (/(oklch|oklab|color-mix)/i.test(value)) {
    if (property.includes('color') || property.includes('fill') || property.includes('stroke')) {
      return '#111827'
    }
    if (property.includes('background') || property.includes('border')) {
      return 'transparent'
    }
    return ''
  }

  if (value.includes('var(')) {
    if (property.includes('color') || property.includes('fill') || property.includes('stroke')) {
      return '#111827'
    }
    if (property.includes('background') || property.includes('border')) {
      return 'transparent'
    }
    return ''
  }

  return value
}

function buildExportClone(root: HTMLElement): { clone: HTMLElement; cleanup: () => void } {
  const clone = root.cloneNode(true) as HTMLElement
  const wrapper = document.createElement('div')

  wrapper.style.position = 'fixed'
  wrapper.style.left = '-9999px'
  wrapper.style.top = '0'
  wrapper.style.zIndex = '-1'
  wrapper.style.width = `${Math.max(root.scrollWidth, root.offsetWidth, 1200)}px`
  wrapper.style.padding = '0'
  wrapper.style.margin = '0'
  wrapper.style.background = '#ffffff'
  wrapper.style.color = '#111827'
  wrapper.style.fontFamily = 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  wrapper.appendChild(clone)
  document.body.appendChild(wrapper)

  const originalNodes = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))]
  const clonedNodes = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>('*'))]

  clonedNodes.forEach((node, index) => {
    const original = originalNodes[index]
    if (!original) return

    node.removeAttribute('class')
    node.removeAttribute('id')

    const styleText = Array.from(window.getComputedStyle(original))
      .map((property) => {
        const value = sanitizeCssValue(property, window.getComputedStyle(original).getPropertyValue(property))
        return value ? `${property}: ${value};` : ''
      })
      .filter(Boolean)
      .join(' ')

    if (styleText) {
      node.setAttribute('style', styleText)
    } else {
      node.removeAttribute('style')
    }
  })

  clone.style.background = '#ffffff'
  clone.style.color = '#111827'

  return {
    clone: wrapper,
    cleanup: () => wrapper.remove(),
  }
}

export function usePdfExport() {
  const [exporting, setExporting] = useState(false)

  const exportToPdf = useCallback(async (filename: string, targetSelector?: string) => {
    setExporting(true)
    try {
      const target = (targetSelector
        ? document.querySelector(targetSelector)
        : document.querySelector('[data-export-root]')) as HTMLElement | null

      if (!target) throw new Error('No content found to export')

      const { clone, cleanup } = buildExportClone(target)

      await new Promise((r) => requestAnimationFrame(() => r(null)))

      try {
        const canvas = await html2canvas(clone, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: Math.max(target.scrollWidth, target.offsetWidth, 1200),
          height: target.scrollHeight,
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
        cleanup()
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
