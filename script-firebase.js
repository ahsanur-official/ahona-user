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
  saveDraft,
  updateDraft,
  getUserDrafts,
} from "../firebase-config.js";
import { renderProfileModalFancy } from "./profile-upgrade.js";

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
const notifBtn = document.getElementById("notifBtn");
const notifPanel = document.getElementById("notifPanel");
const notifList = document.getElementById("notifList");
const notifBadge = document.getElementById("notifBadge");
const clearNotifs = document.getElementById("clearNotifs");

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

function appendCacheBuster(url) {
  if (!url) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${Date.now()}`;
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

// In-app notification center (simple, client-side)
const APP_NOTIFICATIONS = [];
function renderNotifBadge() {
  const n = APP_NOTIFICATIONS.length;
  if (!notifBadge) return;
  notifBadge.textContent = String(n);
  if (n === 0) notifBadge.classList.add('hidden'); else notifBadge.classList.remove('hidden');
}

function renderNotifPanel() {
  if (!notifList) return;
  if (APP_NOTIFICATIONS.length === 0) {
    notifList.innerHTML = '<div style="color:var(--secondary);padding:8px;text-align:center">No notifications</div>';
    return;
  }
  notifList.innerHTML = APP_NOTIFICATIONS.map(n => `<div style="padding:8px;border-bottom:1px solid var(--border)"><div style="font-weight:700">${escapeHTML(n.title)}</div><div style="font-size:13px;color:var(--secondary)">${escapeHTML(n.text)}</div></div>`).join('');
}

window.pushAppNotification = function(title, text){
  APP_NOTIFICATIONS.unshift({title, text, id:Date.now()});
  if (APP_NOTIFICATIONS.length>100) APP_NOTIFICATIONS.length = 100;
  renderNotifBadge();
  renderNotifPanel();
};

if (notifBtn) {
  notifBtn.addEventListener('click', (e) => {
    notifPanel.classList.toggle('hidden');
    notifPanel.setAttribute('aria-hidden', notifPanel.classList.contains('hidden'));
  });
}

if (clearNotifs) {
  clearNotifs.addEventListener('click', () => {
    APP_NOTIFICATIONS.length = 0;
    renderNotifBadge();
    renderNotifPanel();
  });
}

function estimateReadingTime(html) {
  const text =
    new DOMParser().parseFromString(html, "text/html").body.textContent || "";
  const words = text.trim().split(/\s+/).filter(Boolean).length || 0;
  const minutes = Math.max(1, Math.round(words / 200));
  return { words, minutes };
}

function initTypewriter() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targets = Array.from(document.querySelectorAll(".typewriterTarget"));
  if (targets.length === 0 || prefersReduced) return;

  targets.forEach((el, index) => {
    const animation = (el.dataset.animation || "loop").toLowerCase();
    const rawPhrases = el.dataset.phrases || el.textContent || "";
    const phrases = rawPhrases
      .split("|")
      .map((phrase) => phrase.trim())
      .filter(Boolean);

    if (phrases.length === 0) return;

    el.classList.add("typewriter");
    if (animation === "fade") el.classList.add("typewriter--fade");
    el.textContent = "";

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const typeSpeed = 55;
    const deleteSpeed = 28;
    const pause = 1200;
    const fadePause = 700;
    const fadeDuration = 400;

    const tick = () => {
      const phrase = phrases[phraseIndex];

      if (animation === "once") {
        charIndex += 1;
        el.textContent = phrase.slice(0, charIndex);
        if (charIndex === phrase.length) return;
        setTimeout(tick, typeSpeed);
        return;
      }

      if (animation === "fade") {
        charIndex += 1;
        el.textContent = phrase.slice(0, charIndex);
        if (charIndex === phrase.length) {
          setTimeout(() => {
            el.classList.add("tw-fade-out");
            setTimeout(() => {
              el.classList.remove("tw-fade-out");
              phraseIndex = (phraseIndex + 1) % phrases.length;
              charIndex = 0;
              el.textContent = "";
              setTimeout(tick, fadePause);
            }, fadeDuration);
          }, pause);
          return;
        }

        setTimeout(tick, typeSpeed);
        return;
      }

      if (!isDeleting) {
        charIndex += 1;
        el.textContent = phrase.slice(0, charIndex);
        if (charIndex === phrase.length) {
          isDeleting = true;
          setTimeout(tick, pause);
          return;
        }
      } else {
        charIndex -= 1;
        el.textContent = phrase.slice(0, charIndex);
        if (charIndex === 0) {
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
        }
      }

      setTimeout(tick, isDeleting ? deleteSpeed : typeSpeed);
    };

    setTimeout(tick, 400 + index * 500);
  });
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

    // Get comments (support threaded comments with parentId)
    const comments = await getPostComments(post.id);
    // build comment tree map
    const commentsByParent = {};
    comments.forEach(c => {
      const pid = c.parentId || null;
      if (!commentsByParent[pid]) commentsByParent[pid] = [];
      commentsByParent[pid].push(c);
    });
    function renderComment(c) {
      const replies = commentsByParent[c.id] || [];
      return `
        <div class="comment">
          <div class="commentName">${escapeHTML(c.userName)}</div>
          <div class="commentText">${escapeHTML(c.text)}</div>
          ${replies.length > 0 ? `<div class="commentReplies">${replies.slice(0,2).map(r => `
            <div class="comment reply"><div class="commentName">${escapeHTML(r.userName)}</div><div class="commentText">${escapeHTML(r.text)}</div></div>
          `).join('')}${replies.length > 2 ? `<div class="moreReplies">+${replies.length - 2} more</div>` : ''}</div>` : ''}
        </div>`;
    }
    const topComments = (commentsByParent[null] || []).slice(0,3);
    const commentsHTML = topComments.length === 0 ? '<div class="pf-empty">No comments yet</div>' : topComments.map(renderComment).join('');

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
          ${commentsHTML}
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
        if (window.pushAppNotification) window.pushAppNotification('Interaction', 'You unliked a post');
      } else {
        await likePost(postId, auth.currentUser.uid);
        btn.dataset.like = "true";
        btn.classList.add("liked");
        if (window.pushAppNotification) window.pushAppNotification('Interaction', 'You liked a post');
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
      if (window.pushAppNotification) window.pushAppNotification('Comment', 'Your comment was posted');
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

    if (currentUserData.profilePic) {
      const avatarUrl = appendCacheBuster(currentUserData.profilePic);
      userIconBtn.classList.add("has-avatar");
      userIconBtn.style.backgroundImage = `url("${avatarUrl}")`;
      userIconBtn.textContent = "";
    } else {
      userIconBtn.classList.remove("has-avatar");
      userIconBtn.style.backgroundImage = "";
      userIconBtn.textContent = "👤";
    }
  } else {
    loginBtn.classList.remove("hidden");
    registerBtn.classList.remove("hidden");
    userIconBtn.classList.add("hidden");
    userMenu.classList.add("hidden");
    currentUserName.textContent = "";
    userIconBtn.classList.remove("has-avatar");
    userIconBtn.style.backgroundImage = "";
    userIconBtn.textContent = "👤";
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
  const email = document.getElementById("loginEmail").value.trim();
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

profileBtn.addEventListener("click", async () => {
  if (!auth.currentUser || !currentUserData) {
    showNotification("Not signed in", "error");
    return;
  }

  try {
    await renderProfileModalFancy();
  } catch (err) {
    console.error(err);
    showNotification("Unable to open profile", "error");
  }
});

closeProfile.addEventListener("click", () => {
  profileModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
});

logoutBtn.addEventListener("click", async () => {
  await logoutUser();
  showNotification("👋 Logged out successfully!", "success");
  setTimeout(() => window.location.reload(), 1000);
});

// ============================================
// Initialize
// ============================================
initTypewriter();
renderPosts();

// Simple autosave helper for editors: call `window.autoSave.start(selector, uid, intervalMs)`
window.autoSave = (function(){
  let timer = null;
  let currentDraftId = null;
  return {
    start: function(selector, uid, intervalMs = 5000){
      const el = document.querySelector(selector);
      if (!el) return false;
      if (timer) clearInterval(timer);
      timer = setInterval(async () => {
        const content = el.value || el.innerHTML || '';
        if (!content) return;
        try {
          if (!currentDraftId) {
            currentDraftId = await saveDraft(uid, { title: document.title || 'draft', content });
          } else {
            await updateDraft(currentDraftId, { content });
          }
        } catch (err) { console.error(err); }
      }, intervalMs);
      return true;
    },
    stop: function(){ if (timer) clearInterval(timer); timer = null; currentDraftId = null; }
  };
})();