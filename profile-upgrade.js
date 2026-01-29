// Upgraded profile renderer with edit, avatar upload, posts and analytics
import {
  auth,
  getUserData,
  updateUserProfile,
  uploadProfilePicture,
  getUserPosts,
  getAnalytics,
  getSavedPostsForUser,
  savePostForUser,
  unsavePostForUser,
  isPostLikedByUser,
} from "./firebase-config.js";

function escapeHTML(s) {
  return String(s || "").replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[m]));
}

function showNotification(msg, type = "info") {
  const el = document.createElement("div");
  el.className = `pf-notice pf-${type}`;
  el.textContent = msg;
  Object.assign(el.style, {
    position: "fixed",
    right: "20px",
    top: "20px",
    padding: "10px 14px",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    zIndex: 11000,
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

export async function renderProfileModalFancy() {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  const me = await getUserData(uid);
  if (!me) return;

  const analytics = (await getAnalytics(uid)) || {};
  const posts = (await getUserPosts(uid, "published")) || [];

  const initials = (me.displayName || auth.currentUser.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const avatarHtml = me.profilePic
    ? `<img src="${escapeHTML(me.profilePic)}" alt="avatar" class="pf-avatarImg"/>`
    : `<div class="pf-avatarInitials">${initials}</div>`;

  const html = `
    <div class="pf-grid">
      <div class="pf-left">
        <div class="pf-avatarWrap">${avatarHtml}
          <label class="pf-uploadBtn">Change
            <input type="file" id="pf-avatarFile" accept="image/*" />
          </label>
        </div>
        <h3 class="pf-name">${escapeHTML(me.displayName || auth.currentUser.email)}</h3>
        <p class="pf-bio">${escapeHTML(me.bio || "No bio yet. Tell people about yourself.")}</p>

        <div class="pf-stats">
          <div><strong>${analytics.totalPosts || posts.length}</strong><div class="pf-statLabel">Posts</div></div>
          <div><strong>${analytics.totalViews || 0}</strong><div class="pf-statLabel">Views</div></div>
          <div><strong>${analytics.totalLikes || 0}</strong><div class="pf-statLabel">Likes</div></div>
        </div>

        <div class="pf-actions">
          <button id="pf-editBtn" class="btn">Edit Profile</button>
        </div>
      </div>

      <div class="pf-right">
        <div class="pf-tabs">
          <button class="pf-tab active" data-tab="overview">Overview</button>
          <button class="pf-tab" data-tab="posts">Posts</button>
          <button class="pf-tab" data-tab="settings">Settings</button>
        </div>

        <div class="pf-panel" id="pf-overview">
          <h4>About</h4>
          <p><strong>Email:</strong> ${escapeHTML(auth.currentUser.email)}</p>
          <p><strong>Username:</strong> ${escapeHTML(me.username || "-")}</p>
          <p><strong>Website:</strong> ${me.website ? `<a href="${escapeHTML(me.website)}" target="_blank">${escapeHTML(me.website)}</a>` : "-"}</p>
        </div>

        <div class="pf-panel hidden" id="pf-posts">
          <h4>Your posts</h4>
          <div style="display:flex;gap:8px;margin-bottom:8px">
            <button class="btn btn-ghost" id="pf-showSaved">Saved</button>
            <button class="btn btn-ghost" id="pf-showLiked">Liked</button>
          </div>
          <div class="pf-postList" id="pf-postList">
            ${posts.length === 0 ? '<div class="pf-empty">No published posts yet</div>' : posts.map(p => `
              <div class="pf-postItem" data-post-id="${p.id}">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <div>
                    <div class="pf-postTitle">${escapeHTML(p.title)}</div>
                    <div class="pf-postMeta">${new Date(p.publishedAt?.toDate?.() || p.createdAt?.toDate?.() || new Date()).toLocaleDateString()} · ${p.views || 0} views</div>
                  </div>
                  <div style="display:flex;gap:8px;align-items:center">
                    <button class="btn btn-ghost pf-saveBtn" data-id="${p.id}">Save</button>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="pf-panel hidden" id="pf-settings">
          <h4>Profile Settings</h4>
          <form id="pf-editForm" class="pf-editForm">
            <label>Display name<input name="displayName" value="${escapeHTML(me.displayName || "")}" /></label>
            <label>Bio<textarea name="bio">${escapeHTML(me.bio || "")}</textarea></label>
            <label>Website<input name="website" value="${escapeHTML(me.website || "")}" /></label>
            <label>Twitter<input name="twitter" value="${escapeHTML(me.twitter || "")}" /></label>
            <label>Instagram<input name="instagram" value="${escapeHTML(me.instagram || "")}" /></label>
            <div style="display:flex;gap:8px;margin-top:8px">
              <button type="submit" class="btn">Save changes</button>
              <button type="button" id="pf-cancelEdit" class="btn btn-ghost">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <div style="padding-top:16px;border-top:2px solid var(--border);margin-top:16px">
        <button id="pf-closeBtn" class="btn btn-ghost" style="width:100%">Close</button>
      </div>
    </div>
  `;

  const container = document.getElementById("profileContent");
  container.innerHTML = html;
  document.getElementById("profileModal").classList.remove("hidden");
  // Lock body scroll while modal is open to avoid double scrollbars
  document.body.classList.add("modal-open");

  // Tab switching
  container.querySelectorAll(".pf-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".pf-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      container.querySelectorAll(".pf-panel").forEach(p => p.classList.add("hidden"));
      container.querySelector(`#pf-${tab}`).classList.remove("hidden");
    });
  });

  // Close
  container.querySelector("#pf-closeBtn").addEventListener("click", () => {
    document.getElementById("profileModal").classList.add("hidden");
    document.body.classList.remove("modal-open");
  });

  // Edit flow
  const editBtn = container.querySelector("#pf-editBtn");
  const editForm = container.querySelector("#pf-editForm");
  const cancelEdit = container.querySelector("#pf-cancelEdit");

  function toggleEdit(show) {
    if (show) {
      container.querySelectorAll(".pf-panel").forEach(p => p.classList.add("hidden"));
      document.getElementById("pf-settings").classList.remove("hidden");
    } else {
      document.getElementById("pf-overview").classList.remove("hidden");
      document.getElementById("pf-settings").classList.add("hidden");
    }
  }

  editBtn.addEventListener("click", () => toggleEdit(true));
  cancelEdit.addEventListener("click", () => toggleEdit(false));

  // Avatar upload with client-side resize/compression
  const avatarFile = container.querySelector("#pf-avatarFile");
  avatarFile.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    showNotification("Preparing avatar...", "info");

    // resize image using canvas to max 800px
    const resizedBlob = await resizeImageFile(file, 800, 0.85);
    if (!resizedBlob) {
      showNotification("Failed to process image", "error");
      return;
    }

    showNotification("Uploading avatar...", "info");
    const url = await uploadProfilePicture(uid, resizedBlob);
    if (url) {
      showNotification("Avatar updated", "success");
      if (window.pushAppNotification) window.pushAppNotification('Profile', 'Avatar updated');
      await renderProfileModalFancy();
    } else {
      showNotification("Upload failed", "error");
    }
  });

  // helper: resize image file -> Blob
  async function resizeImageFile(file, maxDim = 800, quality = 0.85) {
    try {
      const img = await loadImageFromFile(file);
      const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
      const cw = Math.round(img.width * ratio);
      const ch = Math.round(img.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, cw, ch);
      return await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Save profile changes
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fm = new FormData(editForm);
    const data = {
      displayName: fm.get("displayName")?.trim() || "",
      bio: fm.get("bio")?.trim() || "",
      website: fm.get("website")?.trim() || "",
      twitter: fm.get("twitter")?.trim() || "",
      instagram: fm.get("instagram")?.trim() || "",
    };

    showNotification("Saving profile...", "info");
    const ok = await updateUserProfile(uid, data);
    if (ok) {
      showNotification("Profile updated", "success");
      if (window.pushAppNotification) window.pushAppNotification('Profile', 'Profile updated');
      await renderProfileModalFancy();
    } else {
      showNotification("Failed to save profile", "error");
    }
  });

  // Posts panel interactions: Published / Saved / Liked views
  const postListEl = container.querySelector('#pf-postList');
  const btnPublished = container.querySelector('#pf-showPublished');
  const btnSaved = container.querySelector('#pf-showSaved');
  const btnLiked = container.querySelector('#pf-showLiked');

  async function showPublished() {
    btnPublished.classList.add('active'); btnSaved.classList.remove('active'); btnLiked.classList.remove('active');
    // render original posts
    postListEl.innerHTML = `${posts.length === 0 ? '<div class="pf-empty">No published posts yet</div>' : posts.map(p => `
      <div class="pf-postItem" data-post-id="${p.id}">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div class="pf-postTitle">${escapeHTML(p.title)}</div>
            <div class="pf-postMeta">${new Date(p.publishedAt?.toDate?.() || p.createdAt?.toDate?.() || new Date()).toLocaleDateString()} · ${p.views || 0} views</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn btn-ghost pf-saveBtn" data-id="${p.id}">Save</button>
          </div>
        </div>
      </div>
    `).join('')}`;
    wireSaveButtons();
  }

  async function showSaved() {
    btnPublished.classList.remove('active'); btnSaved.classList.add('active'); btnLiked.classList.remove('active');
    postListEl.innerHTML = '<div class="pf-empty">Loading saved posts...</div>';
    const saved = await getSavedPostsForUser(uid);
    if (!saved || saved.length === 0) {
      postListEl.innerHTML = '<div class="pf-empty">No saved posts</div>';
      return;
    }
    postListEl.innerHTML = saved.map(p => `
      <div class="pf-postItem" data-post-id="${p.id}">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div class="pf-postTitle">${escapeHTML(p.title)}</div>
            <div class="pf-postMeta">${new Date(p.publishedAt?.toDate?.() || p.createdAt?.toDate?.() || new Date()).toLocaleDateString()} · ${p.views || 0} views</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn btn-ghost pf-unstashBtn" data-id="${p.id}">Unsave</button>
          </div>
        </div>
      </div>
    `).join('');
    // wire unsave buttons
    postListEl.querySelectorAll('.pf-unstashBtn').forEach(b => {
      b.addEventListener('click', async () => {
        const pid = b.dataset.id;
        const ok = await unsavePostForUser(uid, pid);
        if (ok) {
          showNotification('Removed from saved', 'success');
          if (window.pushAppNotification) window.pushAppNotification('Saved', 'Removed from saved');
          await showSaved();
        } else showNotification('Failed to remove', 'error');
      });
    });
  }

  async function showLiked() {
    btnPublished.classList.remove('active'); btnSaved.classList.remove('active'); btnLiked.classList.add('active');
    postListEl.innerHTML = '<div class="pf-empty">Loading liked posts...</div>';
    // find liked posts among published posts (inefficient but fine for small projects)
    const liked = [];
    for (const p of posts) {
      const likedByMe = await isPostLikedByUser(p.id, uid);
      if (likedByMe) liked.push(p);
    }
    if (liked.length === 0) {
      postListEl.innerHTML = '<div class="pf-empty">No liked posts</div>';
      return;
    }
    postListEl.innerHTML = liked.map(p => `
      <div class="pf-postItem" data-post-id="${p.id}">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div class="pf-postTitle">${escapeHTML(p.title)}</div>
            <div class="pf-postMeta">${new Date(p.publishedAt?.toDate?.() || p.createdAt?.toDate?.() || new Date()).toLocaleDateString()} · ${p.views || 0} views</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  function wireSaveButtons(){
    postListEl.querySelectorAll('.pf-saveBtn').forEach(b => {
      b.addEventListener('click', async () => {
        const pid = b.dataset.id;
        const ok = await savePostForUser(uid, pid);
        if (ok) {
          showNotification('Saved post', 'success');
          if (window.pushAppNotification) window.pushAppNotification('Saved', 'Post saved to your list');
        }
        else showNotification('Failed to save', 'error');
      });
    });
  }

  // default view
  showSaved();
  btnSaved.addEventListener('click', showSaved);
  btnLiked.addEventListener('click', showLiked);
}
