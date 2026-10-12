import { NextResponse } from 'next/server'

const MASK_PROMPT = 'Handcrafted corrugated cardboard fish mask sculpture, layered relief cardboard texture with visible flute corrugated edges, painted with vibrant iridescent acrylic colors, bright blue and turquoise upper body, neon green to vivid yellow lower belly, warm orange and yellow fins with brushstroke details, large stylized cartoon eye with dark pupil and white specular reflection, clean white studio background, high detail, stop-motion craft aesthetic, isometric angle, crisp edges'

export async function POST() {
  const sourceUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(MASK_PROMPT)}?width=768&height=1024&nologo=true&seed=${Date.now()}`
  const response = await fetch(sourceUrl, { cache: 'no-store' })

  if (!response.ok) {
    return NextResponse.json({ error: 'No se pudo generar la máscara' }, { status: 502 })
  }

  const contentType = response.headers.get('content-type') || 'image/png'
  const image = Buffer.from(await response.arrayBuffer()).toString('base64')
  return NextResponse.json(
    { imageUrl: `data:${contentType};base64,${image}` },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
