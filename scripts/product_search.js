function saveSearchHistory() {
    query = document.querySelector("#search-query").value || ""
    let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || []

    if (!searchHistory.includes(query)) {
        searchHistory.unshift(query)   
    }

    if (searchHistory.length > 3) {
        searchHistory.pop()
    }

    localStorage.setItem("searchHistory", JSON.stringify(searchHistory))
}

function searchProduct(query) {
    if (!query) {
        query = document.querySelector("#search-query").value || ""
    }
    
    if (query) {
        cleaned_query = query.toLowerCase().trim()

        const productData = JSON.parse(localStorage.getItem("productData")) 
        console.log(productData)
        const searchResults = productData.filter(data => data.name.toLowerCase().includes(cleaned_query))

        if (searchResults.length > 0) {
            displayResults(query, searchResults)
        } else {
            return404()
        }
    } else {
        displayResults()
    }
}

document.addEventListener("DOMContentLoaded", function () {
    let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || []

    if (searchHistory.length > 0) {
        resultsPage(searchHistory[0])
        searchProduct()
    } else {
        defaultSearchBar()
    }
})

function defaultSearchBar() {
    document.querySelector('main').innerHTML = `
    <section class="search-area">
        <h1>Search for Products</h1>
        <div class="search-container">
            <div class="search-bar">
                <input onmousedown="resultsPage()" type="text" name="query" id="search-query" placeholder="Search for products...">
                <button><i class="fas fa-search"></i></button>
            </div>
        </div>
        <div class="search-bottom">
            <div class="search-botom-item">
                <p>Recent Searches:</p>
                <ul class="recent-search-list">
                    ${getRecentSearches()}
                </ul>
            </div>
        </div>
    </section>
    `
}

function getRecentSearches() {
    let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || []

    if (searchHistory.length > 0) {
        return searchHistory.map(query => `<li onclick="searchProduct('${query}')">${query}</li>`).join("")
    }

    return ""
}

function resultsPage(query) {
    document.querySelector('main').innerHTML = `
        <section class="search-area-top">
            <div class="search-container">
                <div class="search-bar">
                    <input type="text" name="query" id="search-query" value="${query || ""}" placeholder="Search for products..." autofocus>
                    <button onclick="saveSearchHistory()"><i class="fas fa-search"></i></button>
                </div>
            </div>
            <div class="search-bottom">
                <div class="search-botom-item">
                    <p>Recent Searches:</p>
                    <ul class="recent-search-list">
                        ${getRecentSearches()}
                    </ul>
                </div>
            </div>
        </section>
        <section class="search-results">
        </section>
    `
    document.getElementById("search-query").addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            saveSearchHistory()
            document.querySelector(".recent-search-list").innerHTML = getRecentSearches()
        }
    })

    document.getElementById("search-query").addEventListener("input", function () {
        searchProduct()
    })

}

function displayResults(query, searchResults) {
    if (query && searchResults.length > 0) {
        document.querySelector('.search-results').innerHTML = `
            <div class="search-results-header">
                <h2>Search Results for ${query}:</h2>
                <div class="search-botom-item">
                    <p>Sort By:</p>
                    <div>
                        <select class="select-filter" name="sort" id="sort">
                            <option value="none">None</option>
                            <option value="rating-hilo">Rating: High to Low</option>
                            <option value="rating-lohi">Rating: Low to High</option>
                            <option value="price-lohi">Price: Low to High</option>
                            <option value="price-hilo">Price: High to Low</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="results-grid">
            ${displayProducts(searchResults)}
            </div>
        `

        document.getElementById("sort").addEventListener("change", function () {
            sortResults(searchResults);
        });
    }
    else {
        document.querySelector('.search-results').innerHTML = ""
    }
}

function sortResults(searchResults) {
    const sortValue = document.getElementById("sort").value;

    if (sortValue === "rating-hilo") {
        searchResults.sort((a, b) => b.average_rating - a.average_rating);
    } else if (sortValue === "rating-lohi") {
        searchResults.sort((a, b) => a.average_rating - b.average_rating);
    } else if (sortValue === "price-lohi") {
        searchResults.sort((a, b) => a.price - b.price);
    } else if (sortValue === "price-hilo") {
        searchResults.sort((a, b) => b.price - a.price);
    } else if (sortValue === "none") {
        searchResults.sort((a, b) => a.id - b.id);
    }

    document.querySelector(".results-grid").innerHTML = displayProducts(searchResults);
}

function return404() {
    document.querySelector('.search-results').innerHTML = `
        <div class="not-found" style="height: 50vh;">
            <h1>Not Found</h1>
            <p>The product you are looking for does not exist.</p>
        </div>
    `
}