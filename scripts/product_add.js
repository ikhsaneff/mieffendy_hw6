document.addEventListener("DOMContentLoaded", function () {
    const newProducts = JSON.parse(localStorage.getItem("newProducts")) || []
    const newProductsSection = document.querySelector(".new-products")
    let newProductElement = document.querySelector("#new-products-list")

    if (newProducts.length > 0) {
        newProductsSection.style.display = "block"
        newProductElement.innerHTML = displayProducts(newProducts)
    }

    document.querySelector("#add-product-btn").addEventListener("click", function () {
        newProductsSection.style.display = "block"
    })
})

function openForm() {
    document.getElementById("add-product-form").style.display = "flex"
}

function closeForm() {
    document.getElementById("the-real-add-product-form").reset()
    document.getElementById("add-product-form").style.display = "none"
}

let addProductForm = document.getElementById("add-product-form")

addProductForm.addEventListener("submit", function (e) {
    e.preventDefault()

    const currentProductData = JSON.parse(localStorage.getItem("productData")) || []
    const currentImageData = JSON.parse(localStorage.getItem("imageData")) || []
    const productPOSTurl = "/api/addproducts.php"
    const imagePOSTurl = "/api/addimages.php"

    const productName = document.querySelector("#product-name").value.toString().replaceAll(",", "")
    const productPrice = document.querySelector("#product-price").value.toString()
    const productDescription = document.querySelector("#product-description").value
    const productImage = document.querySelector("#product-image").value.toString().replaceAll(",", "").replaceAll(" ", "")

    const currentProductLength = currentProductData.length

    const newProductData = {
        id: currentProductLength + 1, 
        name: `${productName}`, 
        description: `${formatDescription(productDescription)}`, 
        average_rating: 0, 
        price: parseFloat(productPrice) || 0, 
        num_reviews: 0,
        pokemon: null,
        location: null,
    }
    postData(productPOSTurl, newProductData, "productData")

    const currentImageLength = currentImageData.length

    const imageName = productImage.split('.')
    const image_short_name = (imageName[0]).toString()
    const image_extension = ("." + imageName[imageName.length - 1]).toString()
    const prod_id = parseInt(currentProductLength, 10) + 1;
    const newImageData = {id: currentImageLength + 1, name: `${productName}`, description: `${"featured product image"}`,short_name: `${image_short_name}`, file_type: `${image_extension}`, css_class: `${"featured-image"}`, product_id: prod_id}
    postData(imagePOSTurl, newImageData, "imageData")
    const newImageData2 = {id: currentImageLength + 2, name: `${productName}`, description: `${"main product image"}`,short_name: `${image_short_name}`, file_type: `${image_extension}`, css_class: `${"main-image"}`, product_id: prod_id}
    postData(imagePOSTurl, newImageData2, "imageData")
    const newImageData3 = {id: currentImageLength + 3, name: `${productName}`, description: `${"other product image"}`,short_name: `${image_short_name}`, file_type: `${image_extension}`, css_class: `${"other-image"}`, product_id: prod_id}
    postData(imagePOSTurl, newImageData3, "imageData")

    let newProducts = JSON.parse(localStorage.getItem("newProducts")) || []
    newProducts.unshift(newProductData)
    localStorage.setItem("newProducts", JSON.stringify(newProducts))

    let newProductElement = document.querySelector("#new-products-list")
    newProductElement.innerHTML = displayProducts(newProducts)
    
    closeForm()
})

function postData(url, data, localStrgVar) {
    let storage = JSON.parse(localStorage.getItem(localStrgVar)) || []

    storage.push(data)  

    localStorage.setItem(localStrgVar, JSON.stringify(storage))
    
    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({value: data})
    })
}

function formatDescription(input) {
    input = input.replaceAll("\n\n", "\n").split("\n")
    result = ""
    input.forEach(function (input) {
        result += "<p>" + input.trim() + "</p>"
    })

    return result
}