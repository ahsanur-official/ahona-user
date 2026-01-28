// ============================================
// AHONA BLOG - USER PANEL (Firebase Ready)
// ============================================
import {
  auth,
  registerUser,
  loginUser,
  logoutUser,
  onAuthStateChange,
  getUserData,
  updateUserProfile,
  getPublishedPosts,
  incrementViewCount,
  likePost,
  unlikePost,
  isPostLikedByUser,
  addComment,
  getPostComments,
} from "../firebase-config.js";

// ============================================
// DOM Elements
// ============================================
const postsRoot = document.getElementById("posts");
const toggleTheme = document.getElementById("toggleTheme");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const userIconBtn = document.getElementById("userIconBtn");
const authModalOverlay = document.getElementById("authModalOverlay");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const cancelLogin = document.getElementById("cancelLogin");
const cancelRegister = document.getElementById("cancelRegister");
const userArea = document.getElementById("userArea");
const userMenu = document.getElementById("userMenu");
const currentUserName = document.getElementById("currentUserName");
const profileBtn = document.getElementById("profileBtn");
const logoutBtn = document.getElementById("logoutBtn");
const profileModal = document.getElementById("profileModal");
const closeProfile = document.getElementById("closeProfile");
const profileContent = document.getElementById("profileContent");

// ============================================
// State
// ============================================
let currentUserData = null;
const SETTINGS_KEY = "ahona_settings";

// ============================================
// Helpers
// ============================================
function escapeHTML(s) {
  return String(s)
    .replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[m]);
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    padding: 12px 16px;
    background: var(--card);
    border: 2px solid ${type === "success" ? "var(--accent-success)" : "var(--accent-primary)"};
    border-radius: 8px;
    color: var(--text);
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function estimateReadingTime(html) {
  const text =
    new DOMParser().parseFromString(html, "text/html").body.textContent || "";
  const words = text.trim().split(/\s+/).filter(Boolean).length || 0;
  const minutes = Math.max(1, Math.round(words / 200));
  return { words, minutes };
}

// ============================================
// Theme Management
// ============================================
function applyTheme(theme) {
  if (theme === "dark") document.body.classList.add("dark");
  else document.body.classList.remove("dark");
  toggleTheme.textContent = theme === "dark" ? "☀️" : "🌙";
}

toggleTheme.addEventListener("click", () => {
  const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
  settings.theme = settings.theme === "dark" ? "light" : "dark";
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  applyTheme(settings.theme);
});

// Initialize theme
const initialSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
applyTheme(initialSettings.theme || "light");

// ============================================
// Firebase Auth State
// ============================================
onAuthStateChange(async (firebaseUser) => {
  if (firebaseUser) {
    currentUserData = await getUserData(firebaseUser.uid);
    updateTopbar();
    await renderPosts();
  } else {
    currentUserData = null;
    updateTopbar();
  }
});

// ============================================
// Render Posts
// ============================================
async function renderPosts() {
  let posts = await getPublishedPosts();

  if (posts.length === 0) {
    postsRoot.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--secondary)">
        <div style="font-size:48px;margin-bottom:16px">📚</div>
        <h2 style="margin:0 0 12px 0;color:var(--text);font-size:24px">No Stories Yet</h2>
        <p style="margin:0;font-size:15px">Stories will appear here once published.</p>
      </div>
    `;
    return;
  }

  postsRoot.innerHTML = "";

  for (const post of posts) {
    const el = document.createElement("article");
    el.className = "post card";

    const categoryIcon =
      post.category === "Novel"
        ? "📖"
        : post.category === "Poem"
          ? "✍️"
          : "📝";

    // Check if user liked this post
    let isLiked = false;
    if (auth.currentUser) {
      isLiked = await isPostLikedByUser(post.id, auth.currentUser.uid);
    }

    // Get comments
    const comments = await getPostComments(post.id);

    const tagsHTML =
      (post.tags || []).length > 0
        ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">
          ${post.tags.map((tag) => `<span class="tagBadge">#${tag}</span>`).join("")}
        </div>`
        : "";

    el.innerHTML = `
      <div class="postHeader">
        <h3 class="postTitle">${escapeHTML(post.title)}</h3>
        <div class="postMeta">
          <span>${new Date(post.publishedAt?.toDate?.() || new Date()).toLocaleDateString()}</span>
          ${post.category ? `<span class="moodTag" style="background:rgba(67,123,157,0.15);color:#457b9d">${categoryIcon} ${post.category}</span>` : ""}
          ${post.mood ? `<span class="moodTag" style="background:rgba(230,57,70,0.15);color:#e63946">${post.mood}</span>` : ""}
          <span>by ${escapeHTML(post.authorName)}</span>
        </div>
      </div>

      <div class="postContent">
        <p style="color:var(--text);line-height:1.6;margin:12px 0">
          ${escapeHTML((post.excerpt || post.content).substring(0, 150))}...
        </p>
      </div>

      ${tagsHTML}

      <div class="actionsRow">
        <button class="likeBtn ${isLiked ? "liked" : ""}" data-post-id="${post.id}" data-like="${isLiked}">
          <span class="heart">♥</span>
          <span class="count">${post.likes || 0}</span>
        </button>
        <div class="postMeta">
          <span>👁️ ${post.views || 0} · ⏱️ ${post.readingTime || 1} min · 💬 ${comments.length}</span>
        </div>
      </div>

      <div class="comments" data-post-id="${post.id}">
        <div class="commentList">
          ${comments
            .slice(0, 3)
            .map(
              (c) =>
                `<div class="comment">
                <div class="commentName">${escapeHTML(c.userName)}</div>
                <div class="commentText">${escapeHTML(c.text)}</div>
              </div>`
            )
            .join("")}
        </div>
        <form class="commentForm" data-post-id="${post.id}">
          ${auth.currentUser ? "" : `<input name="name" placeholder="Name (optional)"/>`}
          <textarea name="text" placeholder="Write a kind thought..."></textarea>
          <button type="submit">Comment</button>
        </form>
      </div>
    `;

    postsRoot.appendChild(el);

    // Like button handler
    el.querySelector(".likeBtn").addEventListener("click", async () => {
      if (!auth.currentUser) {
        showNotification("Please log in to react", "error");
        return;
      }

      const btn = el.querySelector(".likeBtn");
      const postId = btn.dataset.postId;
      const isCurrentlyLiked = btn.dataset.like === "true";

      if (isCurrentlyLiked) {
        await unlikePost(postId, auth.currentUser.uid);
        btn.dataset.like = "false";
        btn.classList.remove("liked");
      } else {
        await likePost(postId, auth.currentUser.uid);
        btn.dataset.like = "true";
        btn.classList.add("liked");
      }

      await renderPosts();
    });

    // Comment form handler
    el.querySelector(".commentForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const postId = form.dataset.postId;
      const name = auth.currentUser
        ? currentUserData?.displayName || auth.currentUser.email
        : form.elements.name?.value || "Anonymous";
      const text = form.elements.text.value.trim();

      if (!text) return;

      await addComment(postId, auth.currentUser?.uid || "", name, text);
      form.reset();
      await renderPosts();
    });

    // Increment view on scroll into view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          incrementViewCount(post.id);
          observer.unobserve(entry.target);
        }
      });
    });
    observer.observe(el);
  }
}

// ============================================
// Auth UI
// ============================================
function updateTopbar() {
  const user = auth.currentUser;

  if (user && currentUserData) {
    loginBtn.classList.add("hidden");
    registerBtn.classList.add("hidden");
    userIconBtn.classList.remove("hidden");
    currentUserName.textContent = `Signed in: ${currentUserData.displayName || user.email}`;
  } else {
    loginBtn.classList.remove("hidden");
    registerBtn.classList.remove("hidden");
    userIconBtn.classList.add("hidden");
    userMenu.classList.add("hidden");
    currentUserName.textContent = "";
  }
}

// ============================================
// Auth Forms
// ============================================
function switchToLogin() {
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  loginForm.reset();
}

function switchToRegister() {
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  registerForm.reset();
}

window.switchToRegister = switchToRegister;

loginBtn.addEventListener("click", () => {
  switchToLogin();
  authModalOverlay.classList.remove("hidden");
});

registerBtn.addEventListener("click", () => {
  switchToRegister();
  authModalOverlay.classList.remove("hidden");
});

cancelLogin.addEventListener("click", () => {
  authModalOverlay.classList.add("hidden");
  loginForm.reset();
});

cancelRegister.addEventListener("click", () => {
  authModalOverlay.classList.add("hidden");
  registerForm.reset();
});

authModalOverlay.addEventListener("click", (e) => {
  if (e.target === authModalOverlay) {
    authModalOverlay.classList.add("hidden");
  }
});

// Login form
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    await loginUser(email, password);
    authModalOverlay.classList.add("hidden");
    loginForm.reset();
    showNotification("✅ Logged in successfully!", "success");
  } catch (error) {
    showNotification(`❌ ${error.message}`, "error");
  }
});

// Register form
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fullName = document.getElementById("registerName").value.trim();
  const username = document.getElementById("registerUsername").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  const confirmPassword =
    document.getElementById("registerConfirmPassword").value;

  if (!fullName || !username || !email || !password || !confirmPassword) {
    showNotification("⚠️ Please fill all fields", "error");
    return;
  }

  if (password !== confirmPassword) {
    showNotification("⚠️ Passwords do not match", "error");
    return;
  }

  if (password.length < 6) {
    showNotification("⚠️ Password must be at least 6 characters", "error");
    return;
  }

  try {
    await registerUser(email, password, username, fullName);
    authModalOverlay.classList.add("hidden");
    registerForm.reset();
    showNotification("✅ Account created successfully!", "success");
  } catch (error) {
    showNotification(`❌ ${error.message}`, "error");
  }
});

// ============================================
// User Menu
// ============================================
userIconBtn.addEventListener("click", () => {
  userMenu.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
  if (!userIconBtn.contains(e.target) && !userMenu.contains(e.target)) {
    userMenu.classList.add("hidden");
  }
});

profileBtn.addEventListener("click", () => {
  if (!auth.currentUser || !currentUserData) {
    showNotification("Not signed in", "error");
    return;
  }

  profileContent.innerHTML = `
    <div style="background:var(--soft);padding:16px;border-radius:12px;margin-bottom:16px">
      <h3 style="margin:0 0 12px 0;color:var(--accent-primary)">👤 Profile</h3>
      <p><strong>Name:</strong> ${escapeHTML(currentUserData.displayName || "Not set")}</p>
      <p><strong>Email:</strong> ${escapeHTML(auth.currentUser.email)}</p>
      <p><strong>Bio:</strong> ${escapeHTML(currentUserData.bio || "Not set")}</p>
      <p><strong>Member Since:</strong> ${new Date(currentUserData.createdAt?.toDate?.() || new Date()).toLocaleDateString()}</p>
    </div>
  `;

  profileModal.classList.remove("hidden");
});

closeProfile.addEventListener("click", () => {
  profileModal.classList.add("hidden");
});

logoutBtn.addEventListener("click", async () => {
  await logoutUser();
  showNotification("👋 Logged out successfully!", "success");
  setTimeout(() => window.location.reload(), 1000);
});

// ============================================
// Initialize
// ============================================
renderPosts();
