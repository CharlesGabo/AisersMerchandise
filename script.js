// Shopping Cart Class
class ShoppingCart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cart')) || [];
        this.updateCartIcon();
        this.checkoutModal = null;
        this.cartModal = null;
    }

    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({ ...product, quantity: 1 });
        }
        this.saveCart();
        this.updateCartIcon();
        this.showNotification('Item added to cart!');
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartIcon();
        this.showNotification('Item removed from cart!');
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(0, quantity);
            if (item.quantity === 0) {
                this.removeItem(productId);
            } else {
                this.saveCart();
                this.updateCartIcon();
            }
        }
    }

    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    }

    updateCartIcon() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            cartCount.textContent = this.getItemCount();
            cartCount.style.display = this.getItemCount() > 0 ? 'block' : 'none';
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }

    renderCart() {
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total-amount');
        
        if (!cartItems) return;

        cartItems.innerHTML = this.items.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h6>${item.name}</h6>
                    <p>$${item.price.toFixed(2)}</p>
                    <div class="cart-item-quantity">
                        <button class="btn btn-sm btn-outline-secondary" onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-secondary" onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <button class="btn btn-sm btn-danger" onclick="cart.removeItem(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        cartTotal.textContent = this.getTotal().toFixed(2);
    }

    checkout() {
        if (this.items.length === 0) {
            this.showNotification('Your cart is empty!');
            return;
        }

        // Close cart modal and show checkout modal
        if (this.cartModal) {
            this.cartModal.hide();
        }
        
        if (!this.checkoutModal) {
            this.checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
        }
        this.checkoutModal.show();
    }

    async processCheckout() {
        const form = document.getElementById('checkout-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = {
            studentNumber: document.getElementById('studentNumber').value,
            studentName: document.getElementById('studentName').value,
            section: document.getElementById('section').value,
            email: document.getElementById('email').value,
            paymentMode: document.querySelector('input[name="paymentMode"]:checked').value,
            gcashNumber: document.getElementById('gcashNumber').value,
            items: this.items,
            total: this.getTotal()
        };

        // Validate GCash number if GCash is selected
        if (formData.paymentMode === 'gcash' && !formData.gcashNumber.match(/^[0-9]{11}$/)) {
            this.showNotification('Please enter a valid 11-digit GCash number');
            return;
        }

        // Here you would typically send this data to your backend
        console.log('Order details:', formData);

        // Show success message
        this.showNotification('Thank you for your purchase! Your order has been received.');
        
        // Clear cart and close modal
        this.items = [];
        this.saveCart();
        this.updateCartIcon();
        this.renderCart();
        
        if (this.checkoutModal) {
            this.checkoutModal.hide();
        }

        // Reset form
        form.reset();
        document.getElementById('gcashDetails').classList.add('d-none');
    }
}

// Product Data
const products = [
    {
        id: 1,
        name: 'Organization T-Shirt',
        price: 24.99,
        image: 'https://via.placeholder.com/300x200',
        description: 'Premium quality t-shirt with our organization\'s logo.'
    },
    {
        id: 2,
        name: 'Organization Hoodie',
        price: 39.99,
        image: 'https://via.placeholder.com/300x200',
        description: 'Comfortable hoodie perfect for any occasion.'
    },
    {
        id: 3,
        name: 'Organization Cap',
        price: 19.99,
        image: 'https://via.placeholder.com/300x200',
        description: 'Stylish cap with embroidered logo.'
    }
];

// Initialize cart
const cart = new ShoppingCart();

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Add cart icon to navbar
    const navbarNav = document.querySelector('#navbarNav .navbar-nav');
    const cartItem = document.createElement('li');
    cartItem.className = 'nav-item';
    cartItem.innerHTML = `
        <a class="nav-link" href="#" id="cart-icon">
            <i class="fas fa-shopping-cart"></i>
            <span id="cart-count" class="cart-count">0</span>
        </a>
    `;
    navbarNav.appendChild(cartItem);

    // Initialize modals (only once)
    cart.cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
    cart.checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));

    // Add cart modal functionality
    const cartIcon = document.getElementById('cart-icon');
    cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        cart.renderCart();
        cart.cartModal.show();
    });

    // Add checkout button functionality
    const checkoutBtn = document.getElementById('checkout-btn');
    checkoutBtn.addEventListener('click', () => {
        cart.checkout();
    });

    // Handle payment mode selection
    document.querySelectorAll('input[name="paymentMode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const gcashDetails = document.getElementById('gcashDetails');
            if (e.target.value === 'gcash') {
                gcashDetails.classList.remove('d-none');
                document.getElementById('gcashNumber').required = true;
            } else {
                gcashDetails.classList.add('d-none');
                document.getElementById('gcashNumber').required = false;
            }
        });
    });

    // Handle checkout confirmation
    document.getElementById('confirm-checkout').addEventListener('click', () => {
        cart.processCheckout();
    });

    // Add event listeners to add to cart buttons
    document.querySelectorAll('.card .btn-primary').forEach((button, index) => {
        button.addEventListener('click', () => {
            cart.addItem(products[index]);
            cart.renderCart(); // Update cart modal if it's open
        });
    });

    // Initialize cart count
    cart.updateCartIcon();
}); 