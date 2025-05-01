document.addEventListener("DOMContentLoaded", function() {
    loadCartItems();

    document.getElementById('continue-shopping-btn').addEventListener('click', function() {
        window.location.href = 'index.html';
    });
    
    document.getElementById('checkout-btn').addEventListener('click', function() {
        checkout();
    });
    
    document.getElementById('continue-shopping-after-checkout').addEventListener('click', function() {
        window.location.href = 'index.html';
    });
    
    document.getElementById('cancel-remove-btn').addEventListener('click', function() {
        document.getElementById('confirmation-dialog').style.display = 'none';
    });
});

function loadCartItems() {
    const cartItemsContainer = document.querySelector('.cart-items');
    const userId = 1;

    cartItemsContainer.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading cart items...</p>
        </div>
    `;
    
    fetch('/api/cart.php')
        .then(response => response.json())
        .then(data => {

            
            if (!data.items || data.items.length === 0) {
                cartItemsContainer.innerHTML = `
                    <div class="empty-cart">
                        <i class="fas fa-shopping-cart"></i>
                        <h2>Your cart is empty</h2>
                        <p>Looks like you haven't added any items to your cart yet.</p>
                        <button class="continue-btn" onclick="window.location.href='index.html'">Start Shopping</button>
                    </div>
                `;
                
                document.getElementById('checkout-btn').disabled = true;
                document.getElementById('checkout-btn').style.opacity = 0.5;
                
                document.getElementById('cart-subtotal').textContent = '$0.00';
                document.getElementById('cart-tax').textContent = '$0.00';
                document.getElementById('cart-total').textContent = '$0.00';
                
                return;
            }
            
            let cartItemsHTML = '';
            
            data.items.forEach(item => {
                cartItemsHTML += `
                    <div class="cart-item" data-id="${item.id}">
                        <div class="cart-item-header">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-actions">
                                <button class="remove-btn" onclick="confirmRemoveItem(${item.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        
                            ${item.image}
                        
                        <div class="cart-item-price">$${parseFloat(item.price).toFixed(2)}</div>
                        <div class="cart-quantity">
                            <button class="quantity-btn decrease-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                            <input type="text" class="quantity-input" value="${item.quantity}" readonly>
                            <button class="quantity-btn increase-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                        </div>
                    </div>
                `;
            });
            
            cartItemsContainer.innerHTML = cartItemsHTML;
            
            const subtotal = data.total || 0;
            const tax = subtotal * 0.06;
            const total = subtotal + tax;
            
            document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
            document.getElementById('cart-tax').textContent = `$${tax.toFixed(2)}`;
            document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
        })
        .catch(error => {
            console.error('Error loading cart:', error);
            cartItemsContainer.innerHTML = `
                <div class="error-message">
                    <p>Failed to load cart items. Please try again later.</p>
                    <button class="continue-btn" onclick="window.location.reload()">Retry</button>
                </div>
            `;
        });
}

function updateQuantity(itemId, newQuantity) {
    if (newQuantity < 1) {
        confirmRemoveItem(itemId);
        return;
    }
    
    fetch('/api/cart.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'update',
            item_id: itemId,
            quantity: newQuantity
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadCartItems();
        } else {
            alert('Failed to update item quantity');
        }
    })
    .catch(error => {
        console.error('Error updating quantity:', error);
        alert('An error occurred while updating the quantity');
    });
}

function confirmRemoveItem(itemId) {
    document.getElementById('confirm-remove-btn').setAttribute('data-item-id', itemId);
    
    document.getElementById('confirmation-dialog').style.display = 'flex';
    
    document.getElementById('confirm-remove-btn').addEventListener('click', function() {
        const itemId = this.getAttribute('data-item-id');
        removeItem(itemId);
        document.getElementById('confirmation-dialog').style.display = 'none';
    });
}

function removeItem(itemId) {
    const userId = 1;
    
    fetch(`/api/cart.php?item_id=${itemId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadCartItems();
        } else {
            alert('Failed to remove item from cart');
        }
    })
    .catch(error => {
        console.error('Error removing item:', error);
        alert('An error occurred while removing the item');
    });
}

function checkout() {
    const userId = 1;
    
    const checkoutBtn = document.getElementById('checkout-btn');
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    fetch('/api/cart.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'checkout',
            user_id: userId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.querySelector('.cart-section').style.display = 'none';
            document.querySelector('.confirmation-section').style.display = 'block';
            
            document.getElementById('order-id').textContent = data.order_id || '12345';
            
        } else {
            alert('Checkout failed: ' + (data.error || 'Unknown error'));
            
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = 'Proceed to Checkout';
        }
    })
    .catch(error => {
        console.error('Error during checkout:', error);
        alert('An error occurred during checkout');
        
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = 'Proceed to Checkout';
    });
}