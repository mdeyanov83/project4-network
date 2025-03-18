// document.addEventListener("DOMContentLoaded", function() {


// });

// Initial creation of the postListHeader - description card of post box - All, Following or User's posts
// Constructing of the URL for fetching necessary posts
function load_posts_page(postbox, user="") {

    const postListHeader = document.getElementById("post-list-header")
    // Show the post box name in post-list-header
    if (user != "") {
        postListHeader.innerHTML = `<h5 class="card-header">${user}'s posts</h5>`
    } else {
        postListHeader.innerHTML = `<h5 class="card-header">${postbox.charAt(0).toUpperCase() + postbox.slice(1)} posts</h5>`
    }

    // Construct initial URL without page number
    const initialURL = user ? `/posts/${postbox}/${user}` : `/posts/${postbox}`;

    // page number to be included in URL GET request
    // /?page=${page}

    load_posts(initialURL, true);
}


// Load posts function, postboxURL must contain postbox, user if specified
// Optionally supports page number for GET request -> /?page=<number>
// if ommitted, the view function returns page 1 by default
function load_posts(postboxURL, pagination = false) {

    fetch(postboxURL)
    .then(response => response.json())
    .then(data => {

        // Construct initial pagination block if requesetd and total pages > 1
        if (pagination && data.total_pages > 1) {
            createPagination(data.total_pages, 1, postboxURL)
        }

        // Clear post list container
        document.getElementById("post-list-container").innerHTML = ""
        // Add post element to posts container (#posts-list)
        data.posts.forEach((post) => {
            add_post_element(post, data.is_authenticated)
        })
    })
    .catch(error => {
        console.error(error);
    });
}


function createPagination(totalPages, currentPage = 1, URL) {
    const paginatorBlock = document.createElement("ul");
    paginatorBlock.className = "pagination";

    // Previous Button
    const paginatorBlockPrev = document.createElement("li");
    paginatorBlockPrev.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    const prevButton = document.createElement("button");
    prevButton.className = "page-link";
    prevButton.innerText = "Previous";
    // Previous button event listener
    prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
            createPagination(totalPages, currentPage - 1, URL)
            load_posts(`${URL}/?page=${currentPage - 1}`)
        }
    });
    paginatorBlockPrev.append(prevButton);
    paginatorBlock.append(paginatorBlockPrev)

    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {
        const paginatorBlockPageNum = document.createElement("li")
        paginatorBlockPageNum.className = `page-item ${i === currentPage ? "active" : ""}`;

        const paginatorBlockPageNumButton = document.createElement("button")
        paginatorBlockPageNumButton.className = "page-link"
        paginatorBlockPageNumButton.innerHTML = `${i}`

        // Page number event listener
        paginatorBlockPageNumButton.addEventListener("click", () => {
            createPagination(totalPages, i, URL);
            load_posts(`${URL}/?page=${i}`)
        });

        paginatorBlockPageNum.append(paginatorBlockPageNumButton)
        paginatorBlock.append(paginatorBlockPageNum)
        }

    // Next Button
    const paginatorBlockNext = document.createElement("li");
    paginatorBlockNext.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
    const nextButton = document.createElement("button");
    nextButton.className = "page-link";
    nextButton.innerText = "Next";
    // Next button event listener
    nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            createPagination(totalPages, currentPage + 1, URL)
            load_posts(`${URL}/?page=${currentPage + 1}`)
        }
    })

    paginatorBlockNext.append(nextButton);
    paginatorBlock.append(paginatorBlockNext);

    // Replace previous pagination with new one
    const postListPages = document.getElementById("post-list-pagination")
    postListPages.innerHTML = ""; // Remove old pagination block
    postListPages.append(paginatorBlock)
}


// Add a post element with given contents to DOM in posts-container
function add_post_element(post, is_authenticated) {

    // Get the current user username
    const current_user = document.querySelector("meta[name='current_user']").getAttribute("content");

    // Create new post element
    const postCard = document.createElement("div");
    postCard.className = "post-container card mb-3 border-secondary border-1";
    postCard.id = `post-id-${post.id}`

    const postCardHeader = document.createElement("div");
    postCardHeader.className = "card-header d-flex justify-content-between align-items-center";
    postCardHeader.innerHTML = `
        <div>
            <strong><a href="/user_profile/${post.author}" class="text-dark">${post.author}</a></strong>
            •
            <small class="card-timestamp text-muted">${post.timestamp}</small>
        </div>
    `

    // Create edit button, only if post is by current User
    if (post.author === current_user) {
        const postEditButton = document.createElement("button");
        postEditButton.className = "btn btn-sm btn-outline-secondary edit-button"
        postEditButton.innerHTML = "Edit"
        postEditButton.addEventListener("click", () => {
            const postText = postCardBody.querySelector(".card-text")
            postEditButton.disabled = true
            edit_post_html(post.id, postCard)
            .then(() => postEditButton.disabled = false)
            .catch((message) => {
                postEditButton.disabled = false
                console.log(message);
            })
        })
        postCardHeader.append(postEditButton);
    }

    const postCardBody = document.createElement("div");
    postCardBody.className = "card-body"
    postCardBody.innerHTML = `<p class="card-text" style="white-space: pre-wrap">${post.body}</p>`

    const postCardFooter = document.createElement("div");
    postCardFooter.className = "card-footer d-flex justify-content-between align-items-center"
    postCardFooter.innerHTML = `<small class="text-muted">Post ID: ${post.id}</small>`

    const postCardFooterButtonArea = document.createElement("div");
    postCardFooterButtonArea.className = "d-inline-flex gap-1"

    // Create Like button, based on post being liked or not by current user
    const postLikeButton = document.createElement("button")
    postLikeButton.className = "btn btn-sm btn-outline-primary"
    if (post.liked_by_current_user) {
        postLikeButton.innerHTML = `❤️ ${post.likes}`
    } else {
        postLikeButton.innerHTML = `🤍 ${post.likes}`
    }
    // Add like button event listener only if user is logged in else disable button altogether
    if (is_authenticated) {
        postLikeButton.addEventListener("click", () => {
            like_post(post.id, postLikeButton)
        })
    } else {
        postLikeButton.disabled = true;
    }

    // Create Comment Section button
    const postCommentSectionButton = document.createElement("button")
    postCommentSectionButton.className = "btn btn-sm btn-outline-secondary"

    // Set Bootstrap attributes
    postCommentSectionButton.setAttribute("data-bs-toggle", "collapse");
    postCommentSectionButton.setAttribute("data-bs-target", `#comment-section-${post.id}`);
    postCommentSectionButton.setAttribute("aria-expanded", "false");
    postCommentSectionButton.innerHTML = `💬 ${post.comments_count}`

    // Make commen section button inactive if user NOT logged in and 0 comments on this post. Therefore unnecessary to expand the comment area.
    if (!is_authenticated && post.comments_count === 0) {
        postCommentSectionButton.disabled = true
    }

    // Append buttons to footer button area
    postCardFooterButtonArea.append(postLikeButton, postCommentSectionButton)

    // Prepend footer button area to footer
    postCardFooter.prepend(postCardFooterButtonArea);

    // Create comment section on the bottom of the post element
    const postCommentSection = document.createElement("div")
    postCommentSection.className = "collapse comment-section"
    postCommentSection.id = `comment-section-${post.id}`

    const postCommentSectionCard = document.createElement("div")
    postCommentSectionCard.className = "card-body"

    // Create and append post comment form only if user is logged in
    if (is_authenticated) {
        const postCommentForm = document.createElement("form")
        postCommentForm.className = "new-comment-form"
        postCommentForm.innerHTML = `
            <textarea class="form-control comment-form-body" rows="1" name="comment-text"required placeholder="Write a comment..."></textarea>
            <div class="mb-3 comment-form-error" style="color: red"></div>
            <button type="submit" class="btn btn-sm btn-outline-secondary comment-form-button">New Comment</button>
        `
        const postCommentFormBody = postCommentForm.querySelector(".comment-form-body")
        const postCommentFormError = postCommentForm.querySelector(".comment-form-error")
        const postCommentFormButton = postCommentForm.querySelector(".comment-form-button")
        postCommentFormButton.addEventListener("click", (event) => {
            event.preventDefault()
            post_comment(post.id, postCommentFormBody, postCommentFormError, postCommentFormButton, postCommentFormCommentList, postCommentSectionButton)
        })
        postCommentSectionCard.append(postCommentForm)
    }

    // Construct existing comments list
    const postCommentFormCommentList = document.createElement("ul")
    post.comments.forEach((comment) => {
        postCommentFormCommentList.innerHTML += `<li>${comment.body} • <strong>${comment.author}</strong> on ${comment.timestamp}</li>`
    })
    postCommentSectionCard.append(postCommentFormCommentList)

    // Add postCommentSectionCard to postCommentSection
    postCommentSection.append(postCommentSectionCard)

    // Construct Post Card Element
    postCard.append(postCardHeader, postCardBody, postCardFooter, postCommentSection);

    // Add post card element to DOM
    document.getElementById("post-list-container").append(postCard);
}


function post_comment(post_id, postCommentFormBody, postCommentFormError, postCommentFormButton, postCommentFormCommentList, postCommentSectionButton) {
    const csrftoken = document.querySelector("meta[name='csrf-token']").getAttribute("content");
    fetch("/post_comment", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify({
            post_id: post_id,
            comment_body: postCommentFormBody.value
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.error) {
            // Handle error
            console.log(`Error: ${result.error}`);
            postCommentFormError.innerHTML = `Error: ${result.error}`;
        } else {
            // Print result message
            console.log(result.message)
            // Clear error message and form body
            postCommentFormError.innerHTML = ""
            postCommentFormBody.value = ""
            // Update comments count in comment section button
            postCommentSectionButton.innerHTML = `💬 ${result.comments_count}`
            // Add new comment to comment list
            postCommentFormCommentList.innerHTML = `<li>${result.comment.body} • <strong>${result.comment.author}</strong> on ${result.comment.timestamp}</li>` + postCommentFormCommentList.innerHTML

        }
    })
    .catch(error => {
        postCommentFormError.innerHTML = "An unexpected error occurred.";
        console.error(error);
    })
}


function like_post(post_id, postLikeButton) {

    const csrftoken = document.querySelector("meta[name='csrf-token']").getAttribute("content");
    return fetch("/like_post", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify({
            post_id: post_id,
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.error) {
            // Handle error
            console.log(`Error: ${result.error}`);
        } else {
            // Print result message
            console.log(result.message);
            // Modify postLikeButton
            if (result.like_status) {
                postLikeButton.innerHTML = `❤️ ${result.likes_count}`
            } else {
                postLikeButton.innerHTML = `🤍 ${result.likes_count}`
            }
        }
    })
    .catch(error => {
        console.error(error)
    });
}


function edit_post_html(post_id, postCard) {

    const postBody = postCard.querySelector(".card-body")

    // Hide original post text and add a form with textarea in its place
    const postText = postBody.querySelector(".card-text")
    postText.style.display = "none";

    // Create edit form element containing textarea, submit and cancel buttons and error message div
    const editPostForm = document.createElement("form");

    const editPostTextarea = document.createElement("textarea");
    editPostTextarea.className = "form-control mb-2"
    editPostTextarea.value = postText.textContent;

    const editPostError = document.createElement("div");
    editPostError.className = "mb-2"
    editPostError.style = "color: red"

    const editPostButton = document.createElement("button");
    editPostButton.className = "btn btn-primary btn-sm me-2"
    editPostButton.innerHTML = "Edit"

    const editCancelButton = document.createElement("button");
    editCancelButton.className = "btn btn-secondary btn-sm"
    editCancelButton.innerHTML = "Cancel"

    // Add textarea, buttons and error field to form element
    editPostForm.append(editPostTextarea, editPostError, editPostButton, editCancelButton);

    // Add form element to post Body
    postBody.append(editPostForm);

    return new Promise((resolve, reject) => {
        // Event listeners for Submit and Cancel buttons
        editPostButton.addEventListener("click", (event) => {
            // Prevent form from submitting and reloading the page
            event.preventDefault();
            const postTimestamp = postCard.querySelector(".card-timestamp")
            edit_post(post_id, editPostTextarea.value, editPostError, postText, postTimestamp)
            // Remove edit Post Form from DOM
            .then(() => {
                editPostForm.remove()
                resolve()
            })
            .catch(() => {
                console.error("Input error")
            });
        });
        editCancelButton.addEventListener("click", () => {
            postText.style.display = "";
            event.preventDefault();
            editPostForm.remove();
            reject("Edit cancelled.")
        })
    });
}


function edit_post(post_id, new_content, editPostError, postText, postTimestamp) {

    if (new_content.trim() === "") {
        editPostError.innerHTML = "Post body cannot be empty.";
        return Promise.reject();
    }
    const csrftoken = document.querySelector("meta[name='csrf-token']").getAttribute("content");
    return fetch("/edit_post", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify({
            post_id: post_id,
            body: new_content,
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.error) {
            // Handle error
            console.log(`Error: ${result.error}`);
            editPostError.innerHTML = `Error: ${result.error}`;
        } else {
            // Print result message
            console.log(result.message);
            // Update post HTML timestamp
            postTimestamp.innerHTML = result.new_timestamp;

            // Unhide original HTML post body and update content with the new post content
            postText.innerHTML = new_content;
            postText.style.display = "";
        }
    })
    .catch(error => {
        editPostError.innerHTML = "An unexpected error occurred.";
        console.error(error)
    });
}


function create_post(event) {

    const csrftoken = document.querySelector("meta[name='csrf-token']").getAttribute("content");
    event.preventDefault();

    return fetch("/create_post", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify({
            body: document.querySelector("#post-body").value,
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.error) {
            // Handle error
            console.log(`Error: ${result.error}`);
            document.getElementById("new-post-form-error").innerHTML = `Error: ${result.error}`
        } else {
            // Print result
            console.log(result.message);
            document.getElementById("new-post-form-error").innerHTML = ""
        }
    })
    // Clear new post form after post has been saved
    .then(() => document.querySelector("#post-body").value = "");
}
