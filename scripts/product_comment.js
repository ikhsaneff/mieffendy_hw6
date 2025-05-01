document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    loadReviews(productId);
})

function loadReviews(productId) {
    fetch(`/api/productdata.php?id=${productId}`)
        .then(response => response.json())
        .then(productData => {
            if (!productData.reviews || productData.reviews.length === 0) {
                document.querySelector('.reviews-list').innerHTML = `
                    <p class="no-reviews">No reviews yet. Be the first to leave a review!</p>
                `;
                return;
            }

            let html = '';
            productData.reviews.forEach(review => {
                html += `
                    <div class="review-card">
                        <img src="images/user.png" alt="User Avatar" class="user-avatar">
                        <div class="review-card-content">
                            <div class="review-card-header">
                                <p class="user-name">${review.user_name || 'John Doe'}</p>
                                <p class="review-date">${review.created_at}</p>
                            </div>
                            <p class="review-text">${review.review}</p>
                        </div>
                    </div>
                `;
            });

            document.querySelector('.reviews-list').innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading reviews:', error);
            document.querySelector('.reviews-list').innerHTML = `
                <p class="error-message">Failed to load reviews. Please try again later.</p>
            `;
        });
}

function postReview() {
    const reviewText = document.getElementById('review').value;
    if (!reviewText.trim()) {
        alert('Please enter a review');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const today = new Date();

    fetch('/api/productdata.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            productId: productId,
            review: reviewText,
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadReviews(productId);
                document.getElementById('review').value = '';
            } else {
                alert('Failed to post review: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error posting review:', error);
            alert('An error occurred while posting your review');
        });
}