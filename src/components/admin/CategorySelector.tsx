import { useState, useEffect } from 'react';
import { Search, CheckSquare, Square, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';

interface Category {
  id: string;
  nombre: string;
  nivel?: number;
  subcategorias?: Category[];
}

interface CategorySelectorProps {
  source: 'syscom' | 'tecnosinergia';
  onSelectionChange: (categories: string[]) => void;
}

export default function CategorySelector({ source, onSelectionChange }: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (source === 'syscom') {
      fetchSyscomCategories();
    } else {
      setCategories([{ id: 'all', nombre: 'Todo el catálogo' }]);
      setSelectedCategories(['all']);
      onSelectionChange(['all']);
    }
  }, [source]);

  useEffect(() => {
    onSelectionChange(selectedCategories);
  }, [selectedCategories]);

  const fetchSyscomCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/syscom-api?action=categories`,
        {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener categorías');
      }

      const data = await response.json();
      setCategories(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (source === 'tecnosinergia') {
      setSelectedCategories(['all']);
    } else {
      setSelectedCategories(categories.map(c => c.id));
    }
  };

  const deselectAll = () => {
    setSelectedCategories([]);
  };

  const filteredCategories = categories.filter(cat =>
    cat.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (source === 'tecnosinergia') {
    return (
      <div className="space-y-4">
        <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex-shrink-0">
            <CheckSquare className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-blue-900">
              Sincronización completa del catálogo
            </p>
            <p className="text-sm text-blue-700 mt-1">
              TECNOSINERGIA sincroniza todos los productos en una sola petición
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <Input
              placeholder="Buscar categorías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={selectAll}
            disabled={loading}
          >
            Seleccionar todas
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={deselectAll}
            disabled={loading}
          >
            Deseleccionar todas
          </Button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando categorías...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchSyscomCategories}
            className="mt-2"
          >
            Reintentar
          </Button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700">
              <span className="font-medium">{selectedCategories.length}</span> de{' '}
              <span className="font-medium">{categories.length}</span> categorías seleccionadas
            </p>
            {selectedCategories.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Tiempo estimado: ~{Math.ceil(selectedCategories.length * 2)} minutos
              </p>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            <div className="divide-y divide-gray-200">
              {filteredCategories.map((category) => (
                <div key={category.id}>
                  <div
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex-shrink-0">
                      {selectedCategories.includes(category.id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {category.nombre}
                      </p>
                      {category.nivel && (
                        <p className="text-xs text-gray-500">Nivel {category.nivel}</p>
                      )}
                    </div>
                    {category.subcategorias && category.subcategorias.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(category.id);
                        }}
                        className="flex-shrink-0 p-1 hover:bg-gray-200 rounded"
                      >
                        {expandedCategories.has(category.id) ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    )}
                  </div>

                  {expandedCategories.has(category.id) && category.subcategorias && (
                    <div className="bg-gray-50 pl-8 divide-y divide-gray-200">
                      {category.subcategorias.map((subcat) => (
                        <div
                          key={subcat.id}
                          className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => toggleCategory(subcat.id)}
                        >
                          <div className="flex-shrink-0">
                            {selectedCategories.includes(subcat.id) ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <p className="ml-2 text-sm text-gray-700">{subcat.nombre}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
