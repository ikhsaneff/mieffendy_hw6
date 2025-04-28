function displayProducts(productData) {
    let resultHTML = "";

    if (!productData || productData.length === 0) {
        productData = JSON.parse(localStorage.getItem("productData")) || [];
    }

    productData.forEach(result => {
        resultHTML += `
            <div class="product-card">
                <a href="product.html?id=${result.id}">
                    ${insertImage(result.id)}
                    <p class="text-bold text-black">${result.name}</p>
                </a>
                <p>\$${result.price.toFixed(2)}</p>
                <div class="rating">
                    ${getRatingStars(result.average_rating)}
                </div>
            </div>
        `;
    });

    return resultHTML;
}

function insertImage(id) {
    const imageData = JSON.parse(localStorage.getItem("imageData")) || [];
    let image = null;

    const productKey = imageData.length > 0
        ? Object.keys(imageData[0]).find(k => k.trim() === "product_id")
        : null;

    if (productKey) {
        image = imageData.find(data => 
            data[productKey] == id && data.css_class === "featured-image"
    )}
    
    if (!image) {
        image = imageData.find(data => 
            data.product_id == id && data.css_class === "featured-image"
    )}

    if (image) {
        return `<img src="images/${image.short_name}${image.file_type}" alt="${image.name}" class="${image.css_class}">`;
    } else {
        return `<img src="images/no-image.svg" alt="image not found" class="featured-image">`;
    }
    
}

function getRatingStars(rating) {
    let stars = "";

    for (i = 5; i > 0; i--) {
        if (rating >= 1) {
            stars += "<i class='fas fa-star'></i>";
        } else if (rating >= 0.5) {
            stars += "<i class='fas fa-star-half-alt'></i>";
        } else {
            stars += "<i class='far fa-star'></i>";
        }

        rating--;
    }

    return stars;
}