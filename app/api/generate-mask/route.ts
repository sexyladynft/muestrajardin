import { NextResponse } from 'next/server'

const MASK_PROMPT = 'Edit this exact student photo into a finished handcrafted cardboard mask while preserving the original silhouette, composition, recognizable colors and proportions. Add layered corrugated cardboard relief, visible flute edges, painted details and a stop-motion craft aesthetic. Do not replace the subject with an unrelated object, do not create a new scene, and keep the complete mask centered on a clean background.'

type PollinationsImageResponse = {
  data?: Array<{ url?: string; b64_json?: string }>
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const source = formData.get('image')

  if (!(source instanceof File) || !source.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Falta la fotografía original' }, { status: 400 })
  }

  const editData = new FormData()
  editData.append('model', 'openai-image-generation')
  editData.append('prompt', MASK_PROMPT)
  editData.append('size', '1024x1536')
  editData.append('image', source, source.name || 'student-photo.png')

  const response = await fetch('https://gen.pollinations.ai/v1/images/edits', {
    method: 'POST',
    body: editData,
    cache: 'no-store',
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'No se pudo editar la fotografía' }, { status: 502 })
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('image/')) {
    const image = Buffer.from(await response.arrayBuffer()).toString('base64')
    return NextResponse.json({ imageUrl: `data:${contentType};base64,${image}` }, { headers: { 'Cache-Control': 'no-store' } })
  }

  const result = await response.json() as PollinationsImageResponse
  const image = result.data?.[0]
  if (image?.url) {
    const generated = await fetch(image.url, { cache: 'no-store' })
    if (!generated.ok) return NextResponse.json({ error: 'No se pudo descargar la imagen editada' }, { status: 502 })
    const generatedType = generated.headers.get('content-type') || 'image/png'
    const generatedBase64 = Buffer.from(await generated.arrayBuffer()).toString('base64')
    return NextResponse.json({ imageUrl: `data:${generatedType};base64,${generatedBase64}` }, { headers: { 'Cache-Control': 'no-store' } })
  }
  if (image?.b64_json) return NextResponse.json({ imageUrl: `data:image/png;base64,${image.b64_json}` }, { headers: { 'Cache-Control': 'no-store' } })

  return NextResponse.json({ error: 'La respuesta de edición no contiene una imagen' }, { status: 502 })
}
