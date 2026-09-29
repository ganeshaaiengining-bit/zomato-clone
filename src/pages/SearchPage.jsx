import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RestaurantList } from './HomePage'

const toBool = (value) => value === '1' || value === 'true'

export default function SearchPage () {
  const [params] = useSearchParams()

  // URL se filters (header search / cuisine click / footer links)
  const initialFilters = useMemo(
    () => ({
      query: params.get('query') || '',
      cuisine: params.get('cuisine') || 'all',
      minRating: params.get('rating') || '',
      maxDeliveryTime: '',
      priceLevel: params.get('price') || '',
      vegOnly: toBool(params.get('veg')),
      sort: params.get('sort') || 'rating',
    }),
    [params],
  )

  const subtitle = initialFilters.query
    ? `Results for “${initialFilters.query}”`
    : initialFilters.cuisine !== 'all'
      ? `Showing ${initialFilters.cuisine} restaurants`
      : 'Every restaurant delivering near Indiranagar, Bengaluru'

  return <RestaurantList initialFilters={initialFilters} title="Restaurants" subtitle={subtitle} />
}
