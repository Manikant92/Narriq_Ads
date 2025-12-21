import { useState, useRef } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Plus, Trash2, GripVertical } from 'lucide-react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function TimelineEditor({ scenes, onScenesChange, totalDuration }) {
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [selectedScene, setSelectedScene] = useState(null)
  const timelineRef = useRef(null)

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleTimelineClick = (e) => {
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    setCurrentTime(percentage * totalDuration)
  }

  const getSceneAtTime = (time) => {
    let accumulated = 0
    for (const scene of scenes) {
      if (time >= accumulated && time < accumulated + scene.duration) {
        return scene
      }
      accumulated += scene.duration
    }
    return null
  }

  const handleSceneDurationChange = (sceneNumber, newDuration) => {
    const updatedScenes = scenes.map(scene => 
      scene.sceneNumber === sceneNumber 
        ? { ...scene, duration: Math.max(1, newDuration) }
        : scene
    )
    onScenesChange(updatedScenes)
  }

  const handleDeleteScene = (sceneNumber) => {
    const updatedScenes = scenes
      .filter(scene => scene.sceneNumber !== sceneNumber)
      .map((scene, index) => ({ ...scene, sceneNumber: index + 1 }))
    onScenesChange(updatedScenes)
  }

  const handleAddScene = () => {
    const newScene = {
      sceneNumber: scenes.length + 1,
      duration: 5,
      visualDescription: 'New scene',
      voiceover: '',
      transition: 'cut',
    }
    onScenesChange([...scenes, newScene])
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Preview area */}
      <div className="aspect-video bg-gray-900 relative">
        {selectedScene ? (
          <div className="absolute inset-0 flex items-center justify-center">
            {selectedScene.imageUrl ? (
              <img 
                src={selectedScene.imageUrl} 
                alt={`Scene ${selectedScene.sceneNumber}`}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-2">Scene {selectedScene.sceneNumber}</div>
                <div className="text-sm">{selectedScene.visualDescription}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            Select a scene to preview
          </div>
        )}

        {/* Time overlay */}
        <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/70 text-white rounded-lg text-sm font-mono">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTime(0)}
            className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setCurrentTime(totalDuration)}
            className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleAddScene}
            className="flex items-center gap-1 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Scene
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4">
        {/* Time ruler */}
        <div 
          ref={timelineRef}
          className="h-8 bg-gray-100 rounded-lg mb-3 relative cursor-pointer"
          onClick={handleTimelineClick}
        >
          {/* Time markers */}
          {Array.from({ length: Math.ceil(totalDuration / 5) + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 h-full flex flex-col items-center"
              style={{ left: `${(i * 5 / totalDuration) * 100}%` }}
            >
              <div className="w-px h-2 bg-gray-400" />
              <span className="text-xs text-gray-500 mt-1">{i * 5}s</span>
            </div>
          ))}

          {/* Playhead */}
          <motion.div
            className="absolute top-0 w-0.5 h-full bg-primary-600"
            style={{ left: `${(currentTime / totalDuration) * 100}%` }}
            animate={{ left: `${(currentTime / totalDuration) * 100}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary-600 rounded-full" />
          </motion.div>
        </div>

        {/* Scene tracks */}
        <div className="space-y-2">
          {/* Video track */}
          <div className="flex items-center gap-2">
            <div className="w-20 text-xs text-gray-500 font-medium">Video</div>
            <div className="flex-1 h-16 bg-gray-100 rounded-lg flex overflow-hidden">
              {scenes.map((scene, index) => {
                const widthPercent = (scene.duration / totalDuration) * 100
                return (
                  <motion.div
                    key={scene.sceneNumber}
                    className={clsx(
                      'h-full border-r border-white flex items-center justify-center cursor-pointer transition-colors relative group',
                      selectedScene?.sceneNumber === scene.sceneNumber
                        ? 'bg-primary-200'
                        : 'bg-primary-100 hover:bg-primary-150'
                    )}
                    style={{ width: `${widthPercent}%` }}
                    onClick={() => setSelectedScene(scene)}
                    layout
                  >
                    <GripVertical className="w-3 h-3 text-primary-400 absolute left-1 opacity-0 group-hover:opacity-100 cursor-grab" />
                    <span className="text-xs font-medium text-primary-700 truncate px-2">
                      Scene {scene.sceneNumber}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteScene(scene.sceneNumber)
                      }}
                      className="absolute right-1 p-1 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Audio track */}
          <div className="flex items-center gap-2">
            <div className="w-20 text-xs text-gray-500 font-medium">Audio</div>
            <div className="flex-1 h-10 bg-gray-100 rounded-lg flex overflow-hidden">
              {scenes.map((scene) => {
                const widthPercent = (scene.duration / totalDuration) * 100
                return (
                  <div
                    key={`audio-${scene.sceneNumber}`}
                    className="h-full border-r border-white bg-green-100 flex items-center justify-center"
                    style={{ width: `${widthPercent}%` }}
                  >
                    {scene.voiceover && (
                      <div className="w-full h-4 mx-1 bg-green-300 rounded-sm" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Scene details */}
      {selectedScene && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Scene {selectedScene.sceneNumber}</h4>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">Duration:</label>
              <input
                type="number"
                min="1"
                max="30"
                value={selectedScene.duration}
                onChange={(e) => handleSceneDurationChange(selectedScene.sceneNumber, parseInt(e.target.value))}
                className="w-16 px-2 py-1 border border-gray-200 rounded text-sm"
              />
              <span className="text-sm text-gray-500">sec</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-gray-500 mb-1">Visual</label>
              <p className="text-gray-700">{selectedScene.visualDescription}</p>
            </div>
            <div>
              <label className="block text-gray-500 mb-1">Voiceover</label>
              <p className="text-gray-700">{selectedScene.voiceover || 'No voiceover'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
