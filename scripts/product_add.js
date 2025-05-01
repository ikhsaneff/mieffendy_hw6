document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById('csrf_token')) {
        console.log('CSRF token found');
    } else {
        console.warn('CSRF token not found');
    }
    
    document.querySelector("#add-product-btn").addEventListener("click", function () {
        document.querySelector(".new-products").style.display = "block";
    });
});

function openForm() {
    document.getElementById("add-product-form").style.display = "flex";
}

function closeForm() {
    document.getElementById("the-real-add-product-form").reset();
    document.getElementById("add-product-form").style.display = "none";
}

let addProductForm = document.getElementById("add-product-form");

addProductForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const productName = document.querySelector("#product-name").value.toString().replaceAll(",", "");
    const productPrice = document.querySelector("#product-price").value.toString();
    const productDescription = document.querySelector("#product-description").value;
    const productImage = document.querySelector("#product-image").value.toString().replaceAll(",", "").replaceAll(" ", "");
    
    const csrfToken = document.getElementById('csrf_token')?.value || '';

    const newProductData = {
        name: productName,
        description: formatDescription(productDescription),
        average_rating: 0,
        price: parseFloat(productPrice) || 0,
        num_reviews: 0,
        pokemon: null,
        location: null
    };

    fetch('/api/products.php?type=product', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ value: newProductData })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.id) {
            const productId = data.id;
            
            const imageName = productImage.split('.');
            const imageShortName = imageName[0].toString();
            const imageExtension = ('.' + imageName[imageName.length - 1]).toString();
            
            const imageTypes = [
                { type: 'featured-image', description: 'featured product image' },
                { type: 'main-image', description: 'main product image' },
                { type: 'other-image', description: 'other product image' }
            ];

            const imagePromises = imageTypes.map(type => {
                const imageData = {
                    name: productName,
                    description: type.description,
                    short_name: imageShortName,
                    file_type: imageExtension,
                    css_class: type.type,
                    product_id: productId
                };
                
                return fetch('/api/products.php?type=image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify({ value: imageData })
                });
            });
            
            Promise.all(imagePromises)
                .then(() => {
                    fetch('/api/products.php?type=image')
                    .then(res => res.json())
                    .then(imageData => {
                        localStorage.setItem("imageData", JSON.stringify(imageData));
                        loadNewProducts();
                    })
                    .catch(err => {
                        console.error("Failed to fetch updated image data:", err);
                        showNotification('Images added, but failed to load preview', 'warning');
                        loadNewProducts();
                    });
                    
                    closeForm();
                    showNotification('Product added successfully!', 'success');
                })
                .catch(error => {
                    console.error('Error adding images:', error);
                    showNotification('Error adding images', 'error');
                });
        } else {
            console.error('Error adding product:', data.error || 'Unknown error');
            showNotification('Error adding product', 'error');
        }
    })
    .catch(error => {
        console.error('Error adding product:', error);
        showNotification('Error adding product', 'error');
    });
});

function loadNewProducts() {
    fetch('/api/products.php?type=product')
        .then(response => response.json())
        .then(products => {
            const sortedProducts = [...products].sort((a, b) => b.id - a.id);
            const newProducts = sortedProducts.slice(0, 4);
            
            if (newProducts.length > 0) {
                document.querySelector(".new-products").style.display = "block";
                document.querySelector("#new-products-list").innerHTML = displayProducts(newProducts);
            }
        })
        .catch(error => {
            console.error('Error loading new products:', error);
        });
}

function formatDescription(input) {
    input = input.replaceAll("\n\n", "\n").split("\n");
    let result = "";
    input.forEach(function (input) {
        result += "<p>" + input.trim() + "</p>";
    });

    return result;
}

function showNotification(message, type = 'success') {
    let notification = document.getElementById('notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    notification.className = 'notification ' + type;
    
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <p>${message}</p>
    `;
    
    notification.style.display = 'flex';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}