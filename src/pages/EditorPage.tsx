import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const DEFAULT_TITLE = 'Happy Anniversary 3Years'
const DEFAULT_NOTE = [
  'Lorem ipsum dolor sit amet.',
  'Consectetur adipiscing elit.',
  'A little note written with love.',
  'Happy anniversary, always. ♡',
].join('\n')

const MAX_TITLE = 40
const MAX_NOTE = 200

export function EditorPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState(DEFAULT_TITLE)
  const [noteText, setNoteText] = useState(DEFAULT_NOTE)
  const [cardPreviews, setCardPreviews] = useState<string[]>(['', '', ''])
  const [mainPreview, setMainPreview] = useState('')
  const cardFiles = useRef<(File | null)[]>([null, null, null])
  const mainFile = useRef<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [toast, setToast] = useState('')

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(id)
  }, [toast])

  const showToast = (msg: string) => setToast(msg)

  const checkImageSize = (file: File, reqW: number, reqH: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(img.src)
        if (img.naturalWidth !== reqW || img.naturalHeight !== reqH) {
          showToast(`Image must be exactly ${reqW}×${reqH}px. Yours is ${img.naturalWidth}×${img.naturalHeight}px.`)
          resolve(false)
        } else {
          resolve(true)
        }
      }
      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        showToast('Failed to read image.')
        resolve(false)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const handleCardImage = async (index: number, file: File) => {
    const ok = await checkImageSize(file, 260, 380)
    if (!ok) return
    cardFiles.current[index] = file
    const url = URL.createObjectURL(file)
    setCardPreviews((prev) => {
      const next = [...prev]
      next[index] = url
      return next
    })
  }

  const handleMainPhoto = async (file: File) => {
    const ok = await checkImageSize(file, 320, 320)
    if (!ok) return
    mainFile.current = file
    setMainPreview(URL.createObjectURL(file))
  }

  const handleCreate = async () => {
    // Validation
    const missingCards = cardFiles.current
      .map((f, i) => (f === null ? i + 1 : null))
      .filter(Boolean)
    if (missingCards.length > 0) {
      showToast(`Please upload Card ${missingCards.join(', ')} photo${missingCards.length > 1 ? 's' : ''}.`)
      return
    }
    if (!mainFile.current) {
      showToast('Please upload the Main Photo.')
      return
    }
    if (!title.trim()) {
      showToast('Please enter a Card Title.')
      return
    }
    if (!noteText.trim()) {
      showToast('Please enter a Card Message.')
      return
    }

    setIsGenerating(true)
    try {
      // Convert files to data URLs for draft storage
      const toDataUrl = (file: File): Promise<string> =>
        new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })

      const cardBlobs = await Promise.all(cardFiles.current.map((f) => toDataUrl(f!)))
      const mainBlob = await toDataUrl(mainFile.current!)

      const draft = {
        title: title.slice(0, MAX_TITLE),
        noteText: noteText.slice(0, MAX_NOTE),
        cardFiles: cardPreviews,
        mainFile: mainPreview,
        cardBlobs,
        mainBlob,
      }
      localStorage.setItem('cute-template-draft', JSON.stringify(draft))
      navigate('/customize')
    } catch (err) {
      console.error(err)
      showToast('Failed to process. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff5f9] via-[#ffe4ef] to-white font-sans text-blossom-900 antialiased">
      <div className="mx-auto max-w-lg px-5 py-6">
        {/* Navbar */}
        <nav className="mb-6 flex items-center">
          <Link
            to="/"
            className="flex items-center gap-1 rounded-full bg-white/80 px-3.5 py-2 text-sm font-semibold text-blossom-500 shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="text-lg">←</span> Back
          </Link>
          <h1 className="flex-1 text-center font-display text-xl font-bold text-blossom-600 sm:text-2xl">
            Customize Your Card ♡
          </h1>
          <div className="w-[4.5rem]" />
        </nav>

        {/* Title */}
        <div className="mb-1.5 flex items-baseline justify-between">
          <label className="text-sm font-semibold text-blossom-600">Card Title</label>
          <span className={`text-[11px] font-medium ${title.length > MAX_TITLE - 5 ? 'text-red-400' : 'text-blossom-300'}`}>
            {title.length}/{MAX_TITLE}
          </span>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
          maxLength={MAX_TITLE}
          className="mb-5 w-full rounded-2xl border-2 border-blossom-200 bg-white/80 px-4 py-3 text-base font-medium text-blossom-800 outline-none backdrop-blur-sm transition focus:border-blossom-400 focus:ring-2 focus:ring-blossom-200"
          placeholder="Happy Anniversary 3Years"
        />

        {/* Note Text */}
        <div className="mb-1.5 flex items-baseline justify-between">
          <label className="text-sm font-semibold text-blossom-600">Card Message</label>
          <span className={`text-[11px] font-medium ${noteText.length > MAX_NOTE - 20 ? 'text-red-400' : 'text-blossom-300'}`}>
            {noteText.length}/{MAX_NOTE}
          </span>
        </div>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value.slice(0, MAX_NOTE))}
          maxLength={MAX_NOTE}
          rows={4}
          className="mb-5 w-full resize-none rounded-2xl border-2 border-blossom-200 bg-white/80 px-4 py-3 text-base font-medium text-blossom-800 outline-none backdrop-blur-sm transition focus:border-blossom-400 focus:ring-2 focus:ring-blossom-200"
          placeholder="Write your message..."
        />

        {/* Card Images */}
        <label className="mb-2 block text-sm font-semibold text-blossom-600">
          Card Photos
        </label>
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <ImageUploader
              key={i}
              label={`Card ${i + 1}`}
              preview={cardPreviews[i]}
              onFile={(f) => handleCardImage(i, f)}
            />
          ))}
        </div>

        {/* Main Photo */}
        <label className="mb-2 block text-sm font-semibold text-blossom-600">
          Main Photo
        </label>
        <div className="mb-8">
          <ImageUploader
            label="Main Photo"
            preview={mainPreview}
            onFile={handleMainPhoto}
            large
          />
        </div>

        {/* Button */}
        <button
          onClick={handleCreate}
          disabled={isGenerating}
          className="w-full rounded-full bg-gradient-to-r from-blossom-500 to-blossom-600 px-8 py-4 text-base font-bold tracking-wide text-white shadow-lg shadow-blossom-300/40 transition hover:-translate-y-1 hover:shadow-xl disabled:opacity-50"
        >
          {isGenerating ? 'Processing...' : 'Next: Customize Color 🎨'}
        </button>
      </div>

      {/* ═══ Toast Notification ═══ */}
      {toast && (
        <div className="fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
          <div className="animate-[popup_0.25s_ease-out] rounded-2xl bg-white px-5 py-3 shadow-lg shadow-blossom-300/20 border border-blossom-200">
            <p className="text-sm font-medium text-blossom-700">⚠️ {toast}</p>
          </div>
        </div>
      )}

    </div>
  )
}

// ─── Image Upload Component ───────────────────────────────────
function ImageUploader({
  label,
  preview,
  onFile,
  large,
}: {
  label: string
  preview: string
  onFile: (file: File) => void
  large?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) onFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-blossom-200 bg-white/60 transition hover:border-blossom-400 hover:bg-white/80 ${
        large ? 'aspect-square w-full max-w-[10rem]' : 'aspect-square'
      }`}
    >
      {preview ? (
        <img src={preview} alt={label} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-0.5 p-2">
          <span className="text-xl text-blossom-300 transition group-hover:text-blossom-400">📷</span>
          <span className="text-[10px] font-semibold text-blossom-400">{label}</span>
          <span className="text-[9px] font-medium text-blossom-500">
            {label === 'Main Photo' ? '320×320px' : '260×380px'}
          </span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}
