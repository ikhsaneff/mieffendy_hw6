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

        const newProductsList = document.querySelector("#new-products-list");
        if (newProductsList) {

            const newProducts = [...products].sort((a, b) => b.id - a.id).slice(0, 4);
            if (newProducts.length > 0) {
                document.querySelector(".new-products").style.display = "block";
                newProductsList.innerHTML = displayProducts(newProducts);
            }
        }
    })
    .catch(error => console.error(error));
}

addEventListener("DOMContentLoaded", function () {
    loadAllDataAndDisplay();
});
