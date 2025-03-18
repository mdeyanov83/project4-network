document.addEventListener("DOMContentLoaded", function() {


    // Event listener for clicking the new Post button if the #new-post-form exists
    const postForm = document.getElementById("new-post-form");
    if (postForm) {
        document.querySelector("#create-post").addEventListener("click", (event) => {
            create_post(event)
            .then(() => load_posts_page("all"));
        });
    }

    // Load all posts
    load_posts_page("all");

});
