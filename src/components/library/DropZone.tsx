import { useState, type ReactNode } from 'react'

interface DropZoneProps {
  children: ReactNode
  onDropPdf: (file: File) => void
  onDropImage?: (file: File) => void
  onDropImages?: (files: File[]) => void
  onDropFormaZip?: (file: File) => void
  onDropMarkdown?: (file: File) => void
}

export function DropZone({
  children,
  onDropPdf,
  onDropImage,
  onDropImages,
  onDropFormaZip,
  onDropMarkdown,
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
        for (const file of e.dataTransfer.files) {
          const name = file.name.toLowerCase()
          if (file.type === 'application/pdf' || name.endsWith('.pdf')) onDropPdf(file)
          else if (onDropFormaZip && (name.endsWith('.forma.zip') || name.endsWith('.forma'))) {
            onDropFormaZip(file)
          } else if (onDropMarkdown && name.endsWith('.md')) {
            onDropMarkdown(file)
          } else if (file.type.startsWith('image/')) images.push(file)
        }
        if (images.length > 1 && onDropImages) onDropImages(images)
        else if (images.length === 1 && onDropImage) onDropImage(images[0])
      }}
    >
      {over && (
        <div className="absolute inset-0 z-40 bg-forma-accent/20 border-4 border-dashed border-forma-accent flex items-center justify-center pointer-events-none">
          <p className="text-lg font-medium text-forma-accent">Déposer PDF, image, .md ou .forma.zip</p>
        </div>
      )}
      {children}
    </div>
  )
}
