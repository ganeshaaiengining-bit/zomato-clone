import { memo } from 'react'
import { Link } from 'react-router-dom'
import ImageWithFallback from './ImageWithFallback'
import { PriceLevel, Rating } from './ui'
import { formatDuration } from '../utils/format'
import './RestaurantCard.css'

function RestaurantCard ({ restaurant }) {
  const { id, name, cuisines = [], rating, ratingCount, deliveryTime, deliveryFee, offer, image, priceLevel, isOpen } =
    restaurant

  return (
    <Link to={`/restaurant/${id}`} className="fz-rcard" aria-label={`${name} restaurant`}>
      <div className="fz-rcard__media">
        <ImageWithFallback src={image} alt={name} seed={id} className="fz-rcard__img" loading="lazy" />
        {offer?.label && <span className="fz-rcard__offer">{offer.label}</span>}
        {!isOpen && <span className="fz-rcard__closed">Closed</span>}
      </div>

      <div className="fz-rcard__body">
        <div className="fz-rcard__top">
          <h3 className="fz-truncate">{name}</h3>
          <Rating value={rating} count={ratingCount} />
        </div>

        <p className="fz-rcard__cuisines fz-truncate">{cuisines.join(' · ')}</p>

        <div className="fz-rcard__meta">
          <span>{formatDuration(deliveryTime)} delivery</span>
          <span aria-hidden="true">·</span>
          <span>{deliveryFee === 0 ? 'Free delivery' : `₹${deliveryFee} delivery`}</span>
          <PriceLevel level={priceLevel} />
        </div>
      </div>
    </Link>
  )
}

export default memo(RestaurantCard)
