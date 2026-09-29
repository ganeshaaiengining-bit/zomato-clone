import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useAsync } from '../hooks/useAsync'
import { seedCuisines } from '../data/seed'
import RestaurantCard from '../components/RestaurantCard'
import FilterBar from '../components/FilterBar'
import ImageWithFallback from '../components/ImageWithFallback'
import { EmptyState, SectionTitle, SkeletonCard } from '../components/ui'
import { collectCuisines } from '../utils/filters'
import './HomePage.css'

const DEFAULT_FILTERS = {
  query: '',
  cuisine: 'all',
  minRating: '',
  maxDeliveryTime: '',
  priceLevel: '',
  vegOnly: '',
  sort: 'rating',
}

export function RestaurantList ({ initialFilters = {}, title = 'All restaurants', subtitle }) {
  const { api, ready, isDemo, demoOverride, enableDemoData, useFirebaseData } = useData()
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initialFilters })

  const fetchRestaurants = useCallback(() => (ready ? api.listRestaurants(filters) : Promise.resolve(null)), [api, filters, ready])
  const { data, loading, error } = useAsync(fetchRestaurants, { immediate: ready })

  const fetchAll = useCallback(() => api.listRestaurants({}), [api])
  const all = useAsync(fetchAll, { immediate: ready })
  const cuisines = collectCuisines(all.data || [])

  return (
    <div className="fz-container fz-page">
      <SectionTitle title={title} subtitle={subtitle} />

      <FilterBar
        filters={filters}
        onChange={setFilters}
        cuisines={cuisines}
        resultCount={data?.length || 0}
        loading={loading}
      />

      {loading && !data ? (
        <div className="fz-grid fz-grid--restaurants">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon="🔌"
          title="Firebase se data nahi aa raha"
          message={
            isDemo
              ? error.message
              : 'Firestore API enable hai ya nahi check karein (Firebase console → Firestore Database → Create), phir rules deploy karein: npm run deploy:rules'
          }
          action={
            !isDemo && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button type="button" className="fz-btn fz-btn--primary" onClick={enableDemoData}>
                  Demo data se dekhein
                </button>
                {demoOverride && (
                  <button type="button" className="fz-btn fz-btn--subtle" onClick={useFirebaseData}>
                    Firebase par wapas jayein
                  </button>
                )}
              </div>
            )
          }
        />
      ) : data?.length ? (
        <div className="fz-grid fz-grid--restaurants">
          {data.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🍕"
          title="No restaurants found"
          message="Filters thode dheele karke dekhein ya search change karein."
        />
      )}
    </div>
  )
}

export default function HomePage () {
  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="fz-hero">
        <div className="fz-container fz-hero__inner">
          <div className="fz-hero__copy">
            <h1>Order food you&apos;ll actually enjoy</h1>
            <p>
              8 restaurants live, 30 minute delivery and honest ratings. Pick a cuisine, find your
              favourite dish and track it till it reaches your door.
            </p>
            <div className="fz-hero__actions">
              <a className="fz-btn fz-btn--light" href="#restaurants">
                Browse restaurants
              </a>
              <Link className="fz-btn fz-btn--light-ghost" to="/orders">
                Track my order
              </Link>
            </div>
          </div>

          <div className="fz-hero__art" aria-hidden="true">
            <div className="fz-hero__blob" />
            <span className="fz-hero__emoji">🍛</span>
            <span className="fz-hero__emoji fz-hero__emoji--2">🍕</span>
            <span className="fz-hero__emoji fz-hero__emoji--3">🥗</span>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- cuisines */}
      <section className="fz-container fz-section">
        <SectionTitle title="Order in your favourite cuisine" subtitle="Tap a cuisine to filter" />
        <div className="fz-cuisines" id="restaurants">
          {seedCuisines.map((cuisine) => (
            <Link
              key={cuisine.id}
              to={`/search?cuisine=${encodeURIComponent(cuisine.name)}`}
              className="fz-cuisine"
            >
              <ImageWithFallback src={cuisine.image} alt="" seed={cuisine.id} className="fz-cuisine__img" />
              <span>{cuisine.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <RestaurantList
        title="Featured restaurants"
        subtitle="Highest rated places delivering near you right now"
      />
    </>
  )
}
