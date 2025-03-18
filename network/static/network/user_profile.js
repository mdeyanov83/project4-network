document.addEventListener("DOMContentLoaded", function() {

    // If uploadImageButton exists:
    const uploadImageButton = document.getElementById("upload-image-button")
    if (uploadImageButton) {
        // Event listener for showing the Upload (photo) button when hovering over the user's profile picture
        const profilePictureContainer = document.getElementById("profile-picture-container")
        profilePictureContainer.addEventListener("mouseover", () => {
            uploadImageButton.removeAttribute("hidden")
        })
        profilePictureContainer.addEventListener("mouseout", () => {
            uploadImageButton.setAttribute("hidden", "")
        })

        // Event Listener for clicking the Upload button
        uploadImageButton.addEventListener("click", () => {
            document.getElementById("file-input").click();
        })
        document.getElementById("file-input").addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (!file) {
                alert("Please select an image file to upload");
                return;
            }
            console.log("Selected file:", file.name);
            upload_image(file); // Call the upload function
        })
    }

    // Event listener for clicking the new Post button if the #new-post-form exists
    const postForm = document.getElementById("new-post-form");
    if (postForm) {
        document.querySelector("#create-post").addEventListener("click", (event) => {
            create_post(event)
            .then(() => load_posts_page("all", viewed_username));
        });
    }

    // Event listener for follow / unfollow button if it exists
    const followButton = document.getElementById("follow-button");
    if (followButton) {
        document.querySelector("#follow-button").addEventListener("click", (event) => {
            follow_user(event.target.dataset.value, viewed_username)

            // switch follow/unfollow button
            if (event.target.dataset.value === "follow") {
                document.querySelector("#follow-button").setAttribute("data-value", "unfollow")
                document.querySelector("#follow-button").innerHTML = "Unfollow"
            } else {
                document.querySelector("#follow-button").setAttribute("data-value", "follow")
                document.querySelector("#follow-button").innerHTML = "Follow"
            }
        });
    }

    // Load viewed username posts
    load_posts_page("all", viewed_username)

});

function upload_image(file) {

    const csrftoken = document.querySelector("meta[name='csrf-token']").getAttribute("content");

    const formData = new FormData();
    formData.append("image", file); // "image" is the key used in the view function

    fetch(`/upload_image`, {
        method: "POST",
        headers: {
            "X-CSRFToken": csrftoken,
        },
        body: formData,
    })
    .then(response => response.json())
    .then(result => {
        if (result.new_image_url) {
            console.log("Upload successful: ", result.message);
            // update image url in html
            document.getElementById("profile-picture").setAttribute("src", result.new_image_url);
        } else {
            console.error("Server Error: ", result.error);
        }
    })
    .catch(error => {
        console.error("Fetch Error:", error);
    })
}


function follow_user(action, user_to_follow) {

    const csrftoken = document.querySelector("meta[name='csrf-token']").getAttribute("content");
    fetch(`/follow/${action}/${user_to_follow}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
        },
        action: action,
    })
    .then(response => response.json())
    .then(data => {
        console.log(`${action} successfull.`)
        document.querySelector("#followers-count").innerHTML = `Followers: ${data.count}`
    });
}
