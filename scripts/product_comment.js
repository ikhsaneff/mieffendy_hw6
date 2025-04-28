document.addEventListener("DOMContentLoaded", function () {
    displayComments()
})

function postComment() {
    let commentText = document.getElementById("comment").value;
    let currentCommentData = JSON.parse(localStorage.getItem("commentData")) || [];

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-US");

    commentData = {
        productId: productId,
        comment: commentText,
        date: formattedDate
    };

    currentCommentData.push(commentData);
    localStorage.setItem("commentData", JSON.stringify(currentCommentData));

    displayComments()
}

function displayComments() {
    let commentSection = document.querySelector(".comments-list")
    let currentCommentData = JSON.parse(localStorage.getItem("commentData")) || [];
    let resultHTML = "";

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    currentCommentData.forEach(data => {
        if (data.productId === productId) {
            resultHTML += `
                <div class="comment-card">
                    <img src="images/user.png" alt="User Avatar" class="user-avatar">
                    <div class="comment-card-content">
                        <div class="comment-card-header">
                            <p class="user-name">John Doe</p>
                            <p class="comment-date">${data.date}</p>
                        </div>
                        <p class="comment-text">${data.comment}</p>
                    </div>
                </div>
            `;  
        }
       
    })

    commentSection.innerHTML = resultHTML;
    document.getElementById("comment").value = "";
}