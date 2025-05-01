document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const productDetail = document.querySelector('.product-detail');

    if (!productId) {
        productDetail.style.gridTemplateColumns = '1fr';
        productDetail.innerHTML = `
            <div class="not-found">
                <h1>Product Not Found</h1>
                <p>The product you are looking for does not exist.</p>
                <a href="index.html" class="continue-btn">Return to Homepage</a>
            </div>
        `;
        return;
    }

    loadProductDetails(productId);
    loadRecommendedProducts(productId);

    document.getElementById('decrease-qty').addEventListener('click', function () {
        const quantityInput = document.getElementById('quantity');
        if (quantityInput.value > 1) {
            quantityInput.value = parseInt(quantityInput.value) - 1;
        }
    });

    document.getElementById('increase-qty').addEventListener('click', function () {
        const quantityInput = document.getElementById('quantity');
        quantityInput.value = parseInt(quantityInput.value) + 1;
    });

    document.getElementById('quantity').addEventListener('change', function () {
        if (this.value < 1) {
            this.value = 1;
        }
    });

    document.getElementById('add-to-cart-btn').addEventListener('click', function () {
        addToCart(productId);
    });
});

function loadProductDetails(productId) {
    const productDetail = document.querySelector('.product-detail');
    fetch(`/api/productdata.php?id=${productId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Product not found');
            }
            return response.json();
        })
        .then(productData => {
            displayProductInfo(productData);

            if (productData.pokemon) {
                displayPokemonInfo(productData.pokemon, 'pokemon-image-container');
            } else {
                displayFallbackContent('pokemon-image-container', 'pokemon');
            }

            if (productData.location) {
                displayWeatherInfo(productData.location, 'weather-container');
            } else {
                displayFallbackContent('weather-container', 'weather');
            }

            document.title = `UA Campus Store | ${productData.name}`;
        })
        .catch(error => {
            console.error('Error fetching product data:', error);
            productDetail.style.gridTemplateColumns = '1fr';
            productDetail.innerHTML = `
                <div class="not-found">
                    <h1>Product Not Found</h1>
                    <p>The product you are looking for does not exist.</p>
                    <a href="index.html" class="continue-btn">Return to Homepage</a>
                </div>
            `;
        });
}

function displayProductInfo(productData) {
    const productDetail = document.querySelector('.product-detail')
    const html = `
        <div>
            ${productData.image}
        </div>

        <div class="product-info">
            <h1>
                ${productData.name}
                <span id="pokemon-image-container"></span>
            </h1>
            <div>
                ${productData.average_rating}
                <span>(${productData.num_reviews} reviews)</span>
            </div>
            <p class="price">$${parseFloat(productData.price).toFixed(2)}</p>
            <div class="description">
                <h2>Product Description</h2>
                ${productData.description}
            </div>
            <div id="weather-container"></div>
        </div>
    `;

    productDetail.style.gridTemplateColumns = '1fr 1fr';
    productDetail.innerHTML = html;
}

function loadRecommendedProducts(productId) {
    fetch(`/api/products.php?type=recommended&product_id=${productId}`)
        .then(response => response.json())
        .then(products => {
            if (products.length === 0) {
                document.querySelector('.other-products').style.display = 'none';
                return;
            }

            let html = '';
            products.forEach(product => {
                html += `
                    <div class="other-product-card">
                        <a href="product.html?id=${product.id}">
                            ${insertOtherImage(product.id)}
                            <p class="text-small text-black text-center">${product.name}</p>
                        </a>
                    </div>
                `;
            });

            document.querySelector('.other-product-grid').innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading recommended products:', error);
            document.querySelector('.other-products').style.display = 'none';
        });
}

function addToCart(productId) {
    const quantity = parseInt(document.getElementById('quantity').value) || 1;

    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const originalBtnText = addToCartBtn.innerHTML;
    addToCartBtn.disabled = true;
    addToCartBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

    fetch('/api/cart.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'add',
            product_id: productId,
            quantity: quantity
        })
    })
        .then(response => response.json())
        .then(data => {
            addToCartBtn.disabled = false;
            addToCartBtn.innerHTML = originalBtnText;

            if (data.success) {
                const notification = document.getElementById('cart-notification');
                notification.style.display = 'flex';
            
                setTimeout(() => {
                    notification.style.display = 'none';
                }, 3000);
            } else {
                alert('Failed to add item to cart: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error adding to cart:', error);

            addToCartBtn.disabled = false;
            addToCartBtn.innerHTML = originalBtnText;

            alert('An error occurred while adding the item to your cart');
        });
}