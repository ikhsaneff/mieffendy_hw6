async function saveSearchHistory() {
    const query = document.querySelector("#search-query")?.value || "";
    if (query.trim()) {
        try {
            await fetch('/api/products.php?type=search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
        } catch (error) {
            console.error('Error saving search:', error);
        }
    }
}

async function searchProduct(query = null) {
    query = query || document.querySelector("#search-query")?.value || "";
    if (!query.trim()) {
        displayResults();
        return;
    }

    document.getElementById("search-query").value = query;

    const cleanedQuery = query.toLowerCase().trim();
    try {
        const response = await fetch(`/api/products.php?type=product&query=${encodeURIComponent(cleanedQuery)}`);
        const searchResults = await response.json();

        if (searchResults.length > 0) {
            displayResults(query, searchResults);
        } else {
            const similarResponse = await fetch(`/api/products.php?type=similar&query=${encodeURIComponent(cleanedQuery)}`);
            const similarResults = await similarResponse.json();
            if (similarResults.length > 0) {
                displaySimilarResults(query, similarResults);
            } else {
                return404();
            }
        }
    } catch (error) {
        console.error('Error fetching search results:', error);
        return404();
    }
}

document.addEventListener("DOMContentLoaded", async function () {
    try {
        const response = await fetch(`/api/products.php?type=search_history&user_id=1`);
        const data = await response.json();
        const searchHistory = data || [];

        if (searchHistory.length > 0) {
            resultsPage(searchHistory[0]);
            searchProduct(searchHistory[0]);
        } else {
            defaultSearchBar();
        }
    } catch (error) {
        console.error('Error fetching search history:', error);
        defaultSearchBar();
    }
});

async function defaultSearchBar(query="") {
    document.querySelector('main').innerHTML = `
    <section class="search-area">
        <h1>Search for Products</h1>
        <div class="search-container">
            <div class="search-bar">
                <input type="text" name="query" id="search-query" value="${query}" placeholder="Search for products...">
                <button onclick="handleSearch()"><i class="fas fa-search"></i></button>
            </div>
        </div>
        <div class="search-bottom">
            <div class="search-botom-item">
                <p>Recent Searches:</p>
                <ul class="recent-search-list"></ul>
            </div>
            
        </div>
    </section>`;

    await populateRecentSearches();
}

async function populateRecentSearches() {
    const recentList = document.querySelector('.recent-search-list');
    if (!recentList) return;

    try {
        const response = await fetch(`/api/products.php?type=search_history&user_id=1`);
        const data = await response.json();
        const searchHistory = data || [];
        recentList.innerHTML = searchHistory.length
            ? searchHistory.map(query => `<li onclick="searchProduct('${query}')">${query}</li>`).join("")
            : "";
    } catch (error) {
        console.error('Error fetching search history:', error);
        recentList.innerHTML = "<li>Error loading recent searches</li>";
    }
}

async function resultsPage(query = "") {
    document.querySelector('main').innerHTML = `
        <section class="search-area-top">
            <div class="search-container">
                <div class="search-bar">
                    <input type="text" name="query" id="search-query" value="${query}" placeholder="Search for products..." autofocus>
                    <button onclick="handleSearch()"><i class="fas fa-search"></i></button>
                </div>
            </div>
            <div class="search-bottom">
                <div class="search-botom-item">
                    <p>Recent Searches:</p>
                    <ul class="recent-search-list"></ul>
                </div>
                <div class="search-botom-item">
                    <p>Filter By:</p>
                    <div>
                        <select class="select-filter" name="price" id="price-filter" onchange="applyFilters()">
                            <option value="all">Price: All</option>
                            <option value="0-25">Price: $0-$25</option>
                            <option value="25-50">Price: $25-$50</option>
                            <option value="50-100">Price: $50-$100</option>
                            <option value="100+">Price: $100+</option>
                        </select>
                        <select class="select-filter" name="rating" id="rating-filter" onchange="applyFilters()">
                            <option value="all">Rating: All</option>
                            <option value="4+">4+ Stars</option>
                            <option value="3+">3+ Stars</option>
                            <option value="2+">2+ Stars</option>
                            <option value="1+">1+ Stars</option>
                        </select>
                    </div>
                    
                    <p>Sort By:</p>
                    <div>
                        <select class="select-filter" name="sort" id="sort" onchange="sortResults()">
                            <option value="none">None</option>
                            <option value="rating-hilo">Rating: High to Low</option>
                            <option value="rating-lohi">Rating: Low to High</option>
                            <option value="price-lohi">Price: Low to High</option>
                            <option value="price-hilo">Price: High to Low</option>
                        </select>
                    </div>
                    
                </div>
            </div>
        </section>
        <section class="search-results"></section>
    `;

    await populateRecentSearches();

    document.getElementById("search-query").addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            handleSearch();
        }
    });

    document.getElementById("search-query").addEventListener("input", function () {
        searchProduct();
    });
}

async function applyFilters() {
    const query = document.querySelector("#search-query")?.value || "";
    const priceFilter = document.getElementById('price-filter').value;
    const ratingFilter = document.getElementById('rating-filter').value;
    const sortSelect = document.getElementById("sort");
    let sortValue = "none";
    
    if (sortSelect) {
        sortValue = document.getElementById("sort").value;
    }

    let url = `/api/products.php?type=product`;
    const params = new URLSearchParams();

    if (query) params.append('query', query);
    if (priceFilter !== 'all') {
        const priceRange = priceFilter.split('-');
        if (priceRange.length === 2) {
            params.append('min_price', priceRange[0]);
            params.append('max_price', priceRange[1]);
        } else if (priceFilter === '100+') {
            params.append('min_price', 100);
        }
    }
    if (ratingFilter !== 'all') {
        params.append('min_rating', ratingFilter.replace('+', ''));
    }

    try {
        const response = await fetch(`${url}&${params.toString()}`);
        let searchResults = await response.json();
        if (searchResults.length > 0) {

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

            displayResults(query, searchResults);
        } else {
            return404();
        }
    } catch (error) {
        console.error('Error fetching filtered results:', error);
        return404();
    }
}

function displayResults(query, searchResults) {
    const resultsSection = document.querySelector('.search-results');
    if (!resultsSection) return;

    if (query && searchResults.length > 0) {
        resultsSection.innerHTML = `
            <div class="search-results-header">
                <h2>Search Results for ${query}:</h2>
            </div>
            <div class="results-grid">
                ${displayProducts(searchResults)}
            </div>
        `;
    } else {
        resultsSection.innerHTML = "<p>No results found.</p>";
    }
}

function displaySimilarResults(query, similarResults) {
    document.querySelector('.search-results').innerHTML = `
        <div class="search-results-header">
            <h2>No exact matches for "${query}", showing similar products:</h2>
        </div>
        <div class="results-grid">
            ${displayProducts(similarResults)}
        </div>
    `;
}

async function sortResults() {
    await applyFilters();
}

async function handleSearch() {
    await saveSearchHistory();
    await searchProduct();
    await populateRecentSearches();
}

function return404() {
    document.querySelector('.search-results').innerHTML = `
        <div class="not-found" style="height: 50vh;">
            <h1>Not Found</h1>
            <p>The product you are looking for does not exist.</p>
        </div>
    `
}