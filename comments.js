async function LoadComments() {
    let res = await fetch("http://localhost:3000/comments");
    let comments = await res.json();

    let body = document.getElementById("comment_body");
    body.innerHTML = "";

    for (const c of comments) {
        let rowClass = c.isDeleted ? "deleted" : "";

        body.innerHTML += `
        <tr class="${rowClass}">
            <td>${c.id}</td>
            <td>${c.postId}</td>
            <td>${c.content}</td>
            <td>
                ${c.isDeleted ? "" :
                    `<button onclick="DeleteComment('${c.id}')">Delete</button>`
                }
            </td>
        </tr>`;
    }
}

async function SaveComment() {
    let id = document.getElementById("id_txt").value;
    let postId = document.getElementById("postId_txt").value;
    let content = document.getElementById("content_txt").value;

    // CREATE
    if (!id) {
        let res = await fetch("http://localhost:3000/comments");
        let comments = await res.json();

        let maxId = 0;
        for (const c of comments) {
            let num = parseInt(c.id);
            if (num > maxId) maxId = num;
        }

        let newId = (maxId + 1).toString();

        await fetch("http://localhost:3000/comments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: newId,
                postId: postId,
                content: content,
                isDeleted: false
            })
        });
    }
    // UPDATE
    else {
        await fetch("http://localhost:3000/comments/" + id, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                postId: postId,
                content: content
            })
        });
    }

    ClearForm();
    LoadComments();
}

async function DeleteComment(id) {
    await fetch("http://localhost:3000/comments/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            isDeleted: true
        })
    });

    LoadComments();
}

function ClearForm() {
    document.getElementById("id_txt").value = "";
    document.getElementById("postId_txt").value = "";
    document.getElementById("content_txt").value = "";
}

LoadComments();
