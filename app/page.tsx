'use client'

import { useRef, useState } from 'react'
import { GIFEncoder, applyPalette, quantize } from 'gifenc'
import { Download, Layers3, Sparkles, Upload } from 'lucide-react'

const schoolLogo = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/jardin%20logo%20sin%20fondo-JNCPdjU8d1UvL3seKh9ooL1J0B628c.png'
const rightsPatch = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Parche%20bordado%20arco%C3%ADris%20_Yo%20tengo%20derechos_-gwYRYZ9VPvcAx3p2qvTAF5sdmO54t0.png'

type Style = 'alegre' | 'teatral' | 'misteriosa' | 'stop' | 'color' | 'fiesta' | 'zoom' | 'rebote' | 'brillo' | 'vibracion'
const styles: { id: Style; label: string; description: string }[] = [
  { id: 'alegre', label: 'Alegre', description: 'Balanceo y zoom rítmico' },
  { id: 'teatral', label: 'Teatral', description: 'Inclinaciones expresivas' },
  { id: 'misteriosa', label: 'Misteriosa', description: 'Pulso lento y sutil' },
  { id: 'stop', label: 'Stop motion', description: 'Saltos artesanales' },
  { id: 'color', label: 'Color', description: 'Cambios de tono vibrantes' },
  { id: 'fiesta', label: 'Fiesta', description: 'Destellos y rebote' },
  { id: 'zoom', label: 'Zoom', description: 'Acercamiento cinematográfico' },
  { id: 'rebote', label: 'Rebote', description: 'Sube y baja suavemente' },
  { id: 'brillo', label: 'Brillo', description: 'Luz y contraste animados' },
  { id: 'vibracion', label: 'Vibración', description: 'Movimiento energético' },
]

export default function Page() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [course, setCourse] = useState('')
  const [garden, setGarden] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [generatedImageReady, setGeneratedImageReady] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [style, setStyle] = useState<Style>('alegre')
  const [intensity, setIntensity] = useState(55)
  const [progress, setProgress] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [isGeneratingMask, setIsGeneratingMask] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  const handleFile = async (file?: File) => {
    if (!file?.type.startsWith('image/')) return
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    setImageUrl(URL.createObjectURL(file)); setGeneratedImageUrl(null); setGeneratedImageReady(false); setDownloadUrl(null); setGenerationError(null)
    setIsGeneratingMask(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('style', style)
      const response = await fetch('/api/generate-mask', { method: 'POST', body: formData })
      if (!response.ok) throw new Error('generation-failed')
      const data = await response.json() as { imageUrl?: string }
      if (data.imageUrl) setGeneratedImageUrl(data.imageUrl)
    } catch {
      setGeneratedImageUrl(null)
      setGeneratedImageReady(false)
      setGenerationError('No se pudo editar la imagen. Probá con otra foto.')
    } finally {
      setIsGeneratingMask(false)
    }
  }

  const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image(); image.crossOrigin = 'anonymous'; image.onload = () => resolve(image); image.onerror = reject; image.src = src
  })

  const createGif = async () => {
    if (!imageUrl || !generatedImageUrl || !generatedImageReady || !name.trim() || !course.trim() || !garden || isGeneratingMask) return
    setIsCreating(true); setProgress(0)
    try {
      const [mask, logo, patch] = await Promise.all([loadImage(generatedImageUrl), loadImage(schoolLogo), loadImage(rightsPatch)])
      const canvas = document.createElement('canvas'); canvas.width = 540; canvas.height = 720
      const context = canvas.getContext('2d', { willReadFrequently: true }); if (!context) throw new Error('canvas')
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      const encoder = GIFEncoder(); const frameCount = 20; const strength = intensity / 100
      for (let frame = 0; frame < frameCount; frame += 1) {
        const t = frame / frameCount; const wave = Math.sin(t * Math.PI * 2); const pulse = (Math.sin(t * Math.PI * 2) + 1) / 2
        let rotation = wave * 0.025 * strength; let moveX = wave * 8 * strength; let moveY = 0; let scale = 1 + wave * 0.025 * strength; let opacity = 1
        if (style === 'teatral') { rotation = wave * 0.075 * strength; moveX = wave * 18 * strength; moveY = Math.cos(t * Math.PI * 2) * 6 * strength }
        if (style === 'misteriosa') { rotation = wave * 0.018 * strength; moveY = wave * 4 * strength; scale = 1 + pulse * 0.035 * strength; opacity = 0.88 + pulse * 0.12 }
        if (style === 'stop') { rotation = ((frame % 3) - 1) * 0.035 * strength; moveX = ((frame % 2) ? 5 : -5) * strength; moveY = ((frame % 3) - 1) * 4 * strength; scale = 1 + ((frame % 2) ? 0.018 : -0.01) * strength }
        if (style === 'color') { rotation = wave * 0.02 * strength; scale = 1 + pulse * 0.035 * strength; context.filter = `hue-rotate(${Math.round(progress * 360)}deg) saturate(${1.1 + strength * 0.7})` }
        if (style === 'fiesta') { rotation = wave * 0.05 * strength; moveX = wave * 15 * strength; moveY = Math.cos(t * Math.PI * 4) * 8 * strength; scale = 1 + pulse * 0.045 * strength }
        if (style === 'zoom') { scale = 1 + (0.03 + pulse * 0.09) * strength; moveX = wave * 3 * strength }
        if (style === 'rebote') { moveY = Math.abs(Math.sin(t * Math.PI * 2)) * -22 * strength; rotation = wave * 0.025 * strength; scale = 1 + pulse * 0.025 * strength }
        if (style === 'brillo') { scale = 1 + pulse * 0.035 * strength; opacity = 0.92 + pulse * 0.08; context.filter = `brightness(${1 + pulse * 0.28 * strength}) contrast(${1.05 + strength * 0.18}) saturate(${1.1 + strength * 0.45})` }
        if (style === 'vibracion') { moveX = Math.sin(t * Math.PI * 12) * 9 * strength; moveY = Math.cos(t * Math.PI * 10) * 6 * strength; rotation = Math.sin(t * Math.PI * 10) * 0.035 * strength; scale = 1 + pulse * 0.02 * strength }
        context.fillStyle = style === 'fiesta' ? `hsl(${Math.round(progress * 360)}, 35%, 88%)` : '#d9e2d2'; context.fillRect(0, 0, canvas.width, canvas.height)
        context.filter = style === 'color' ? `hue-rotate(${Math.round(t * 360)}deg) saturate(${1.25 + strength * 0.75}) contrast(1.08) brightness(1.04)` : context.filter || 'none'
        context.save(); context.translate(canvas.width / 2 + moveX, canvas.height / 2 + moveY); context.rotate(rotation); context.globalAlpha = opacity
        const coverScale = Math.max(canvas.width / mask.width, canvas.height / mask.height) * 0.88 * scale
        context.drawImage(mask, -mask.width * coverScale / 2, -mask.height * coverScale / 2, mask.width * coverScale, mask.height * coverScale); context.restore()
        context.filter = 'none'
        context.drawImage(logo, 18, 18, 92, 92); context.drawImage(patch, canvas.width - 112, canvas.height - 112, 94, 94)
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data; const palette = quantize(pixels, 256, { format: 'rgb444' }); const index = applyPalette(pixels, palette)
        encoder.writeFrame(index, canvas.width, canvas.height, { palette, delay: style === 'stop' ? 220 : 180 }); setProgress(Math.round(((frame + 1) / frameCount) * 100))
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
      encoder.finish(); const blob = new Blob([encoder.bytes()], { type: 'image/gif' }); setDownloadUrl(URL.createObjectURL(blob))
    } finally { setIsCreating(false) }
  }

  const previewAnimation = {
    alegre: 'mask-preview-alegre',
    teatral: 'mask-preview-teatral',
    misteriosa: 'mask-preview-misteriosa',
    stop: 'mask-preview-stop',
    color: 'mask-preview-color',
    fiesta: 'mask-preview-fiesta',
    zoom: 'mask-preview-zoom',
    rebote: 'mask-preview-rebote',
    brillo: 'mask-preview-brillo',
    vibracion: 'mask-preview-vibracion',
  }[style]
  const previewStyle = imageUrl ? {
    animationName: previewAnimation,
    animationDuration: `${Math.max(0.9, 2.4 - intensity / 100)}s`,
    animationTimingFunction: style === 'stop' ? 'steps(3, end)' : 'ease-in-out',
    animationIterationCount: 'infinite',
  } : undefined
  const filename = `mascara_${name.trim().replace(/\s+/g, '_') || 'alumno'}_${course.trim().replace(/\s+/g, '_') || 'curso'}_jardin_${garden || 'sin-jardin'}.gif`

  return <main className="min-h-screen overflow-hidden bg-[#f7f3ec] text-[#183d38]"><div className="mx-auto flex min-h-screen max-w-[1440px] flex-col px-5 py-5 sm:px-8 lg:px-12">
    <header className="flex items-center justify-between border-b border-[#d8d1c5] pb-5"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#174e48]"><Layers3 className="h-5 w-5 text-[#f6c94a]" /></div><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#c06945]">Muestra Distrital 2026</p><h1 className="font-serif text-xl font-semibold">Yo tengo derechos</h1></div></div><div className="hidden items-center gap-2 rounded-full bg-[#e9f1e9] px-4 py-2 text-xs font-semibold text-[#28705d] md:flex"><Sparkles className="h-3.5 w-3.5" /> Animación 2D sin IA</div><img src={schoolLogo} alt="Logo del Jardín N.º 925 Roberto Paxtot" className="h-12 w-12 object-contain" /></header>
    <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[0.82fr_1.18fr] lg:py-12"><div className="max-w-xl"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#b7d2c5] bg-[#e9f1e9] px-3 py-1.5 text-xs font-semibold text-[#28705d]">Tu máscara, tu imaginación, en movimiento</div><h2 className="font-serif text-5xl leading-[0.96] tracking-[-0.04em] text-[#174e48] sm:text-7xl">Dale vida a tu <span className="text-[#c06945]">creación.</span></h2><p className="mt-5 max-w-md text-lg leading-8 text-[#58716b]">Subí una foto, elegí un movimiento y descargá tu GIF artesanal.</p>
      <div className="mt-7 grid max-w-md gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-[#41655e]">Tu nombre<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Martina" className="mt-1.5 w-full rounded-xl border border-[#c9c1b4] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#c06945]" /></label><label className="text-xs font-bold text-[#41655e]">Curso<input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Ej. Sala verde" className="mt-1.5 w-full rounded-xl border border-[#c9c1b4] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#c06945]" /></label><label className="text-xs font-bold text-[#41655e] sm:col-span-2">Jardín<select value={garden} onChange={(e) => setGarden(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[#c9c1b4] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#c06945]"><option value="">Seleccioná un jardín</option><option value="910">Jardín 910</option><option value="912">Jardín 912</option><option value="925">Jardín 925</option></select></label></div>
      <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={(event) => handleFile(event.target.files?.[0])} /><div className="mt-5 flex flex-wrap gap-3"><button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-full bg-[#c06945] px-5 py-3 text-sm font-bold text-white"><Upload className="h-4 w-4" /> {imageUrl ? 'Cambiar imagen' : 'Subir fotografía'}</button><button disabled={!imageUrl || !generatedImageReady || !name.trim() || !course.trim() || !garden || isCreating || isGeneratingMask} onClick={createGif} className="rounded-full bg-[#174e48] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{isCreating ? `Exportando ${progress}%` : generatedImageReady ? 'Crear GIF animado' : 'Esperando imagen editada'}</button>{downloadUrl && <a href={downloadUrl} download={filename} className="inline-flex items-center gap-2 rounded-full border border-[#174e48] px-5 py-3 text-sm font-bold text-[#174e48]"><Download className="h-4 w-4" /> Descargar GIF</a>}</div>
      <div className="mt-6 rounded-2xl border border-[#d8d1c5] bg-white/60 p-4"><p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#6e817c]">Estilo de animación</p><div className="grid grid-cols-2 gap-2">{styles.map((item) => <button key={item.id} onClick={() => setStyle(item.id)} className={`rounded-xl border p-3 text-left transition ${style === item.id ? 'border-[#c06945] bg-[#fff3eb]' : 'border-[#e4ddd2] bg-white'}`}><span className="block text-sm font-bold text-[#174e48]">{item.label}</span><span className="text-[11px] text-[#6e817c]">{item.description}</span></button>)}</div><label className="mt-4 block text-xs font-bold text-[#41655e]">Intensidad <span className="font-normal text-[#6e817c]">{intensity}%</span><input type="range" min="10" max="100" value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="mt-2 w-full accent-[#c06945]" /></label></div>
      {(isCreating || isGeneratingMask || generationError) && <div className="mt-3" role="status" aria-live="polite">{(isCreating || isGeneratingMask) && <div className="h-2 overflow-hidden rounded-full bg-[#d8e4d8]"><div className="h-full bg-[#c06945] transition-all" style={{ width: `${isGeneratingMask ? 18 : progress}%` }} /></div>}<p className={`mt-1 text-xs ${generationError ? 'text-[#b24f3d]' : 'text-[#6e817c]'}`}>{generationError ?? (isGeneratingMask ? 'Editando tu imagen, esperá un momento…' : 'Animando la imagen editada…')}</p></div>}
    </div><div className="relative mx-auto w-full max-w-[650px]"><div className="relative overflow-hidden rounded-[2rem] border-[10px] border-white bg-[#d9e2d2] shadow-[0_25px_70px_rgba(43,70,58,0.17)]"><div className="absolute left-4 top-4 z-10 rounded-full bg-[#174e48]/90 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white">GIF · LOOP</div><img src={schoolLogo} alt="Logo institucional" className="absolute left-5 top-14 z-10 h-16 w-16 rounded-full bg-white/90 p-1 object-contain shadow-md sm:h-20 sm:w-20" /><img src={generatedImageReady && generatedImageUrl ? generatedImageUrl : imageUrl ?? schoolLogo} onLoad={(event) => { if (generatedImageUrl && event.currentTarget.currentSrc === generatedImageUrl) setGeneratedImageReady(true) }} onError={() => { setGeneratedImageReady(false); setGeneratedImageUrl(null) }} alt={imageUrl ? 'Vista previa de la máscara' : 'Subí una fotografía para ver la máscara'} style={previewStyle} className="aspect-[3/4] w-full object-cover" /><img src={rightsPatch} alt="Parche de derechos" className="absolute bottom-5 right-5 z-10 h-20 w-20 object-contain drop-shadow-[0_4px_5px_rgba(0,0,0,0.2)] sm:h-28 sm:w-28" />{!imageUrl && <div className="absolute inset-0 flex items-center justify-center bg-[#174e48]/10 text-sm font-semibold text-[#174e48]">Subí una imagen para comenzar</div>}{isGeneratingMask && <div className="absolute inset-0 flex items-center justify-center bg-[#174e48]/10 text-sm font-semibold text-[#174e48]">Generando máscara terminada…</div>}</div><p className="mt-3 px-2 text-xs text-[#6e817c]">La foto original se mantiene como base. El movimiento es general: no simula ojos ni boca.</p></div></section>
    <footer className="flex flex-col gap-1 border-t border-[#d8d1c5] py-5 text-xs text-[#6e817c] sm:flex-row sm:items-center sm:justify-between"><span>01 Fotografiá · 02 Elegí el movimiento · 03 Descargá</span><span>Canvas 2D · GIF real</span></footer>
  </div></main>
}
