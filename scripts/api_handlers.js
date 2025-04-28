
function fahrenheitToCelsius(fahrenheit) {
    return (fahrenheit - 32) * 5 / 9;
}

async function displayFallbackContent(containerId, type) {
    const container = document.getElementById(containerId);

    if (!container) {
        return;
    }

    let html = '';

    if (type === 'pokemon') {
        html = `<img src="../images/ditto.png" alt="ditto" class="pokemon-image">`;
    } else if (type === 'weather') {
        html = `
            <div class="weather-info">
                <h3>Origin Weather</h3>
                <div class="weather-content">
                    <p>Weather information is currently unavailable.</p>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function displayProductInfo(productData, containerClass) {
    html = `
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

    const container = document.querySelector(containerClass);
    if (!container) {
        console.error(`Container with class ${containerClass} not found`);
        return;
    }
    container.innerHTML = html;
}

async function fetchPokemonData(pokemonName) {
    try {
        const formattedName = pokemonName.toLowerCase();
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${formattedName}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        const spriteUrl = data.sprites.other['official-artwork'].front_default || pokemonData.sprites.front_default;

        return spriteUrl;
    } catch (error) {
        console.error(`Error fetching Pokémon data for ${pokemonName}: ${error}`);
        return null;
    }
}

async function displayPokemonInfo(pokemon, containerId) {
    const type = 'pokemon';
    const container = document.getElementById(containerId);

    if (!container) {
        return;
    }

    try {
        const spriteUrl = await fetchPokemonData(pokemon);

        if (!spriteUrl) {
            displayFallbackContent(containerId, type);
            return;
        }

        const html = `<img src="${spriteUrl}" alt="${pokemon}" class="pokemon-image">`;
        container.innerHTML = html;
    } catch (error) {
        console.error(error);
        displayFallbackContent(containerId, type);
        return;
    }
}

async function displayWeatherInfo(location, containerId) {
    try {
        const type = 'weather';
        const container = document.getElementById(containerId);

        if (!container) {
            return;
        }

        const response = await fetch(`/api/weatherdata.php?loc=${location}`);
        if (!response.ok) {
            displayFallbackContent(containerId, type);
            return;
        }

        const weatherData = await response.json();

        if (!weatherData) {
            displayFallbackContent(containerId, type);
            return;
        }

        const iconUrl = `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`;

        const tempF = weatherData.main.temp;
        const tempC = fahrenheitToCelsius(tempF).toFixed(1);

        let shippingStatus = "Normal shipping times apply.";
        const weatherCondition = weatherData.weather[0].main.toLowerCase();

        if (weatherCondition.includes('rain') || weatherCondition.includes('drizzle')) {
            shippingStatus = "Due to rainy conditions, shipping may be slightly delayed.";
        } else if (weatherCondition.includes('snow') || weatherCondition.includes('sleet')) {
            shippingStatus = "Due to snow, shipping may experience significant delays.";
        } else if (weatherCondition.includes('thunderstorm')) {
            shippingStatus = "Due to severe weather, shipping will likely be delayed.";
        } else if (weatherCondition.includes('fog') || weatherCondition.includes('mist')) {
            shippingStatus = "Due to low visibility conditions, minor shipping delays may occur.";
        }

        const html = `
            <div class="weather-info">
                <h3>Origin Weather (${weatherData.name}, ${weatherData.sys.country})</h3>
                <div class="weather-content">
                    <img src="${iconUrl}" alt="${weatherData.weather[0].description}" class="weather-icon">
                    <div class="weather-details">
                        <p class="condition">${weatherData.weather[0].description}, <span class="temperature">${tempF.toFixed(1)}°F / ${tempC}°C</span></p>
                        <p class="shipping-status">${shippingStatus}</p>
                    </div>
                    
                </div>
                
            </div>
        `;

        container.innerHTML = html;

    } catch (error) {
        console.error(`Error fetching weather data for ${location}: ${error}`);
        displayFallbackContent(containerId, type);
        return;
    }
}

async function initProductPageApi(productId) {
    if (!productId) {
        return;
    }

    const response = await fetch(`/api/productdata.php?id=${productId}`);
    if (!response.ok) {
        console.error('Failed to fetch combined product data');
        return;
    }

    const productData = await response.json();

    const productDetail = document.querySelector('.product-detail');
    if (productDetail) {

        displayProductInfo(productData, '.product-detail');

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

    }
}

function displayOtherProducts(currentProductId) {
    let allProducts = JSON.parse(localStorage.getItem("productData")) || [];
    let displayedIds = new Set();
    let resultHTML = "";

    if (!allProducts.length) {
        console.warn("No product data available.");
        return;
    }

    while (displayedIds.size < 6 && displayedIds.size < allProducts.length - 1) {
        const randomIndex = Math.floor(Math.random() * allProducts.length);
        const randomProduct = allProducts[randomIndex];

        if (randomProduct.id != currentProductId && !displayedIds.has(randomProduct.id)) {
            displayedIds.add(randomProduct.id);
            resultHTML += `
                <div class="other-product-card">
                    <a href="product.html?id=${randomProduct.id}">
                        ${insertOtherImage(randomProduct.id)}
                        <p class="text-small text-black text-center">${randomProduct.name}</p>
                    </a>
                </div>
            `;
        }
    }

    document.querySelector(".other-product-grid").innerHTML = resultHTML;
}

function insertOtherImage(id) {
    const imageData = JSON.parse(localStorage.getItem("imageData")) || [];
    let image = null;

    const productKey = imageData.length > 0
        ? Object.keys(imageData[0]).find(k => k.trim() === "product_id")
        : null;

    if (productKey) {
        image = imageData.find(data =>
            data[productKey] == id && data.css_class === "other-image"
        );
    }

    if (!image) {
        image = imageData.find(data =>
            data.product_id == id && data.css_class === "other-image"
        );
    }

    if (image) {
        return `<img src="images/${image.short_name}${image.file_type}" alt="${image.name}" class="${image.css_class}">`;
    } else {
        return `<img src="images/no-image.svg" alt="image not found" class="other-image">`;
    }
}


document.addEventListener('DOMContentLoaded', function () {
    const isProductPage = window.location.pathname.includes('product.html');
    

    if (isProductPage) {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        initProductPageApi(productId);
        displayOtherProducts(productId);
    }
});

