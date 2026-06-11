import { useState, type ReactNode } from 'react'

interface DropZoneProps {
  children: ReactNode
  onDropPdf: (file: File) => void
  onDropImage?: (file: File) => void
  onDropImages?: (files: File[]) => void
  onDropFormaZip?: (file: File) => void
  onDropMarkdown?: (file: File) => void
  /** Plusieurs PDF déposés simultanément — traités séquentiellement avec progression. */
  onDropPdfs?: (files: File[]) => void
  /** Plusieurs .forma.zip déposés simultanément — traités séquentiellement avec progression. */
  onDropFormaZips?: (files: File[]) => void
}

export function DropZone({
  children,
  onDropPdf,
  onDropImage,
  onDropImages,
  onDropFormaZip,
  onDropMarkdown,
  onDropPdfs,
  onDropFormaZips,
}: DropZoneProps) {
  const [over, setOver] = useState(false)

  return (
    <div
      className="min-h-full flex flex-col relative"
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        const images: File[] = []
        const pdfs: File[] = []
        const formaZips: File[] = []
        for (const file of e.dataTransfer.files) {
          const name = file.name.toLowerCase()
          if (file.type === 'application/pdf' || name.endsWith('.pdf')) pdfs.push(file)
          else if (name.endsWith('.forma.zip') || name.endsWith('.forma')) formaZips.push(file)
          else if (onDropMarkdown && name.endsWith('.md')) onDropMarkdown(file)
          else if (file.type.startsWith('image/')) images.push(file)
        }
        if (pdfs.length > 1 && onDropPdfs) onDropPdfs(pdfs)
        else if (pdfs.length === 1) onDropPdf(pdfs[0])

        if (formaZips.length > 1 && onDropFormaZips) onDropFormaZips(formaZips)
        else if (formaZips.length === 1 && onDropFormaZip) onDropFormaZip(formaZips[0])

        if (images.length > 1 && onDropImages) onDropImages(images)
        else if (images.length === 1 && onDropImage) onDropImage(images[0])
      }}
    >
      {over && (
        <div className="absolute inset-0 z-40 bg-forma-accent/20 border-4 border-dashed border-forma-accent flex items-center justify-center pointer-events-none">
          <p className="text-lg font-medium text-forma-accent">Déposer PDF, image, .md ou .forma.zip (plusieurs fichiers acceptés)</p>
        </div>
      )}
      {children}
    </div>
  )
}
