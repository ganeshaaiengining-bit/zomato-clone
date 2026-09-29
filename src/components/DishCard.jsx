import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import ImageWithFallback from './ImageWithFallback'
import { Price, QtyStepper, Rating, VegMark } from './ui'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import './DishCard.css'

function DishCard ({ dish, restaurantName, restaurantId }) {
  const { addItem, updateQty, items } = useCart()
  const { notify, success } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()

  const inCart = items.find((item) => item.id === dish.id)

  function add () {
    if (!user) {
      notify('Login karke order karein', 'info')
      navigate('/login')
      return
    }
    // restaurantId cart ke "ek order, ek restaurant" rule ke liye zaroori hai
    const accepted = addItem({ ...dish, restaurantId: dish.restaurantId || restaurantId, restaurantName }, 1)
    if (!accepted) {
      notify('Cart me doosre restaurant ka food hai — pehle use clear karein', 'error')
      return
    }
    success(`${dish.name} added to cart`)
  }

  return (
    <article className="fz-dish">
      <div className="fz-dish__main">
        <div className="fz-dish__head">
          <h3>
            <VegMark veg={dish.veg} />
            <span>{dish.name}</span>
          </h3>
          {dish.bestseller && <span className="fz-dish__badge">Bestseller</span>}
        </div>

        <p className="fz-dish__price">
          <Price value={dish.price} mrp={dish.mrp} />
        </p>

        {dish.rating > 0 && (
          <p className="fz-dish__rating">
            <Rating value={dish.rating} size="sm" />
          </p>
        )}

        {dish.description && <p className="fz-dish__desc">{dish.description}</p>}
      </div>

      <div className="fz-dish__media">
        <ImageWithFallback src={dish.image} alt={dish.name} seed={dish.id} className="fz-dish__img" />
        <div className="fz-dish__action">
          {inCart ? (
            <QtyStepper
              qty={inCart.qty}
              label={`${dish.name} quantity`}
              onDecrease={() => updateQty(inCart.id, inCart.qty - 1)}
              onIncrease={() => updateQty(inCart.id, inCart.qty + 1)}
            />
          ) : (
            <button type="button" className="fz-btn fz-btn--ghost fz-btn--sm" onClick={add}>
              Add
              <span className="sr-only"> {dish.name}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default memo(DishCard)
