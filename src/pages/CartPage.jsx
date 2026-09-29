import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import ImageWithFallback from '../components/ImageWithFallback'
import { EmptyState, QtyStepper, VegMark } from '../components/ui'
import { formatCurrency } from '../utils/format'
import './CartPage.css'

export default function CartPage () {
  const { items, count, totals, restaurant, updateQty, removeItem, clearCart } = useCart()
  const { user } = useAuth()
  const { notify, success } = useToast()
  const navigate = useNavigate()

  if (!items.length) {
    return (
      <div className="fz-container fz-page">
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          message="Kuch tasty add karein — cart yahan dikhta hai."
          action={
            <Link className="fz-btn fz-btn--primary" to="/search">
              Browse restaurants
            </Link>
          }
        />
      </div>
    )
  }

  function proceed () {
    if (!user) {
      notify('Checkout ke liye login karein', 'info')
      navigate('/login', { state: { from: '/cart' } })
      return
    }
    navigate('/checkout')
  }

  function handleClear () {
    clearCart()
    success('Cart cleared')
  }

  return (
    <div className="fz-container fz-page">
      <h1 className="fz-h1">Your cart</h1>
      {restaurant && (
        <p className="fz-muted fz-small" style={{ marginTop: 4 }}>
          Ordering from <strong>{restaurant.name}</strong> — one order per restaurant.
        </p>
      )}

      <div className="fz-cart-layout">
        {/* ------------------------------------------------------- items */}
        <section className="fz-card fz-cart-items" aria-label="Cart items">
          {items.map((item) => (
            <article key={item.id} className="fz-cart-item">
              <ImageWithFallback
                src={item.image}
                alt=""
                seed={item.id}
                className="fz-cart-item__img"
                loading="lazy"
              />

              <div className="fz-cart-item__body">
                <h3>
                  <VegMark veg={item.veg} />
                  <span>{item.name}</span>
                </h3>
                <p className="fz-small fz-muted">{formatCurrency(item.price)} each</p>
                <div className="fz-cart-item__actions">
                  <QtyStepper
                    qty={item.qty}
                    label={`${item.name} quantity`}
                    onDecrease={() => updateQty(item.id, item.qty - 1)}
                    onIncrease={() => updateQty(item.id, item.qty + 1)}
                  />
                  <button type="button" className="fz-link-danger" onClick={() => removeItem(item.id)}>
                    Remove
                  </button>
                </div>
              </div>

              <strong className="fz-cart-item__total">{formatCurrency(item.price * item.qty)}</strong>
            </article>
          ))}

          <div className="fz-cart-items__footer">
            <Link to="/search" className="fz-btn fz-btn--subtle fz-btn--sm">
              + Add more dishes
            </Link>
            <button type="button" className="fz-link-danger" onClick={handleClear}>
              Clear cart
            </button>
          </div>
        </section>

        {/* -------------------------------------------------------- bill */}
        <aside className="fz-card fz-bill" aria-label="Bill summary">
          <h2>Bill details</h2>

          <dl>
            <div>
              <dt>Item total ({count})</dt>
              <dd>{formatCurrency(totals.subtotal)}</dd>
            </div>
            <div>
              <dt>Delivery fee</dt>
              <dd>{formatCurrency(totals.deliveryFee)}</dd>
            </div>
            <div>
              <dt>Taxes &amp; charges</dt>
              <dd>{formatCurrency(totals.taxes)}</dd>
            </div>
            <div className="fz-bill__discount">
              <dt>FoodieZone discount</dt>
              <dd>− {formatCurrency(totals.discount)}</dd>
            </div>
            <div className="fz-bill__total">
              <dt>To pay</dt>
              <dd>{formatCurrency(totals.total)}</dd>
            </div>
          </dl>

          <button type="button" className="fz-btn fz-btn--primary fz-btn--block" onClick={proceed}>
            Proceed to checkout
          </button>
          <p className="fz-small fz-muted" style={{ marginTop: 10, textAlign: 'center' }}>
            Payments demo me simulate hote hain — koi real charge nahi.
          </p>
        </aside>
      </div>
    </div>
  )
}
