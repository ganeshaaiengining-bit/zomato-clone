import { useMemo } from 'react'
import './FilterBar.css'

const RATINGS = [
  { value: 4.5, label: '4.5+' },
  { value: 4, label: '4.0+' },
  { value: 3.5, label: '3.5+' },
]

const TIMES = [
  { value: 20, label: 'Under 20 min' },
  { value: 30, label: 'Under 30 min' },
  { value: 45, label: 'Under 45 min' },
]

const PRICES = [
  { value: 1, label: '₹' },
  { value: 2, label: '₹₹' },
  { value: 3, label: '₹₹₹' },
  { value: 4, label: '₹₹₹₹' },
]

const SORTS = [
  { value: 'rating', label: 'Rating' },
  { value: 'delivery', label: 'Delivery time' },
  { value: 'cost-low', label: 'Cost: low to high' },
  { value: 'cost-high', label: 'Cost: high to low' },
]

export default function FilterBar ({ filters, onChange, cuisines = [], resultCount, loading }) {
  const activeCount = useMemo(
    () =>
      [
        filters.minRating,
        filters.maxDeliveryTime,
        filters.priceLevel,
        filters.vegOnly,
        filters.cuisine !== 'all' ? filters.cuisine : null,
      ].filter(Boolean).length,
    [filters],
  )

  const toggle = (key, value) => {
    onChange({ ...filters, [key]: filters[key] === value ? '' : value })
  }

  return (
    <div className="fz-filters">
      <div className="fz-filters__row">
        <div className="fz-filter-group">
          <span className="fz-filter-group__label">Rating</span>
          {RATINGS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`fz-pill ${Number(filters.minRating) === option.value ? 'is-active' : ''}`}
              onClick={() => toggle('minRating', option.value)}
            >
              {option.label} ★
            </button>
          ))}
        </div>

        <div className="fz-filter-group">
          <span className="fz-filter-group__label">Delivery</span>
          {TIMES.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`fz-pill ${Number(filters.maxDeliveryTime) === option.value ? 'is-active' : ''}`}
              onClick={() => toggle('maxDeliveryTime', option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="fz-filter-group">
          <span className="fz-filter-group__label">Price</span>
          {PRICES.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`fz-pill ${Number(filters.priceLevel) === option.value ? 'is-active' : ''}`}
              onClick={() => toggle('priceLevel', option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="fz-filter-group">
          <span className="fz-filter-group__label">More</span>
          <button
            type="button"
            className={`fz-pill ${filters.vegOnly ? 'is-active' : ''}`}
            onClick={() => toggle('vegOnly', true)}
          >
            Pure veg
          </button>

          <label className="fz-select-inline">
            <span className="sr-only">Sort by</span>
            <select
              className="fz-select"
              value={filters.sort || 'rating'}
              onChange={(event) => onChange({ ...filters, sort: event.target.value })}
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort: {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {cuisines.length > 0 && (
        <div className="fz-filters__row fz-filters__row--scroll">
          <div className="fz-filter-group">
            <span className="fz-filter-group__label">Cuisine</span>
            <button
              type="button"
              className={`fz-pill ${!filters.cuisine || filters.cuisine === 'all' ? 'is-active' : ''}`}
              onClick={() => onChange({ ...filters, cuisine: 'all' })}
            >
              All
            </button>
            {cuisines.map((cuisine) => (
              <button
                key={cuisine}
                type="button"
                className={`fz-pill ${filters.cuisine === cuisine ? 'is-active' : ''}`}
                onClick={() => onChange({ ...filters, cuisine })}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="fz-filters__footer">
        <span className="fz-small fz-muted" aria-live="polite">
          {loading ? 'Loading restaurants…' : `${resultCount} restaurants`}
        </span>
        {activeCount > 0 && (
          <button
            type="button"
            className="fz-btn fz-btn--subtle fz-btn--sm"
            onClick={() => onChange({ minRating: '', maxDeliveryTime: '', priceLevel: '', vegOnly: '', cuisine: 'all' })}
          >
            Clear {activeCount} filter{activeCount > 1 ? 's' : ''}
          </button>
        )}
      </div>
    </div>
  )
}
