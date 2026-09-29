import { useCallback, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useApi } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import OrderTracker from '../components/OrderTracker'
import { ORDER_STATUS_LABELS } from '../data/seed'
import { EmptyState, PageLoader, Spinner } from '../components/ui'
import { formatCurrency, formatDateTime } from '../utils/format'
import './OrdersPage.css'

export default function OrdersPage () {
  const api = useApi()
  const { user } = useAuth()
  const location = useLocation()
  const placedOrderId = location.state?.placedOrderId
  const [openOrder, setOpenOrder] = useState(placedOrderId || null)

  const loadOrders = useCallback(() => api.listMyOrders(user.uid), [api, user.uid])
  const { data, loading, reload } = useAsync(loadOrders)

  if (loading && !data) return <PageLoader label="Loading your orders…" />

  const orders = data || []

  return (
    <div className="fz-container fz-page">
      <h1 className="fz-h1">My orders</h1>

      {!orders.length ? (
        <EmptyState
          icon="🧾"
          title="No orders yet"
          message="Aapka pehla order yahan dikhega."
          action={
            <Link className="fz-btn fz-btn--primary" to="/search">
              Order food now
            </Link>
          }
        />
      ) : (
        <div className="fz-orders">
          {orders.map((order) => {
            const open = openOrder === order.id
            return (
              <article key={order.id} className="fz-card fz-order">
                <header className="fz-order__head">
                  <div>
                    <h2>{order.restaurantName}</h2>
                    <p className="fz-small fz-muted">
                      {formatDateTime(order.placedAt)} · {order.items?.length || 0} items ·{' '}
                      {order.paymentMode?.toUpperCase()}
                    </p>
                  </div>
                  <div className="fz-order__head-right">
                    <strong>{formatCurrency(order.totals?.total || 0)}</strong>
                    <span
                      className={`fz-status fz-status--${order.status}`}
                    >
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                </header>

                <OrderTracker status={order.status} placedAt={order.placedAt} />

                <button
                  type="button"
                  className="fz-order__toggle"
                  onClick={() => setOpenOrder(open ? null : order.id)}
                  aria-expanded={open}
                >
                  {open ? 'Hide details' : 'View details'} <span aria-hidden="true">{open ? '▲' : '▼'}</span>
                </button>

                {open && (
                  <div className="fz-order__details">
                    <ul>
                      {(order.items || []).map((item) => (
                        <li key={item.id}>
                          <span>
                            {item.name} × {item.qty}
                          </span>
                          <strong>{formatCurrency(item.price * item.qty)}</strong>
                        </li>
                      ))}
                    </ul>

                    {order.address && (
                      <p className="fz-small fz-muted">
                        <strong>Deliver to:</strong> {order.address.name}, {order.address.line1}
                        {order.address.landmark ? `, ${order.address.landmark}` : ''},{' '}
                        {order.address.city} — {order.address.pincode} · {order.address.phone}
                      </p>
                    )}

                    {order.note && <p className="fz-small fz-muted">Note: {order.note}</p>}

                    <p className="fz-small fz-muted">Order ID: {order.id}</p>

                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <button
                        type="button"
                        className="fz-btn fz-btn--danger fz-btn--sm"
                        onClick={async () => {
                          await api.updateOrderStatus(order.id, 'cancelled')
                          reload()
                        }}
                      >
                        Cancel order
                      </button>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {loading && orders.length > 0 && <Spinner />}
    </div>
  )
}
