import { useEffect } from 'react';
import { cartService } from '@services/cartService';
import { notificationService } from '@services/notificationService';
import { useCartStore } from '@store/cartStore';
import { useNotificationStore } from '@store/notificationStore';

/**
 * Fetch cart count + notification unread count on app boot (after auth).
 * Called once in TabNavigator so badges show immediately without visiting each tab.
 */
export function useAppBadges() {
  const setItemCount    = useCartStore((s) => s.setItemCount);
  const setUnreadCount  = useNotificationStore((s) => s.setUnreadCount);

  useEffect(() => {
    cartService.getCart()
      .then((res) => setItemCount(res.cart.itemCount))
      .catch(() => {});

    notificationService.getNotifications({ limit: 1 })
      .then((res) => setUnreadCount(res.unreadCount))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
