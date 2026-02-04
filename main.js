const POST_API = "http://localhost:3000/posts";
const COMMENT_API = "http://localhost:3000/comments";

let currentPostId = null;

/* ================= POSTS ================= */

async function LoadPosts() {
    let res = await fetch(POST_API);
    let posts = await res.json();

    let body = document.getElementById("post_body");
    body.innerHTML = "";

    for (const post of posts) {
        let rowClass = post.isDeleted ? "deleted" : "";

        body.innerHTML += `
        <tr class="${rowClass}" onclick="SelectPost('${post.id}')">
            <td>${post.id}</td>
            <td>${post.title}</td>
            <td>${post.views}</td>
            <td>
                ${post.isDeleted ? "" :
                    `<button onclick="DeletePost(event, '${post.id}')">Delete</button>`
                }
            </td>
        </tr>`;
    }
}

function SelectPost(id) {
    currentPostId = id;
    document.getElementById("selected_post").innerText = "Comments of Post ID: " + id;
    LoadComments(id);
}

/* CREATE + UPDATE POST */
async function SavePost() {
    let id = document.getElementById("post_id").value;
    let title = document.getElementById("post_title").value;
    let views = document.getElementById("post_views").value;

    // CREATE
    if (!id) {
        let res = await fetch(POST_API);
        let posts = await res.json();

        let maxId = 0;
        for (const p of posts) {
            let num = parseInt(p.id);
            if (num > maxId) maxId = num;
        }

        let newId = (maxId + 1).toString();

        await fetch(POST_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: newId,
                title: title,
                views: views,
                isDeleted: false
            })
        });
    }
    // UPDATE
    else {
        await fetch(POST_API + "/" + id, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: title,
                views: views
            })
        });
    }

    ClearPostForm();
    LoadPosts();
}

/* DELETE POST (soft) */
async function DeletePost(e, id) {
    e.stopPropagation(); // tránh click chọn post

    await fetch(POST_API + "/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            isDeleted: true
        })
    });

    LoadPosts();
}

function ClearPostForm() {
    document.getElementById("post_id").value = "";
    document.getElementById("post_title").value = "";
    document.getElementById("post_views").value = "";
}

/* ================= COMMENTS ================= */

async function LoadComments(postId) {
    let res = await fetch(`${COMMENT_API}?postId=${postId}`);
    let comments = await res.json();

    let body = document.getElementById("comment_body");
    body.innerHTML = "";

    for (const c of comments) {
        let rowClass = c.isDeleted ? "deleted" : "";

        body.innerHTML += `
        <tr class="${rowClass}">
            <td>${c.id}</td>
            <td>${c.content}</td>
            <td>
                ${c.isDeleted ? "" :
                    `<button onclick="DeleteComment('${c.id}')">Delete</button>`
                }
            </td>
        </tr>`;
    }
}

/* CREATE + UPDATE COMMENT */
async function SaveComment() {
    if (!currentPostId) {
        alert("Chọn post trước!");
        return;
    }

    let id = document.getElementById("comment_id").value;
    let content = document.getElementById("comment_content").value;

    // CREATE
    if (!id) {
        let res = await fetch(COMMENT_API);
        let comments = await res.json();

        let maxId = 0;
        for (const c of comments) {
            let num = parseInt(c.id);
            if (num > maxId) maxId = num;
        }

        let newId = (maxId + 1).toString();

        await fetch(COMMENT_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: newId,
                postId: currentPostId,
                content: content,
                isDeleted: false
            })
        });
    }
    // UPDATE
    else {
        await fetch(COMMENT_API + "/" + id, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                content: content
            })
        });
    }

    ClearCommentForm();
    LoadComments(currentPostId);
}

/* DELETE COMMENT (soft) */
async function DeleteComment(id) {
    await fetch(COMMENT_API + "/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            isDeleted: true
        })
    });

    LoadComments(currentPostId);
}

function ClearCommentForm() {
    document.getElementById("comment_id").value = "";
    document.getElementById("comment_content").value = "";
}

/* ================= INIT ================= */

LoadPosts();
