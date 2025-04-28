function loadAllDataAndDisplay() {
    Promise.all([
        fetch('/api/products.php?type=product').then(r => r.json()),
        fetch('/api/products.php?type=image').then(r => r.json())
    ])
    .then(([products, images]) => {
        localStorage.setItem("productData", JSON.stringify(products));
        localStorage.setItem("imageData", JSON.stringify(images));
        
        const featuredProductElement = document.querySelector("#featured-products-list");
        if (featuredProductElement) {
            featuredProductElement.innerHTML = displayProducts(products);
        }
    })
    .catch(error => console.error(error));
}

addEventListener("DOMContentLoaded", function () {
    if (!localStorage.getItem("productData") || !localStorage.getItem("imageData")) {
        loadAllDataAndDisplay();
    } else {
        const featuredProductElement = document.querySelector("#featured-products-list");
        const productData = JSON.parse(localStorage.getItem("productData"));
        if (featuredProductElement && productData.length > 0) {
            featuredProductElement.innerHTML = displayProducts(productData);
        }
    }
});
