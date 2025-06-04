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
        this.renderCart();
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
                    <p>₱${item.price.toFixed(2)}</p>
                    <div class="cart-item-quantity">
                        <button class="btn btn-sm btn-outline-secondary cart-qty-btn" data-action="decrement" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-secondary cart-qty-btn" data-action="increment" data-id="${item.id}">+</button>
                    </div>
                </div>
                <button class="btn btn-sm btn-danger" onclick="cart.removeItem(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        cartTotal.textContent = this.getTotal().toFixed(2);

        // Add event listeners for quantity buttons
        cartItems.querySelectorAll('.cart-qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.getAttribute('data-id'));
                const action = btn.getAttribute('data-action');
                const item = this.items.find(i => i.id === id);
                if (!item) return;
                if (action === 'increment') {
                    this.updateQuantity(id, item.quantity + 1);
                } else if (action === 'decrement') {
                    this.updateQuantity(id, item.quantity - 1);
                }
                this.renderCart(); // Re-render to update UI
            });
        });
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

        const paymentMode = document.querySelector('input[name="paymentMode"]:checked').value;
        const gcashReference = document.getElementById('gcashReference').value;

        // If GCash is selected, verify the reference number
        if (paymentMode === 'Gcash' && gcashReference) {
            // Show loading state
            const confirmButton = document.getElementById('confirm-checkout');
            const originalText = confirmButton.textContent;
            confirmButton.disabled = true;
            confirmButton.textContent = 'Verifying Payment...';

            try {
                // Here you would typically make an API call to verify the GCash payment
                // For now, we'll simulate a verification delay
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Simulate verification (replace this with actual verification logic)
                const isVerified = true; // This should come from your actual verification system

                if (!isVerified) {
                    throw new Error('Payment verification failed. Please check your reference number and try again.');
                }

                // If verification is successful, proceed with the order
                await this.submitOrder(form);
                
            } catch (error) {
                console.error('Payment verification error:', error);
                this.showNotification(error.message || 'Payment verification failed. Please try again.');
                confirmButton.disabled = false;
                confirmButton.textContent = originalText;
                return;
            }
        } else {
            // For cash payments, proceed directly
            await this.submitOrder(form);
        }
    }

    async submitOrder(form) {
        const formData = {
            studentNumber: document.getElementById('studentNumber').value,
            studentName: document.getElementById('studentName').value,
            section: document.getElementById('section').value,
            email: document.getElementById('email').value,
            paymentMode: document.querySelector('input[name="paymentMode"]:checked').value,
            gcashReference: document.getElementById('gcashReference').value,
            items: this.items.map(item => `${item.name} (${item.quantity}x)`).join(', '),
            total: this.getTotal().toFixed(2),
            orderDate: new Date().toLocaleString()
        };

        try {
            // Replace with your actual Google Form formResponse URL
            const submitUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSe4grnNLFBLZ-1toQsjUpBdMGZCT6iXo25Qr5_NGm6ma174Vw/formResponse';

            // Map your form fields to Google Form entry IDs
            const formFields = {
                'entry.1011423076': formData.studentNumber,   // Student Number
                'entry.84552753': formData.studentName,       // Student Name
                'entry.964847782': formData.section,          // Section
                'entry.135040288': formData.email,            // Email
                'entry.859203702': formData.items,            // Order Items
                'entry.494570708': formData.total,            // Total Amount
                'entry.735505920': formData.orderDate,        // Order Date
                'entry.308295728': formData.paymentMode,      // Payment Mode
                'entry.123456789': formData.gcashReference    // GCash Reference (add this entry ID to your Google Form)
            };

            // Create a hidden form
            const submitForm = document.createElement('form');
            submitForm.method = 'POST';
            submitForm.action = submitUrl;
            submitForm.target = '_blank';

            for (const [key, value] of Object.entries(formFields)) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value;
                submitForm.appendChild(input);
            }

            document.body.appendChild(submitForm);
            submitForm.submit();

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

            // Reset confirm button
            const confirmButton = document.getElementById('confirm-checkout');
            confirmButton.disabled = false;
            confirmButton.textContent = 'Confirm Order';

            // Clean up
            setTimeout(() => {
                document.body.removeChild(submitForm);
            }, 1000);

        } catch (error) {
            console.error('Error submitting order:', error);
            this.showNotification('There was an error processing your order. Please try again.');
            
            // Reset confirm button
            const confirmButton = document.getElementById('confirm-checkout');
            confirmButton.disabled = false;
            confirmButton.textContent = 'Confirm Order';
        }
    }
}

// Product Data
const products = [
    // V1 Collection
    {
        id: 1,
        name: 'V1.1 T-Shirt',
        price: 350.00,
        image: 'https://via.placeholder.com/300x200',
        description: 'Premium quality t-shirt with our organization\'s V1.1 design.',
        category: 'V1'
    },
    {
        id: 2,
        name: 'V1.2 T-Shirt',
        price: 350.00,
        image: 'https://via.placeholder.com/300x200',
        description: 'Premium quality t-shirt with our organization\'s V1.2 design.',
        category: 'V1'
    },
    // V2 Collection
    {
        id: 3,
        name: 'V2.1 T-Shirt',
        price: 400.00,
        image: 'https://via.placeholder.com/300x200',
        description: 'Premium quality t-shirt with our organization\'s V2.1 design.',
        category: 'V2'
    },
    {
        id: 4,
        name: 'V2.2 T-Shirt',
        price: 350.00,
        image: 'https://via.placeholder.com/300x200',
        description: 'Premium quality t-shirt with our organization\'s V2.2 design.',
        category: 'V2'
    },
    // Stickers Collection
    {
        id: 5,
        name: 'Hirono Uniform Sticker',
        price: 30.00,
        image: 'https://via.placeholder.com/300x200',
        description: 'High-quality vinyl sticker featuring the Hirono Uniform design.',
        category: 'Stickers'
    },
    {
        id: 6,
        name: 'Hirono Airplane Sticker',
        price: 30.00,
        image: 'https://via.placeholder.com/300x200',
        description: 'High-quality vinyl sticker featuring the Hirono Airplane design.',
        category: 'Stickers'
    },
    {
        id: 7,
        name: 'Hirono Computer Enthusiasts Sticker',
        price: 30.00,
        image: 'https://via.placeholder.com/300x200',
        description: 'High-quality vinyl sticker featuring the Hirono Computer Enthusiasts design.',
        category: 'Stickers'
    },
    {
        id: 8,
        name: 'Sticker Set A',
        price: 80.00,
        image: 'https://via.placeholder.com/300x200',
        description: 'Collection of our most popular sticker designs in one set.',
        category: 'Stickers'
    },
    {
        id: 9,
        name: 'Sticker Set B',
        price: 100.00,
        image: 'https://via.placeholder.com/300x200',
        description: 'Collection of our exclusive sticker designs in one set.',
        category: 'Stickers'
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

    // Handle checkout confirmation
    document.getElementById('confirm-checkout').addEventListener('click', () => {
        cart.processCheckout();
    });

    // Add event listeners to add to cart buttons
    document.querySelectorAll('.card .btn-primary').forEach((button) => {
        button.addEventListener('click', () => {
            const productId = parseInt(button.getAttribute('data-product-id'));
            const product = products.find(p => p.id === productId);
            if (product) {
                cart.addItem(product);
                cart.renderCart(); // Update cart modal if it's open
            }
        });
    });

    // Initialize cart count
    cart.updateCartIcon();

    // Show/hide cash message based on payment mode
    const cashRadio = document.getElementById('cashPayment');
    const gcashRadio = document.getElementById('gcashPayment');
    const cashMessage = document.getElementById('cashMessage');
    const gcashDetails = document.getElementById('gcashDetails');
    const gcashReference = document.getElementById('gcashReference');

    if (cashRadio && gcashRadio && cashMessage && gcashDetails) {
        function updatePaymentDetails() {
            if (cashRadio.checked) {
                cashMessage.style.display = 'block';
                gcashDetails.style.display = 'none';
                gcashReference.required = false;
            } else {
                cashMessage.style.display = 'none';
                gcashDetails.style.display = 'block';
                gcashReference.required = true;
            }
        }
        cashRadio.addEventListener('change', updatePaymentDetails);
        gcashRadio.addEventListener('change', updatePaymentDetails);
        updatePaymentDetails(); // Set initial state
    }
}); 