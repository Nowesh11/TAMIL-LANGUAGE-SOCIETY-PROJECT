/**
 * Enhanced Cart System with Authentication
 * Handles cart operations with user authentication requirements
 */

class EnhancedCart {
    constructor() {
        this.cart = [];
        this.isVisible = false;
        this.loadCart();
        this.bindEvents();
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        return !!token;
    }

    // Get authentication token
    getAuthToken() {
        return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    }

    // Require authentication for cart operations
    requireAuth(action = 'perform this action') {
        if (!this.isAuthenticated()) {
            if (typeof showNotification !== 'undefined') {
                showNotification(`Please log in to ${action}`);
            } else {
                alert(`Please log in to ${action}`);
            }
            // Redirect to login page
            window.location.href = '/auth/login';
            return false;
        }
        return true;
    }

    // Load cart from localStorage
    loadCart() {
        try {
            const savedCart = localStorage.getItem('tamil_society_cart');
            this.cart = savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error('Error loading cart:', error);
            this.cart = [];
        }
    }

    // Save cart to localStorage
    saveLocalCart() {
        try {
            localStorage.setItem('tamil_society_cart', JSON.stringify(this.cart));
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }

    // Add item to cart with authentication check
    async addToCart(bookId, bookData) {
        if (!this.requireAuth('add items to cart')) {
            return { success: false, message: 'Authentication required' };
        }

        try {
            const existingItem = this.cart.find(item => item.id === bookId);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                this.cart.push({
                    id: bookId,
                    title: bookData.title,
                    tamilTitle: bookData.tamilTitle,
                    author: bookData.author,
                    price: bookData.price,
                    quantity: 1,
                    addedAt: new Date().toISOString()
                });
            }

            this.saveLocalCart();
            this.updateCartDisplay();
            
            return { success: true, message: 'Item added to cart' };
        } catch (error) {
            console.error('Error adding to cart:', error);
            return { success: false, message: 'Failed to add item to cart' };
        }
    }

    // Remove item from cart with authentication check
    async removeFromCart(bookId) {
        if (!this.requireAuth('remove items from cart')) {
            return { success: false, message: 'Authentication required' };
        }

        try {
            this.cart = this.cart.filter(item => item.id !== bookId);
            this.saveLocalCart();
            this.updateCartDisplay();
            return { success: true, message: 'Item removed from cart' };
        } catch (error) {
            console.error('Error removing from cart:', error);
            return { success: false, message: 'Failed to remove item from cart' };
        }
    }

    // Update item quantity with authentication check
    async updateQuantity(bookId, newQuantity) {
        if (!this.requireAuth('update cart quantities')) {
            return { success: false, message: 'Authentication required' };
        }

        try {
            const item = this.cart.find(item => item.id === bookId);
            if (item) {
                if (newQuantity <= 0) {
                    return await this.removeFromCart(bookId);
                } else {
                    item.quantity = newQuantity;
                    this.saveLocalCart();
                    this.updateCartDisplay();
                }
            }
            return { success: true, message: 'Quantity updated' };
        } catch (error) {
            console.error('Error updating quantity:', error);
            return { success: false, message: 'Failed to update quantity' };
        }
    }

    // Get cart items
    getCartItems() {
        return this.cart;
    }

    // Get cart
    getCart() {
        return this.cart;
    }

    // Get cart count
    getCartCount() {
        return this.cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    // Get cart total
    getCartTotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // Clear cart
    clearCart() {
        this.cart = [];
        this.saveLocalCart();
        this.updateCartDisplay();
    }

    // Toggle cart visibility
    toggleCart() {
        const cartSummary = document.getElementById('cart-summary');
        if (cartSummary) {
            this.isVisible = !this.isVisible;
            cartSummary.style.right = this.isVisible ? '2rem' : '-400px';
            
            if (this.isVisible) {
                this.renderCartItems();
            }
        }
    }

    // Update cart display
    updateCartDisplay() {
        // Update cart count in navigation or cart button
        const cartCountElements = document.querySelectorAll('.cart-count, #cart-count');
        const count = this.getCartCount();
        
        cartCountElements.forEach(element => {
            element.textContent = count;
            element.style.display = count > 0 ? 'inline' : 'none';
        });

        // Update cart total
        const cartTotalElement = document.getElementById('cart-total-amount');
        if (cartTotalElement) {
            cartTotalElement.textContent = `₹${this.getCartTotal().toFixed(2)}`;
        }

        // Update cart items if cart is visible
        if (this.isVisible) {
            this.renderCartItems();
        }
    }

    // Render cart items
    renderCartItems() {
        const cartItemsContainer = document.getElementById('cart-items');
        if (!cartItemsContainer) return;

        if (this.cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="cart-empty-state">
                    <i class="fas fa-shopping-cart cart-empty-icon"></i>
                    <p>Your cart is empty</p>
                </div>
            `;
            return;
        }

        const itemsHTML = this.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4 class="cart-item-title">${item.tamilTitle || item.title}</h4>
                    <p class="cart-item-price">₹${item.price.toFixed(2)}</p>
                </div>
                <div class="cart-item-controls">
                    <button onclick="enhancedCart.updateQuantity('${item.id}', ${item.quantity - 1})" class="cart-btn cart-btn-decrease">-</button>
                    <span class="cart-item-quantity">${item.quantity}</span>
                    <button onclick="enhancedCart.updateQuantity('${item.id}', ${item.quantity + 1})" class="cart-btn cart-btn-increase">+</button>
                    <button onclick="enhancedCart.removeFromCart('${item.id}')" class="cart-btn cart-btn-remove"><i class="fas fa-trash cart-trash-icon"></i></button>
                </div>
            </div>
        `).join('');

        cartItemsContainer.innerHTML = itemsHTML;
    }

    // Checkout with authentication
    async checkout(formData) {
        if (!this.requireAuth('complete checkout')) {
            return { success: false, message: 'Authentication required' };
        }

        if (this.cart.length === 0) {
            return { success: false, message: 'Cart is empty' };
        }

        try {
            const token = this.getAuthToken();
            
            // Add cart items to form data
            const cartData = {
                items: this.cart.map(item => ({
                    bookId: item.id,
                    quantity: item.quantity,
                    price: item.price
                })),
                total: this.getCartTotal()
            };
            
            formData.append('cart', JSON.stringify(cartData));

            const response = await fetch('/api/purchases', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                this.clearCart();
                return { success: true, message: 'Order placed successfully', data: result };
            } else {
                throw new Error(result.error || 'Checkout failed');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            return { success: false, message: error.message || 'Checkout failed' };
        }
    }

    // Bind events
    bindEvents() {
        // Close cart when clicking outside
        document.addEventListener('click', (e) => {
            const cartSummary = document.getElementById('cart-summary');
            const cartButton = document.querySelector('.cart-button, .cart-toggle');
            
            if (this.isVisible && cartSummary && !cartSummary.contains(e.target) && !cartButton?.contains(e.target)) {
                this.toggleCart();
            }
        });

        // Update display on page load
        document.addEventListener('DOMContentLoaded', () => {
            this.updateCartDisplay();
        });
    }
}

// Initialize enhanced cart
const enhancedCart = new EnhancedCart();

// Make it globally available
window.enhancedCart = enhancedCart;