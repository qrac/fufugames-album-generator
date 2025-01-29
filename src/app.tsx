import { useState, useRef, useEffect, Fragment } from "react"
import { SiGithub } from "react-icons/si"
import { FiImage } from "react-icons/fi"
import { clsx } from "clsx"

import type { Options, Tile } from "./utils"
import {
  templates,
  defaultOptions,
  counts,
  zeroCounts,
  filterImageFiles,
  fixMinCount,
  getPerHeight,
  calcTile,
  generateAlbum,
} from "./utils"

import "./app.css"
import { version, repository } from "../package.json"

export default function App() {
  const [images, setImages] = useState<File[]>([])
  const [options, setOptions] = useState<Options>(defaultOptions)
  const [isDragging, setIsDragging] = useState(false)
  const [imagePerHeight, setImagePerHeight] = useState<number | null>(null)
  const [tile, setTile] = useState<Tile | null>(null)
  const inputFileRef = useRef<HTMLInputElement>(null)

  const template = templates[options.template]
  const zeroTileMax = tile?.max || 0
  const pageAll = Math.floor(images.length / zeroTileMax) + 1
  const pageTileMax = zeroTileMax > images.length ? images.length : zeroTileMax
  const preHeight = "27.5vh"
  const prePerWidth = template.width / template.height
  const prePerPaddingY = (options.paddingY + template.painted) / template.height
  const prePerPaddingX = (options.paddingX + template.painted) / template.width
  const prePerGapY = options.gapY / template.height
  const prePerGapX = options.gapX / template.width
  const prePerNumSize = options.numSize / template.height
  const prePerNumPosition = (template.painted * 2) / template.height
  const preCalcPaddingY = `calc(${preHeight} * ${prePerPaddingY})`
  const preCalcPaddingX = `calc(${preHeight} * ${prePerWidth} * ${prePerPaddingX})`
  const preCalcGapY = `calc(${preHeight} * ${prePerGapY})`
  const preCalcGapX = `calc(${preHeight} * ${prePerWidth} * ${prePerGapX})`
  const preCalcNumSize = `calc(${preHeight} * ${prePerNumSize})`
  const preCalcNumPosition = `calc(${preHeight} * ${prePerNumPosition})`
  const datasetHeight = "20vh"
  const isReady = images.length > 0 && tile !== null

  async function addImages(files: File[]) {
    const imageFiles = filterImageFiles(files)
    if (imageFiles.length === 0) return
    if (imagePerHeight === null) {
      const newImagePerHeight = await getPerHeight(imageFiles[0])
      setImagePerHeight(newImagePerHeight)
    }
    setImages([...images, ...imageFiles])
  }

  async function handleSetFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...e.target.files]
    await addImages(files)
    inputFileRef.current!.value = ""
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const files = [...e.dataTransfer.files]
    await addImages(files)
    setIsDragging(false)
    e.dataTransfer.clearData()
  }

  function handleClearFiles() {
    setImages([])
    setImagePerHeight(null)
    setTile(null)
  }

  function handleSetOptions(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target

    if (counts.includes(name)) {
      const min = zeroCounts.includes(name) ? 0 : 1
      const count = fixMinCount(parseInt(value), min)
      setOptions({ ...options, [name]: count })
    } else {
      setOptions({ ...options, [name]: value })
    }
  }

  async function handleGenerateSingle() {
    await generateAlbum(images, options, tile, true)
  }

  async function handleGenerateAll() {
    await generateAlbum(images, options, tile, false)
  }

  useEffect(() => {
    if (imagePerHeight === null) return
    const tile = calcTile(template, options, imagePerHeight)
    setTile(tile)
  }, [options, imagePerHeight])
  return (
    <div className="app">
      <header className="box is-flex is-middle is-between is-nowrap is-gap-x-md is-px-lg is-py-md is-outline-bottom">
        <div className="box is-flex is-baseline is-gap-x-sm">
          <h1 className="text is-primary is-weight-900">
            <span className="text">アルバムジェネレーター </span>
            <span className="text is-xs">for pixivFactory</span>
          </h1>
          <p className="text is-xs">v{version}</p>
        </div>
        <div className="box is-flex is-middle">
          <a
            href={repository.url}
            target="_blank"
            className="box is-flex is-middle"
          >
            <SiGithub className="icon is-lg" />
          </a>
        </div>
      </header>
      <aside className="box is-p-lg is-outline-bottom is-space-md">
        <div className="box is-flex is-gap-xl is-sm">
          <div className="box is-flex is-middle is-gap-sm">
            <label className="box is-flex is-middle is-gap-xs">
              <span className="text is-weight-600 is-palt">サイズ</span>
              <div className="select is-plain">
                <select
                  name="template"
                  value={options.template}
                  onChange={handleSetOptions}
                >
                  {Object.entries(templates).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.name}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>
          <div className="box is-flex is-middle is-gap-sm">
            <label className="box is-flex is-middle is-gap-xs">
              <span className="text is-weight-600 is-palt">横並びの画像数</span>
              <input
                className="input is-plain is-width-5em"
                type="number"
                name="column"
                value={options.column}
                min={1}
                onChange={handleSetOptions}
              />
            </label>
          </div>
          <div className="box is-flex is-middle is-gap-sm">
            <label className="box is-flex is-middle is-gap-xs">
              <span className="text is-weight-600 is-palt">溝の縦幅（px）</span>
              <input
                className="input is-plain is-width-5em"
                type="number"
                name="gapY"
                value={options.gapY}
                min={0}
                onChange={handleSetOptions}
              />
            </label>
          </div>
          <div className="box is-flex is-middle is-gap-sm">
            <label className="box is-flex is-middle is-gap-xs">
              <span className="text is-weight-600 is-palt">溝の横幅（px）</span>
              <input
                className="input is-plain is-width-5em"
                type="number"
                name="gapX"
                value={options.gapX}
                min={0}
                onChange={handleSetOptions}
              />
            </label>
          </div>
          <div className="box is-flex is-middle is-gap-sm">
            <label className="box is-flex is-middle is-gap-xs">
              <span className="text is-weight-600 is-palt">
                上下の余白（px）
              </span>
              <input
                className="input is-plain is-width-5em"
                type="number"
                name="paddingY"
                value={options.paddingY}
                min={0}
                onChange={handleSetOptions}
              />
            </label>
          </div>
          <div className="box is-flex is-middle is-gap-sm">
            <label className="box is-flex is-middle is-gap-xs">
              <span className="text is-weight-600 is-palt">
                左右の余白（px）
              </span>
              <input
                className="input is-plain is-width-5em"
                type="number"
                name="paddingX"
                value={options.paddingX}
                min={0}
                onChange={handleSetOptions}
              />
            </label>
          </div>
        </div>
        <div className="box is-flex is-gap-xl is-sm">
          <div className="box is-flex is-middle is-gap-sm">
            <label className="box is-flex is-middle is-gap-xs">
              <span className="text is-weight-600 is-palt">背景色</span>
              <input
                type="color"
                name="bgColor"
                value={options.bgColor}
                onChange={handleSetOptions}
              />
            </label>
          </div>
          <div className="box is-flex is-middle is-gap-sm">
            <label className="box is-flex is-middle is-gap-xs">
              <span className="text is-weight-600 is-palt">
                最初のページ番号
              </span>
              <input
                className="input is-plain is-width-5em"
                type="number"
                name="numStart"
                value={options.numStart}
                min={1}
                max={300}
                onChange={handleSetOptions}
              />
            </label>
          </div>
          <div className="box is-flex is-middle is-gap-sm">
            <span className="text is-weight-600 is-palt">
              最初のページ番号の位置
            </span>
            <label className="box is-flex is-middle is-gap-xxs">
              <input
                type="radio"
                name="numPosition"
                value="left-bottom"
                checked={options.numPosition === "left-bottom"}
                onChange={handleSetOptions}
              />
              <span className="text">左下</span>
            </label>
            <label className="box is-flex is-middle is-gap-xxs">
              <input
                type="radio"
                name="numPosition"
                value="right-bottom"
                checked={options.numPosition === "right-bottom"}
                onChange={handleSetOptions}
              />
              <span className="text">右下</span>
            </label>
          </div>
          <div className="box is-flex is-middle is-gap-sm">
            <label className="box is-flex is-middle is-gap-xs">
              <span className="text is-weight-600 is-palt">
                ページ番号のサイズ（px）
              </span>
              <input
                className="input is-plain is-width-5em"
                type="number"
                name="numSize"
                value={options.numSize}
                min={1}
                onChange={handleSetOptions}
              />
            </label>
          </div>
          <div className="box is-flex is-middle is-gap-sm">
            <label className="box is-flex is-middle is-gap-xs">
              <span className="text is-weight-600 is-palt">ページ番号の色</span>
              <input
                type="color"
                name="numColor"
                value={options.numColor}
                onChange={handleSetOptions}
              />
            </label>
          </div>
        </div>
      </aside>
      <main className="box is-grid is-rows-auto-1fr is-bg-2 is-gap-lg is-p-lg">
        <div className="box is-space-lg">
          <div
            className={clsx("selection", isDragging && "is-over")}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="box is-space-sm">
              <p className="text is-center is-mono is-sm">Drag and Drop Area</p>
              <div className="box is-flex is-middle is-gap-xs">
                <input
                  className="button is-outline is-sm"
                  type="button"
                  value={
                    images.length === 0
                      ? "画像ファイルを選択"
                      : "画像ファイルを追加"
                  }
                  onClick={() => inputFileRef.current?.click()}
                />
                <input
                  type="file"
                  style={{ display: "none" }}
                  multiple
                  ref={inputFileRef}
                  onChange={handleSetFiles}
                />
              </div>
            </div>
          </div>
          {isReady && (
            <div className="alert">
              <div className="box is-flex is-baseline is-gap-x-sm">
                <span className="text is-palt is-sm">
                  {template.name}
                  {` （${template.width}px x ${template.height}px）`},
                </span>
                <span className="text is-sm">全{pageAll}ページ,</span>
                <span className="text is-sm">
                  画像総数：
                  {images.length}枚,
                </span>
                <span className="text is-sm">
                  ページ内の画像数：最大
                  {pageTileMax}枚,
                </span>
                <span className="text is-sm">
                  ※1枚目の画像サイズを元にレイアウトを作成します
                </span>
              </div>
            </div>
          )}
        </div>
        {isReady && (
          <div className="box is-grid is-columns-1fr-1fr is-gap-lg">
            <div className="box is-grid">
              <div
                className="preview"
                style={{
                  height: preHeight,
                  padding: `${preCalcPaddingY} ${preCalcPaddingX}`,
                  backgroundColor: options.bgColor,
                  aspectRatio: `${template.width} / ${template.height}`,
                }}
              >
                <ul
                  className="preview-items"
                  style={{
                    gridTemplateColumns: `repeat(${options.column}, 1fr)`,
                    rowGap: preCalcGapY,
                    columnGap: preCalcGapX,
                  }}
                >
                  {Array.from({ length: pageTileMax }).map((_, i) => (
                    <li
                      className="preview-item"
                      key={i}
                      style={{ aspectRatio: `${tile.width} / ${tile.height}` }}
                    >
                      <FiImage className="preview-item-icon" />
                    </li>
                  ))}
                </ul>
                <span
                  className="preview-num"
                  style={{
                    bottom: preCalcNumPosition,
                    right:
                      options.numPosition === "right-bottom"
                        ? preCalcNumPosition
                        : undefined,
                    left:
                      options.numPosition === "left-bottom"
                        ? preCalcNumPosition
                        : undefined,
                    color: options.numColor,
                    fontSize: preCalcNumSize,
                    textAlign:
                      options.numPosition === "right-bottom" ? "right" : "left",
                  }}
                >
                  {options.numStart}
                </span>
              </div>
            </div>
            <div className="box">
              <div className="dataset">
                <div
                  className="dataset-list"
                  style={{ maxHeight: datasetHeight }}
                >
                  <ul className="text is-sm">
                    {images.map((image, i) => {
                      const pageIndex = Math.floor(i / pageTileMax) + 1
                      const isFirstImageInPage = i % 10 === 0
                      return (
                        <Fragment key={i}>
                          {isFirstImageInPage && (
                            <p className="text is-dark-4 is-palt">
                              ページ（{pageIndex}）
                            </p>
                          )}
                          <p>{image.name}</p>
                        </Fragment>
                      )
                    })}
                  </ul>
                </div>
                <div className="dataset-footer">
                  <div className="box is-flex is-p-md">
                    <button
                      className="button is-outline is-danger is-flex-full is-xs"
                      type="button"
                      onClick={handleClearFiles}
                    >
                      画像ファイルをクリア
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <footer className="box">
        {isReady && (
          <div className="box is-flex is-middle is-gap-md is-p-lg is-outline-top">
            <div className="box is-flex-0" />
            <div className="box is-flex is-middle is-center is-gap-xs">
              <button
                className="button is-generate is-plain is-primary"
                type="button"
                onClick={handleGenerateSingle}
              >
                1ページ目をテスト生成
              </button>
              <button
                className="button is-generate is-plain is-primary"
                type="button"
                onClick={handleGenerateAll}
              >
                全ページをZipで生成
              </button>
            </div>
            <div className="box is-flex is-middle is-flex-0">
              <p id="progress" className="text is-palt is-sm" />
            </div>
          </div>
        )}
      </footer>
    </div>
  )
}
