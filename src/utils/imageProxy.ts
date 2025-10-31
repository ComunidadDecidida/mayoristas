export function getProxiedImageUrl(imageUrl: string): string {
  if (!imageUrl) return ''

  if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
    return imageUrl
  }

  if (imageUrl.includes('syscom.mx') || imageUrl.includes('ftp3.syscom.mx')) {
    const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-proxy`
    return `${proxyUrl}?url=${encodeURIComponent(imageUrl)}`
  }

  return imageUrl
}
