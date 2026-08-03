import { useCallback, useState } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export function usePdfExport() {
  const [exporting, setExporting] = useState(false)

  const exportToPdf = useCallback(async (filename: string, targetSelector?: string) => {
    setExporting(true)
    try {
      // Find the target element — either a specific selector or the main content area
      const target = targetSelector
        ? document.querySelector(targetSelector) as HTMLElement
        : document.querySelector('main') as HTMLElement

      if (!target) {
        throw new Error('No content found to export')
      }

      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: getComputedStyle(document.body).backgroundColor || '#ffffff',
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
    } catch (err) {
      console.error('PDF export failed:', err)
      throw err
    } finally {
      setExporting(false)
    }
  }, [])

  return { exportToPdf, exporting }
}
