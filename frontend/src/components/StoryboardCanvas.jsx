import { useRef, useState, useEffect, useCallback } from 'react'
import { Pencil, Eraser, Undo, Redo, Trash2, Wand2, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { convertSketchToStoryboard } from '../api/projects'

const TOOLS = {
  PENCIL: 'pencil',
  ERASER: 'eraser',
}

export default function StoryboardCanvas({ onStoryboardGenerated }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState(TOOLS.PENCIL)
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isConverting, setIsConverting] = useState(false)
  const [generatedStoryboard, setGeneratedStoryboard] = useState(null)
  const [error, setError] = useState(null)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height)
    
    // Save initial state
    saveToHistory()
  }, [])

  const drawGrid = (ctx, width, height) => {
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1

    // Draw vertical lines (divide into 4 panels)
    const panelWidth = width / 4
    for (let i = 1; i < 4; i++) {
      ctx.beginPath()
      ctx.moveTo(panelWidth * i, 0)
      ctx.lineTo(panelWidth * i, height)
      ctx.stroke()
    }

    // Draw horizontal center line
    ctx.beginPath()
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
    ctx.stroke()

    // Add panel numbers
    ctx.fillStyle = '#9ca3af'
    ctx.font = '14px sans-serif'
    for (let i = 0; i < 4; i++) {
      ctx.fillText(`Scene ${i + 1}`, panelWidth * i + 10, 25)
    }
  }

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const imageData = canvas.toDataURL()
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(imageData)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])

  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    setIsDrawing(true)
    const { x, y } = getCoordinates(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e) => {
    if (!isDrawing) return
    e.preventDefault()

    const { x, y } = getCoordinates(e)
    const ctx = canvasRef.current.getContext('2d')

    if (tool === TOOLS.ERASER) {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = strokeWidth * 3
    } else {
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = strokeWidth
    }

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      saveToHistory()
    }
  }

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      loadFromHistory(history[newIndex])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      loadFromHistory(history[newIndex])
    }
  }

  const loadFromHistory = (imageData) => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
    }
    img.src = imageData
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    drawGrid(ctx, canvas.width, canvas.height)
    saveToHistory()
  }

  const convertToStoryboard = async () => {
    setIsConverting(true)
    setError(null)
    try {
      const canvas = canvasRef.current
      const imageData = canvas.toDataURL('image/png')
      
      const result = await convertSketchToStoryboard({
        imageData,
        hints: { duration: 5 },
      })
      
      setGeneratedStoryboard(result.storyboard)
      onStoryboardGenerated?.(result.storyboard)
    } catch (err) {
      console.error('Failed to convert sketch:', err)
      setError(err.message || 'Failed to generate storyboard')
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          {/* Tools */}
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setTool(TOOLS.PENCIL)}
              className={clsx(
                'p-2 rounded-md transition-colors',
                tool === TOOLS.PENCIL ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool(TOOLS.ERASER)}
              className={clsx(
                'p-2 rounded-md transition-colors',
                tool === TOOLS.ERASER ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Color picker */}
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-gray-200"
          />

          {/* Stroke width */}
          <input
            type="range"
            min="1"
            max="10"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            className="w-20 accent-primary-600"
          />

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 mx-2" />

          {/* History */}
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Redo className="w-4 h-4" />
          </button>
          <button
            onClick={clearCanvas}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Convert button */}
        <button
          onClick={convertToStoryboard}
          disabled={isConverting}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium text-sm"
        >
          {isConverting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Converting...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Generate Storyboard
            </>
          )}
        </button>
      </div>

      {/* Canvas */}
      <div className="p-4 bg-gray-100">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full bg-white rounded-lg shadow-inner cursor-crosshair canvas-container"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* Instructions */}
      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <p className="text-sm text-gray-500 text-center">
          Sketch your storyboard panels, then click "Generate Storyboard" to convert to scenes.
          Use arrows to indicate camera motion.
        </p>
      </div>
    </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Generated Storyboard Result */}
      {generatedStoryboard && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Storyboard</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedStoryboard.scenes?.map((scene, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Scene {scene.sceneNumber}</span>
                  <span className="text-sm text-gray-500">{scene.duration}s</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{scene.visualDescription}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded">
                    {scene.cameraMotion}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    {scene.transition}
                  </span>
                  {scene.textOverlay && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                      "{scene.textOverlay}"
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
            <span>Total Duration: {generatedStoryboard.totalDuration}s</span>
            <span>Mood: {generatedStoryboard.mood}</span>
          </div>
        </div>
      )}
    </div>
  )
}
