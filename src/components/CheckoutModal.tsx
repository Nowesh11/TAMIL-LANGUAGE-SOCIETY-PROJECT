"use client";
import Modal from './Modal';
import CartCheckout from './CartCheckout';

type CartItem = { bookId: string; title: { en: string; ta?: string }; price: number; quantity: number };

export default function CheckoutModal({
  open,
  onClose,
  items,
  onItemsChange,
  onOrderPlaced,
}: {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onItemsChange: (items: CartItem[]) => void;
  onOrderPlaced: (res: any) => void;
}) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="Checkout" size="lg">
      <CartCheckout items={items} onItemsChange={onItemsChange} onOrderPlaced={onOrderPlaced} />
    </Modal>
  );
}