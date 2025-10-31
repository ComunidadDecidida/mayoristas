import { useEffect, useState } from 'react'
import { Mail, Phone, MapPin } from 'lucide-react'
import { brandService, Brand } from '../../services/brandService'

export function Footer() {
  const [brands, setBrands] = useState<Brand[]>([])

  useEffect(() => {
    loadBrands()
  }, [])

  async function loadBrands() {
    try {
      const data = await brandService.getBrands(true)
      setBrands(data.filter(b => b.logo_url))
    } catch (error) {
      console.error('Error loading brands:', error)
    }
  }

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Contacto</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5" />
                <span>+52 (55) 1234-5678</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5" />
                <span>contacto@mayoristasistemas.mx</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5" />
                <span>Ciudad de México, México</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li><a href="/products" className="hover:text-white transition-colors">Productos</a></li>
              <li><a href="/about" className="hover:text-white transition-colors">Acerca de</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">Contacto</a></li>
              <li><a href="/terms" className="hover:text-white transition-colors">Términos y Condiciones</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Horarios</h3>
            <p className="text-sm">Lunes a Viernes: 9:00 AM - 6:00 PM</p>
            <p className="text-sm">Sábado: 9:00 AM - 2:00 PM</p>
            <p className="text-sm">Domingo: Cerrado</p>
          </div>
        </div>

        {brands.length > 0 && (
          <div className="border-t border-gray-800 pt-8">
            <h4 className="text-white font-semibold mb-4 text-center">Marcas Distribuidas</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {brands.map((brand) => (
                <div key={brand.id} className="bg-white rounded-lg p-3 flex items-center justify-center h-16">
                  <img
                    src={brand.logo_url || ''}
                    alt={brand.name}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.parentElement!.innerHTML = `<span class="text-gray-400 text-xs">${brand.name}</span>`
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Mayorista de Sistemas Comunicaciones y Redes de México. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
