/* =============================================================================
   Restaurant filter / sort logic — dono adapters (Firebase + local) share it
   Taaki UI ka behaviour kahin bhi same rahe.
   ========================================================================== */

/**
 * @param {Array} list   restaurant objects
 * @param {Object} f     filters
 *   f.query, f.cuisine, f.minRating, f.priceLevel, f.maxDeliveryTime,
 *   f.vegOnly, f.sort
 */
export function filterRestaurants(list = [], f = {}) {
  const query = (f.query || '').trim().toLowerCase()

  const filtered = list.filter((r) => {
    if (f.cuisine && f.cuisine !== 'all') {
      const cuisines = r.cuisines || []
      if (!cuisines.some((c) => c.toLowerCase() === String(f.cuisine).toLowerCase())) {
        return false
      }
    }
    if (f.minRating && Number(r.rating) < Number(f.minRating)) return false
    if (f.priceLevel && String(r.priceLevel) !== String(f.priceLevel)) return false
    if (f.maxDeliveryTime && Number(r.deliveryTime) > Number(f.maxDeliveryTime)) return false
    if (f.vegOnly && !r.isVegOnly) return false
    if (query) {
      const haystack = [r.name, r.tagline, r.address?.locality, r.address?.city, ...(r.cuisines || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(query)) return false
    }
    return true
  })

  return sortRestaurants(filtered, f.sort)
}

export function sortRestaurants(list = [], sort = 'rating') {
  const sorted = [...list]
  switch (sort) {
    case 'delivery':
      return sorted.sort((a, b) => a.deliveryTime - b.deliveryTime)
    case 'cost-low':
      return sorted.sort((a, b) => a.priceLevel - b.priceLevel || a.rating - b.rating)
    case 'cost-high':
      return sorted.sort((a, b) => b.priceLevel - a.priceLevel || b.rating - a.rating)
    case 'rating':
    default:
      return sorted.sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount)
  }
}

/** Cuisine list (unique) — filter dropdown ke liye */
export function collectCuisines(list = []) {
  const set = new Set()
  list.forEach((r) => (r.cuisines || []).forEach((c) => set.add(c)))
  return [...set].sort()
}
