import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import DishCard from '../components/DishCard'
import ImageWithFallback from '../components/ImageWithFallback'
import { EmptyState, PageLoader, PriceLevel, Rating, Spinner, Stars } from '../components/ui'
import { formatCurrency, formatDuration, timeAgo } from '../utils/format'
import './RestaurantPage.css'

export default function RestaurantPage () {
  const { id } = useParams()
  const navigate = useNavigate()
  const { api, ready } = useData()
  const { user } = useAuth()
  const { count, totals, restaurant: cartRestaurant } = useCart()
  const { notify, success, error: toastError } = useToast()

  const [query, setQuery] = useState('')
  const [vegOnly, setVegOnly] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [savingReview, setSavingReview] = useState(false)

  const loadRestaurant = useCallback(async () => {
    const restaurant = await api.getRestaurant(id)
    const items = await api.getMenuItems(id)
    return { restaurant, items }
  }, [api, id])

  const loadReviews = useCallback(() => api.listReviews(id), [api, id])

  const { data, loading, error, reload } = useAsync(loadRestaurant, { immediate: ready })
  const reviews = useAsync(loadReviews, { immediate: ready })

  const restaurant = data?.restaurant

  /* menu ko category me group karo (order = menuCategories) */
  const grouped = useMemo(() => {
    const all = data?.items || []
    const filtered = all.filter((item) => {
      if (vegOnly && !item.veg) return false
      if (!query.trim()) return true
      const q = query.trim().toLowerCase()
      return `${item.name} ${item.description}`.toLowerCase().includes(q)
    })

    const categories = restaurant?.menuCategories || []
    const groups = categories
      .map((category) => ({
        ...category,
        items: filtered.filter((item) => item.categoryId === category.id),
      }))
      .filter((group) => group.items.length)

    // categories list me nahi hua dish (naya admin data) — unhe "Others" me dikha do
    const known = new Set(categories.map((c) => c.id))
    const orphans = filtered.filter((item) => !known.has(item.categoryId))
    if (orphans.length) groups.push({ id: 'others', name: 'More dishes', items: orphans })

    return groups
  }, [data, restaurant, query, vegOnly])

  async function submitReview (event) {
    event.preventDefault()
    if (!user) {
      notify('Review ke liye login karein', 'info')
      navigate('/login')
      return
    }
    if (!rating) {
      toastError('Pehle stars choose karein')
      return
    }
    setSavingReview(true)
    try {
      await api.addReview(id, {
        userId: user.uid,
        userName: user.name,
        rating,
        comment: comment.trim(),
      })
      setComment('')
      setRating(0)
      success('Thanks! Your review is live')
      reviews.reload()
      reload() // rating aggregate update ho gaya
    } catch (err) {
      toastError(err.message || 'Review save nahi hua')
    } finally {
      setSavingReview(false)
    }
  }

  if (!ready || (loading && !data)) return <PageLoader label="Loading restaurant…" />

  if (error || !restaurant) {
    return (
      <div className="fz-container fz-page">
        <EmptyState
          icon="🍽️"
          title="Restaurant not found"
          message={error?.message || 'Ye restaurant abhi available nahi hai.'}
          action={
            <Link className="fz-btn fz-btn--primary" to="/search">
              Back to restaurants
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="fz-restaurant">
      {/* ------------------------------------------------------- banner */}
      <div className="fz-restaurant__banner">
        <ImageWithFallback
          src={restaurant.banner || restaurant.image}
          alt=""
          seed={`${restaurant.id}-banner`}
          className="fz-restaurant__banner-img"
          loading="eager"
        />
        <Link to="/search" className="fz-restaurant__back" aria-label="Back to restaurants">
          ←
        </Link>
      </div>

      {/* --------------------------------------------------------- info */}
      <div className="fz-container fz-restaurant__info">
        <div className="fz-restaurant__head">
          <div>
            <h1>{restaurant.name}</h1>
            <p className="fz-muted">
              {(restaurant.cuisines || []).join(', ')} · {restaurant.address?.locality},{' '}
              {restaurant.address?.city}
            </p>
          </div>
          <div className="fz-restaurant__badges">
            <Rating value={restaurant.rating} count={restaurant.ratingCount} size="lg" />
            <span className="fz-chip">{formatDuration(restaurant.deliveryTime)}</span>
            <span className="fz-chip">
              {restaurant.deliveryFee === 0 ? 'Free delivery' : `${formatCurrency(restaurant.deliveryFee)} delivery`}
            </span>
            <PriceLevel level={restaurant.priceLevel} />
            {!restaurant.isOpen && <span className="fz-chip fz-chip--closed">Closed now</span>}
          </div>
        </div>

        {restaurant.offer?.label && (
          <div className="fz-offer">
            <span className="fz-offer__label">{restaurant.offer.label}</span>
            <code>{restaurant.offer.code}</code>
          </div>
        )}

        {restaurant.tagline && <p className="fz-restaurant__tagline">{restaurant.tagline}</p>}
      </div>

      {/* --------------------------------------------------------- menu */}
      <div className="fz-container fz-restaurant__menu">
        <div className="fz-menu-toolbar">
          <div className="fz-menu-search">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search in this restaurant…"
              aria-label="Search dishes in this restaurant"
            />
          </div>
          <label className="fz-switch">
            <input type="checkbox" checked={vegOnly} onChange={(event) => setVegOnly(event.target.checked)} />
            <span>Pure veg</span>
          </label>
        </div>

        {grouped.length > 0 && (
          <nav className="fz-cat-nav" aria-label="Menu categories">
            {grouped.map((group) => (
              <a key={group.id} href={`#cat-${group.id}`}>
                {group.name} <span>({group.items.length})</span>
              </a>
            ))}
          </nav>
        )}

        {grouped.length ? (
          grouped.map((group) => (
            <section key={group.id} id={`cat-${group.id}`} className="fz-menu-section">
              <h2>
                {group.name} <span className="fz-muted fz-small">({group.items.length})</span>
              </h2>
              {group.items.map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  restaurantId={restaurant.id}
                  restaurantName={restaurant.name}
                />
              ))}
            </section>
          ))
        ) : (
          <EmptyState icon="🍽️" title="No dishes found" message="Search ya filter change karein." />
        )}
      </div>

      {/* ------------------------------------------------------ reviews */}
      <section className="fz-container fz-section">
        <h2 className="fz-h2">
          Ratings &amp; reviews <span className="fz-muted fz-small">({reviews.data?.length || 0})</span>
        </h2>

        {user ? (
          <form className="fz-review-form" onSubmit={submitReview}>
            <div className="fz-review-form__stars" role="radiogroup" aria-label="Your rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star`}
                  className={n <= rating ? 'is-on' : ''}
                  onClick={() => setRating(n)}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              className="fz-textarea"
              rows={2}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Food taste kaisa tha? Delivery experience?"
            />
            <button className="fz-btn fz-btn--primary" type="submit" disabled={savingReview}>
              {savingReview ? <Spinner size={16} /> : 'Submit review'}
            </button>
          </form>
        ) : (
          <p className="fz-muted fz-small">
            <Link to="/login">Login</Link> karke apna review likhein.
          </p>
        )}

        <div className="fz-reviews">
          {(reviews.data || []).map((review) => (
            <article key={review.id} className="fz-review">
              <div className="fz-review__head">
                <span className="fz-review__avatar" aria-hidden="true">
                  {review.userName?.charAt(0).toUpperCase() || 'G'}
                </span>
                <div>
                  <strong>{review.userName || 'Guest'}</strong>
                  <span className="fz-small fz-muted"> {timeAgo(review.createdAt)}</span>
                </div>
                <span className="fz-review__rating">
                  <Stars value={review.rating} /> {review.rating}.0
                </span>
              </div>
              <p>{review.comment}</p>
            </article>
          ))}
          {reviews.loading && <Spinner />}
          {!reviews.loading && !reviews.data?.length && (
            <p className="fz-muted fz-small">Abhi tak koi review nahi — pehla aap likhein!</p>
          )}
        </div>
      </section>

      {/* ------------------------------------------------- sticky cart bar */}
      {count > 0 && (
        <div className="fz-cartbar" role="region" aria-label="Cart summary">
          <div className="fz-container fz-cartbar__inner">
            <div>
              <strong>
                {count} item{count > 1 ? 's' : ''} · {cartRestaurant?.name}
              </strong>
              <span className="fz-small">Delivery in {formatDuration(restaurant.deliveryTime)}</span>
            </div>
            <div className="fz-cartbar__right">
              <strong>{formatCurrency(totals.total)}</strong>
              <Link to="/cart" className="fz-btn fz-btn--primary">
                Proceed to checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
