import JSZip from "jszip"

export type Template = {
  name: string
  width: number
  height: number
  painted: number
}

export type Options = {
  template: string
  column: number
  gapY: number
  gapX: number
  paddingY: number
  paddingX: number
  bgColor: string
  numStart: number
  numPosition: string
  numSize: number
  numColor: string
}

export type Tile = {
  width: number
  height: number
  max: number
}

export const templates: { [key: string]: Template } = {
  a4: {
    name: "A4",
    width: 2976,
    height: 4175,
    painted: 44,
  },
  a5: {
    name: "A5",
    width: 2122,
    height: 2976,
    painted: 44,
  },
  a6: {
    name: "A6",
    width: 1530,
    height: 2122,
    painted: 44,
  },
  b5: {
    name: "B5",
    width: 2591,
    height: 3624,
    painted: 44,
  },
  b6: {
    name: "B6",
    width: 1846,
    height: 2591,
    painted: 44,
  },
}

export const defaultOptions: Options = {
  template: "a4",
  column: 2,
  gapY: 32,
  gapX: 32,
  paddingY: 100,
  paddingX: 100,
  bgColor: "#ffffff",
  numStart: 1,
  numPosition: "right-bottom",
  numSize: 36,
  numColor: "#6c6c6c",
}

export const counts = [
  "column",
  "gapY",
  "gapX",
  "paddingY",
  "paddingX",
  "numStart",
  "numSize",
]
export const zeroCounts = ["gapY", "gapX", "paddingY", "paddingX"]

const imageExts = ["jpg", "jpeg", "png", "gif"]

export function filterImageFiles(files: File[]) {
  return files.filter((file) => {
    const ext = file.name.split(".").pop()
    return imageExts.includes(ext)
  })
}

export function fixMinCount(value: number, min: number) {
  const count = Math.floor(value)
  return count > min ? count : min
}

export async function getPerHeight(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const aspectRatio = img.height / img.width
        resolve(aspectRatio)
      }
      img.onerror = (err) => reject(err)
      img.src = reader.result as string
    }
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}

export function calcTile(
  template: Template,
  options: Options,
  imagePerHeight: number
): Tile {
  const { width, height, painted } = template
  const { column, gapY, gapX, paddingY, paddingX } = options
  const areaWidth = width - painted * 2 - paddingX * 2
  const areaHeight = height - painted * 2 - paddingY * 2
  const gapXCount = column - 1 < 0 ? 0 : column - 1
  const tileWidth = Math.floor((areaWidth - gapX * gapXCount) / column)
  const tileHeight = tileWidth * imagePerHeight
  const unUseGapRow = Math.floor(areaHeight / tileHeight)
  const gapYCount = unUseGapRow - 1 < 0 ? 0 : unUseGapRow - 1
  const useGapRow = Math.floor((areaHeight - gapY * gapYCount) / tileHeight)
  const max = column * useGapRow
  return { width: tileWidth, height: tileHeight, max }
}

export async function generateAlbum(
  files: File[],
  options: Options,
  tile: Tile,
  isSingle: boolean
) {
  const template = templates[options.template]
  const { width: canvasWidth, height: canvasHeight, painted } = template
  const {
    column,
    gapY,
    gapX,
    paddingY,
    paddingX,
    bgColor,
    numStart,
    numPosition,
    numSize,
    numColor,
  } = options
  const { width: tileWidth, height: tileHeight, max } = tile

  const zip = new JSZip()
  const pageCount = isSingle ? 1 : Math.ceil(files.length / max)
  const startRight = numPosition === "right-bottom"
  const progressElement = document.getElementById("progress")
  const buttons = document.querySelectorAll(".button.is-generate")
  buttons.forEach((button) => button.setAttribute("disabled", "true"))

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    const startIndex = pageIndex * max
    const pageFiles = files.slice(startIndex, startIndex + max)

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (let i = 0; i < pageFiles.length; i++) {
      const file = pageFiles[i]
      const col = i % column
      const row = Math.floor(i / column)

      const x = painted + paddingX + col * (tileWidth + gapX)
      const y = painted + paddingY + row * (tileHeight + gapY)

      const img = new Image()
      const url = URL.createObjectURL(file)

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, x, y, tileWidth, tileHeight)
          URL.revokeObjectURL(url)
          resolve()
        }
        img.onerror = reject
        img.src = url
      })
    }

    const isRight = startRight ? pageIndex % 2 === 0 : pageIndex % 2 !== 0
    const textX = isRight ? canvasWidth - painted * 2 : painted * 2
    const textY = canvasHeight - painted * 2

    ctx.fillStyle = numColor
    ctx.font = `bold ${numSize}px sans-serif`
    ctx.textAlign = isRight ? "right" : "left"
    ctx.fillText(String(numStart + pageIndex), textX, textY)

    const pageBlob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((blob) => resolve(blob!))
    )
    const pageFileName = `page_${pageIndex + 1}.png`

    if (isSingle && pageIndex === 0) {
      const link = document.createElement("a")
      link.href = URL.createObjectURL(pageBlob)
      link.download = pageFileName
      link.click()
      URL.revokeObjectURL(link.href)

      buttons.forEach((button) => button.removeAttribute("disabled"))
      return
    } else {
      zip.file(pageFileName, pageBlob)
    }

    if (progressElement) {
      const progressPercentage = Math.round(((pageIndex + 1) / pageCount) * 100)
      progressElement.textContent = `進捗: ${progressPercentage}% (${
        pageIndex + 1
      }/${pageCount}ページ)`
    }
  }

  if (!isSingle) {
    const zipBlob = await zip.generateAsync({ type: "blob" })
    const zipUrl = URL.createObjectURL(zipBlob)
    const zipLink = document.createElement("a")
    zipLink.href = zipUrl
    zipLink.download = "album.zip"
    zipLink.click()
    URL.revokeObjectURL(zipUrl)
  }

  buttons.forEach((button) => button.removeAttribute("disabled"))

  if (progressElement) {
    progressElement.textContent = "完了しました！"
  }
}
