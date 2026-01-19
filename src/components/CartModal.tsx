"use client";
import React from 'react';
import Modal from './Modal';
import CartCheckout from './CartCheckout';

type CartItem = { 
  bookId: string; 
  title: { en: string; ta?: string }; 
  price: number; 
  quantity: number 
};

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onItemsChange: (items: CartItem[]) => void;
  onOrderPlaced: (res: any) => void;
}

export default function CartModal({ 
  isOpen, 
  onClose, 
  items, 
  onItemsChange, 
  onOrderPlaced 
}: CartModalProps) {

  const handleOrderPlaced = (res: any) => {
    onOrderPlaced(res);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Shopping Cart & Checkout"
      size="lg"
    >
      <div className="space-y-2">
        <p className="text-foreground-secondary mb-6">Review your items and complete purchase</p>
        <CartCheckout 
          items={items} 
          onItemsChange={onItemsChange} 
          onOrderPlaced={handleOrderPlaced} 
        />
      </div>
    </Modal>
  );
}