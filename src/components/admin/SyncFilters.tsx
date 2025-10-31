import { useState } from 'react';
import { Filter, DollarSign, Package } from 'lucide-react';
import { Input } from '../shared/Input';

interface SyncFiltersProps {
  onFiltersChange: (filters: SyncFiltersType) => void;
}

export interface SyncFiltersType {
  onlyWithStock: boolean;
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
}

export default function SyncFilters({ onFiltersChange }: SyncFiltersProps) {
  const [filters, setFilters] = useState<SyncFiltersType>({
    onlyWithStock: true,
    minPrice: undefined,
    maxPrice: undefined,
    minStock: 1
  });

  const updateFilters = (newFilters: Partial<SyncFiltersType>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="w-5 h-5 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-900">Filtros de Sincronización</h3>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.onlyWithStock}
            onChange={(e) => updateFilters({ onlyWithStock: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Solo productos con stock</span>
            <p className="text-xs text-gray-500">Sincronizar únicamente productos disponibles</p>
          </div>
        </label>

        <div className="pt-2 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Rango de Precios (Opcional)
            </div>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              placeholder="Mínimo"
              value={filters.minPrice || ''}
              onChange={(e) => updateFilters({ minPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
            <Input
              type="number"
              placeholder="Máximo"
              value={filters.maxPrice || ''}
              onChange={(e) => updateFilters({ maxPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Stock Mínimo
            </div>
          </label>
          <Input
            type="number"
            placeholder="Cantidad mínima en stock"
            value={filters.minStock || 1}
            onChange={(e) => updateFilters({ minStock: e.target.value ? parseInt(e.target.value) : 1 })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Solo sincronizar productos con al menos esta cantidad en stock
          </p>
        </div>
      </div>
    </div>
  );
}
