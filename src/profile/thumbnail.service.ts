import { Injectable, Logger } from '@nestjs/common'
import { createCanvas } from 'canvas'
import type { Canvas } from 'canvas'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'

// 3× the native PDF resolution (72dpi × 3 = 216dpi) — crisp on retina displays
const THUMBNAIL_SCALE = 3.0
const THUMBNAIL_CONTENT_TYPE = 'image/png'

// pdfjs-dist needs a canvas factory in Node.js to render images embedded in PDFs
class NodeCanvasFactory {
  create(width: number, height: number) {
    const canvas = createCanvas(width, height)
    return { canvas, context: canvas.getContext('2d') }
  }

  reset(canvasAndContext: { canvas: Canvas }, width: number, height: number) {
    canvasAndContext.canvas.width = width
    canvasAndContext.canvas.height = height
  }

  destroy(canvasAndContext: { canvas: Canvas }) {
    canvasAndContext.canvas.width = 0
    canvasAndContext.canvas.height = 0
  }
}

@Injectable()
export class ThumbnailService {
  private readonly logger = new Logger(ThumbnailService.name)

  async generateFromPdfBuffer(pdfBuffer: Buffer): Promise<Buffer> {
    const data = new Uint8Array(pdfBuffer)
    const canvasFactory = new NodeCanvasFactory()

    const doc = await pdfjs.getDocument({
      data,
      canvasFactory,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise

    const page = await doc.getPage(1)
    const viewport = page.getViewport({ scale: THUMBNAIL_SCALE })

    const canvas = createCanvas(Math.floor(viewport.width), Math.floor(viewport.height))
    const ctx = canvas.getContext('2d')

    await page.render({
      canvasContext: ctx as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise

    await doc.destroy()

    return canvas.toBuffer(THUMBNAIL_CONTENT_TYPE)
  }

  get contentType() {
    return THUMBNAIL_CONTENT_TYPE
  }
}
