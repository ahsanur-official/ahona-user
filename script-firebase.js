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
  return String(s).replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[m],
  );
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
  notification.setAttribute('role', 'alert');
  notification.setAttribute('aria-live', 'polite');
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "notificationSlideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// In-app notification center (simple, client-side)
const APP_NOTIFICATIONS = [];
function renderNotifBadge() {
  const n = APP_NOTIFICATIONS.length;
  if (!notifBadge) return;
  
  if (n === 0) {
    notifBadge.classList.add("hidden");
  } else {
    notifBadge.classList.remove("hidden");
    notifBadge.textContent = n > 99 ? "99+" : String(n);
    notifBadge.title = `${n} notification${n !== 1 ? "s" : ""}`;
    // Add bounce animation for new notifications
    notifBadge.style.animation = "none";
    setTimeout(() => {
      notifBadge.style.animation = "badgePulse 0.6s ease";
    }, 10);
  }
}

function renderNotifPanel() {
  if (!notifList) return;
  if (APP_NOTIFICATIONS.length === 0) {
    notifList.innerHTML =
      '<div style="color:var(--secondary);padding:12px;text-align:center;font-style:italic">No notifications</div>';
    return;
  }
  notifList.innerHTML = APP_NOTIFICATIONS.map(
    (n, index) =>
      `<div style="animation:slideInUp ${0.3 + index * 0.05}s ease forwards"><div style="font-weight:700;color:var(--accent-primary);margin-bottom:4px;font-size:14px">${escapeHTML(n.title)}</div><div style="font-size:13px;color:var(--secondary);line-height:1.5">${escapeHTML(n.text)}</div></div>`,
  ).join("");
}

window.pushAppNotification = function (title, text) {
  APP_NOTIFICATIONS.unshift({ title, text, id: Date.now() });
  if (APP_NOTIFICATIONS.length > 100) APP_NOTIFICATIONS.length = 100;
  renderNotifBadge();
  renderNotifPanel();
};

if (notifBtn) {
  notifBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    notifPanel.classList.toggle("hidden");
    notifPanel.setAttribute(
      "aria-hidden",
      notifPanel.classList.contains("hidden"),
    );
    userMenu.classList.add("hidden");
    userMenu.setAttribute("aria-hidden", "true");
  });
}

// Close notification panel when clicking outside
document.addEventListener("click", (e) => {
  if (notifBtn && notifPanel && !notifBtn.contains(e.target) && !notifPanel.contains(e.target)) {
    notifPanel.classList.add("hidden");
    notifPanel.setAttribute("aria-hidden", "true");
  }
  if (userIconBtn && userMenu && !userIconBtn.contains(e.target) && !userMenu.contains(e.target)) {
    userMenu.classList.add("hidden");
    userMenu.setAttribute("aria-hidden", "true");
  }
});

if (clearNotifs) {
  clearNotifs.addEventListener("click", () => {
    APP_NOTIFICATIONS.length = 0;
    renderNotifBadge();
    renderNotifPanel();
    showNotification("All notifications cleared!", "info");
    // Close notification panel
    if (notifPanel) {
      notifPanel.classList.add("hidden");
      notifPanel.setAttribute("aria-hidden", "true");
    }
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
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
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
    await renderFeaturedPosts();
    await renderPosts();
  } else {
    currentUserData = null;
    updateTopbar();
  }
  
  // Setup filters and search
  setupFilterButtons();
  setupSearchInput();
  
  // Initial render
  if (allPosts.length === 0) {
    await renderFeaturedPosts();
    await renderPosts();
  }
});

// ============================================
// Filter & Search Functionality
// ============================================
let allPosts = [];
let currentFilter = "all";

async function filterAndSearchPosts() {
  let filteredPosts = allPosts;
  
  // Apply category filter
  if (currentFilter !== "all") {
    filteredPosts = filteredPosts.filter(post => post.category === currentFilter);
  }
  
  // Apply search filter
  const searchInput = document.getElementById("searchInput");
  if (searchInput && searchInput.value.trim()) {
    const searchTerm = searchInput.value.toLowerCase().trim();
    filteredPosts = filteredPosts.filter(post => 
      post.title.toLowerCase().includes(searchTerm) ||
      (post.excerpt || post.content).toLowerCase().includes(searchTerm) ||
      (post.tags || []).some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }
  
  // Add loading animation
  if (postsRoot) {
    postsRoot.style.opacity = "0.5";
  }
  
  await renderPosts(filteredPosts);
  
  // Remove loading animation
  if (postsRoot) {
    postsRoot.style.opacity = "1";
  }
}

// Setup filter button listeners
function setupFilterButtons() {
  const filterBtns = document.querySelectorAll(".filterBtn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.category || "all";
      filterAndSearchPosts();
    });
  });
}

// Setup search input listener
function setupSearchInput() {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      filterAndSearchPosts();
    });
  }
}

// Render featured posts
async function renderFeaturedPosts() {
  const featuredPosts = document.getElementById("featuredPosts");
  if (!featuredPosts) return;
  
  let posts = await getPublishedPosts();
  const topPosts = posts
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, 3);
  
  if (topPosts.length === 0) {
    featuredPosts.innerHTML = "";
    return;
  }
  
  featuredPosts.innerHTML = `<h2>✨ Featured Stories</h2><div class="featuredGrid"></div>`;
  const grid = featuredPosts.querySelector(".featuredGrid");
  
  for (const post of topPosts) {
    const card = document.createElement("article");
    card.className = "post card featured";
    card.style.cursor = "pointer";
    
    const categoryIcon =
      post.category === "Novel" ? "📖" : post.category === "Poem" ? "✍️" : "📝";
    
    card.innerHTML = `
      <div class="postHeader">
        <h4 class="postTitle">${escapeHTML(post.title)}</h4>
        <div class="postMeta" style="flex-wrap: wrap;">
          ${post.category ? `<span class="moodTag" style="background:rgba(67,123,157,0.15);color:#457b9d">${categoryIcon} ${post.category}</span>` : ""}
          <span style="margin-top:8px">👁️ ${post.views || 0} · ♥ ${post.likes || 0}</span>
        </div>
      </div>
      <p style="color:var(--text);line-height:1.6;margin:12px 0;font-size:13px">
        ${escapeHTML((post.excerpt || post.content).substring(0, 80))}...
      </p>
    `;
    
    grid.appendChild(card);
  }
}

// ============================================
// Render Posts
// ============================================
async function renderPosts(postsToRender = null) {
  if (postsToRender === null) {
    allPosts = await getPublishedPosts();
    postsToRender = allPosts;
  }

  let posts = postsToRender;

  if (posts.length === 0) {
    postsRoot.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--secondary)">
        <div style="font-size:48px;margin-bottom:16px">📚</div>
        <h2 style="margin:0 0 12px 0;color:var(--text);font-size:24px">${currentFilter === "all" ? "No Stories Yet" : "No Stories Found"}</h2>
        <p style="margin:0;font-size:15px">${currentFilter === "all" ? "Stories will appear here once published." : `No ${currentFilter}s match your filter.`}</p>
      </div>
    `;
    return;
  }

  postsRoot.innerHTML = "";

  for (const post of posts) {
    const el = document.createElement("article");
    el.className = "post card";

    const categoryIcon =
      post.category === "Novel" ? "📖" : post.category === "Poem" ? "✍️" : "📝";

    // Check if user liked this post
    let isLiked = false;
    if (auth.currentUser) {
      isLiked = await isPostLikedByUser(post.id, auth.currentUser.uid);
    }

    // Get comments (support threaded comments with parentId)
    const comments = await getPostComments(post.id);
    // build comment tree map
    const commentsByParent = {};
    comments.forEach((c) => {
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
          ${
            replies.length > 0
              ? `<div class="commentReplies">${replies
                  .slice(0, 2)
                  .map(
                    (r) => `
            <div class="comment reply"><div class="commentName">${escapeHTML(r.userName)}</div><div class="commentText">${escapeHTML(r.text)}</div></div>
          `,
                  )
                  .join(
                    "",
                  )}${replies.length > 2 ? `<div class="moreReplies">+${replies.length - 2} more</div>` : ""}</div>`
              : ""
          }
        </div>`;
    }
    const topComments = (commentsByParent[null] || []).slice(0, 3);
    const commentsHTML =
      topComments.length === 0
        ? '<div class="pf-empty">No comments yet</div>'
        : topComments.map(renderComment).join("");

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
        if (window.pushAppNotification)
          window.pushAppNotification("Interaction", "You unliked a post");
      } else {
        await likePost(postId, auth.currentUser.uid);
        btn.dataset.like = "true";
        btn.classList.add("liked");
        if (window.pushAppNotification)
          window.pushAppNotification("Interaction", "You liked a post");
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
      if (window.pushAppNotification)
        window.pushAppNotification("Comment", "Your comment was posted");
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
  const confirmPassword = document.getElementById(
    "registerConfirmPassword",
  ).value;

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

// ============================================
// About Author Modal
// ============================================
const aboutModal = document.getElementById("aboutModal");
const aboutContent = document.getElementById("aboutContent");
const closeAbout = document.getElementById("closeAbout");
const aboutAuthorBtn = document.getElementById("aboutAuthorBtn");

function renderAboutAuthor() {
  const html = `
    <div class="aboutAuthorCard">
      <div class="aboutAuthorAvatar">📚</div>
      <div class="aboutAuthorInfo">
        <h4>Ahona Islam</h4>
        <p>Author, Poet & Literary Curator</p>
        <p style="font-size:12px;color:var(--secondary);margin-top:8px">Passionate storyteller sharing beautiful narratives with the world</p>
      </div>
    </div>

    <div class="aboutSection">
      <h5>About</h5>
      <p>Ahona Islam is a dedicated author and poet committed to crafting meaningful stories, heartfelt poems, and insightful literary works. With a passion for language and storytelling, Ahona creates content that resonates with readers and inspires imagination.</p>
    </div>

    <div class="aboutSection">
      <h5>Mission</h5>
      <p>To create a vibrant community where writers and readers connect, share, and celebrate the beauty of literature. Every story is an opportunity to inspire, challenge, and transform perspectives through the power of words.</p>
    </div>

    <div class="aboutSection">
      <h5>Categories</h5>
      <p><strong>Novels</strong> — Immersive long-form narratives exploring human emotions and experiences.<br><strong>Poems</strong> — Lyrical expressions capturing moments, feelings, and reflections.<br><strong>Short Stories</strong> — Concise, powerful tales that deliver impact and insight.</p>
    </div>

    <div class="aboutSection">
      <h5>Connect</h5>
      <p>Follow Ahona for the latest releases, writing updates, and literary discussions across social media. Every story shared is crafted with care and passion for you to enjoy.</p>
    </div>
  `;

  aboutContent.innerHTML = html;
  aboutModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

aboutAuthorBtn.addEventListener("click", () => {
  renderAboutAuthor();
});

closeAbout.addEventListener("click", () => {
  aboutModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
});

aboutModal.addEventListener("click", (e) => {
  if (e.target === aboutModal) {
    aboutModal.classList.add("hidden");
    document.body.classList.remove("modal-open");
  }
});

logoutBtn.addEventListener("click", async () => {
  await logoutUser();
  showNotification("👋 Logged out successfully!", "success");
  setTimeout(() => window.location.reload(), 1000);
});

// ============================================
// Footer Modal Functions
// ============================================

function openModal(modalId, title, content) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  const contentArea = modal.querySelector(".modalBody");
  if (contentArea) contentArea.innerHTML = content;
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("hidden");
    document.body.classList.remove("modal-open");
  }
}

// FAQ
document.getElementById("faqLink")?.addEventListener("click", (e) => {
  e.preventDefault();
  const faqContent = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="faqItem">
        <h4 style="margin:0 0 8px 0;color:var(--accent-primary)">How do I publish a story?</h4>
        <p style="margin:0;color:var(--secondary);font-size:14px;line-height:1.6">Log in to your account, navigate to the editor, write your story, add metadata (title, category, mood, tags), and click "Publish" to share with the community.</p>
      </div>
      <div class="faqItem">
        <h4 style="margin:0 0 8px 0;color:var(--accent-primary)">Can I edit my published stories?</h4>
        <p style="margin:0;color:var(--secondary);font-size:14px;line-height:1.6">Yes! Visit your profile, find the story you want to edit, and click "Edit". Your changes will be saved immediately.</p>
      </div>
      <div class="faqItem">
        <h4 style="margin:0 0 8px 0;color:var(--accent-primary)">How do I save my drafts?</h4>
        <p style="margin:0;color:var(--secondary);font-size:14px;line-height:1.6">The editor automatically saves your work as drafts. You can also manually save from the editor interface. Drafts are only visible to you.</p>
      </div>
      <div class="faqItem">
        <h4 style="margin:0 0 8px 0;color:var(--accent-primary)">What are the categories?</h4>
        <p style="margin:0;color:var(--secondary);font-size:14px;line-height:1.6">We have three main categories: Novels (long-form), Poems (lyrical), and Short Stories (concise narratives). Choose the one that best fits your work.</p>
      </div>
      <div class="faqItem">
        <h4 style="margin:0 0 8px 0;color:var(--accent-primary)">How can I interact with other stories?</h4>
        <p style="margin:0;color:var(--secondary);font-size:14px;line-height:1.6">You can like, comment, and save stories. Engage respectfully with the community to build meaningful connections with other writers and readers.</p>
      </div>
      <div class="faqItem">
        <h4 style="margin:0 0 8px 0;color:var(--accent-primary)">Is my content protected?</h4>
        <p style="margin:0;color:var(--secondary);font-size:14px;line-height:1.6">Yes, all published content is protected by copyright. Ahona Islam respects intellectual property rights of all creators.</p>
      </div>
    </div>
  `;
  openModal("faqModal", "FAQ", faqContent);
});

// Writing Tips
document.getElementById("writingTipsLink")?.addEventListener("click", (e) => {
  e.preventDefault();
  const tipsContent = `
    <div style="display:flex;flex-direction:column;gap:20px">
      <div class="tipSection">
        <h4 style="margin:0 0 10px 0;color:var(--accent-primary);font-size:16px">📖 Story Structure</h4>
        <p style="margin:0;color:var(--secondary);font-size:14px;line-height:1.7">Start with a compelling hook, develop your characters gradually, create conflict that drives the narrative forward, and resolve with a meaningful ending. Remember, every scene should serve a purpose.</p>
      </div>
      <div class="tipSection">
        <h4 style="margin:0 0 10px 0;color:var(--accent-primary);font-size:16px">✍️ Writing Craft</h4>
        <p style="margin:0;color:var(--secondary);font-size:14px;line-height:1.7">Show, don't tell. Use vivid descriptions and active verbs. Vary your sentence structure. Read your work aloud to catch awkward phrasing. Edit ruthlessly—the best writers are fierce editors.</p>
      </div>
      <div class="tipSection">
        <h4 style="margin:0 0 10px 0;color:var(--accent-primary);font-size:16px">💡 Finding Inspiration</h4>
        <p style="margin:0;color:var(--secondary);font-size:14px;line-height:1.7">Write about what moves you. Observe real life, explore emotions, read widely, and don't be afraid to write badly at first. The magic happens in revision, not the first draft.</p>
      </div>
      <div class="tipSection">
        <h4 style="margin:0 0 10px 0;color:var(--accent-primary);font-size:16px">🎯 Poetry Tips</h4>
        <p style="margin:0;color:var(--secondary);font-size:14px;line-height:1.7">Use imagery to evoke emotion. Experiment with rhythm and form. Poetry is about compression—every word matters. Read poetry aloud to feel the cadence.</p>
      </div>
      <div class="tipSection">
        <h4 style="margin:0 0 10px 0;color:var(--accent-primary);font-size:16px">⚡ Short Story Magic</h4>
        <p style="margin:0;color:var(--secondary);font-size:14px;line-height:1.7">Hook readers immediately. Focus on one central conflict. Every detail counts. Surprise your reader with a twist or revelation. A great short story resonates long after reading.</p>
      </div>
    </div>
  `;
  openModal("tipsModal", "Writing Tips", tipsContent);
});

// Privacy Policy
document.getElementById("privacyLink")?.addEventListener("click", (e) => {
  e.preventDefault();
  const privacyContent = `
    <div style="color:var(--secondary);font-size:13px;line-height:1.8">
      <h4 style="color:var(--accent-primary);margin-bottom:12px">1. Information We Collect</h4>
      <p style="margin-bottom:16px">We collect information you provide directly, such as your name, email, username, and profile information. We also automatically collect usage data and analytics about how you interact with our platform.</p>
      
      <h4 style="color:var(--accent-primary);margin-bottom:12px">2. How We Use Your Information</h4>
      <p style="margin-bottom:16px">We use your information to provide and improve our services, personalize your experience, communicate with you, and ensure platform security. We never sell or share your data with third parties without consent.</p>
      
      <h4 style="color:var(--accent-primary);margin-bottom:12px">3. Data Security</h4>
      <p style="margin-bottom:16px">Your data is encrypted and stored securely. We implement industry-standard security measures to protect your information from unauthorized access, alteration, or disclosure.</p>
      
      <h4 style="color:var(--accent-primary);margin-bottom:12px">4. Your Rights</h4>
      <p style="margin-bottom:16px">You have the right to access, modify, or delete your personal data. You can update your profile settings anytime. Contact support for data deletion requests.</p>
      
      <h4 style="color:var(--accent-primary);margin-bottom:12px">5. Cookies</h4>
      <p style="margin-bottom:16px">We use cookies to enhance your experience and remember your preferences. You can manage cookie settings in your browser.</p>
      
      <p style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);font-style:italic">Last updated: January 2024</p>
    </div>
  `;
  openModal("privacyModal", "Privacy Policy", privacyContent);
});

// Terms of Service
document.getElementById("termsLink")?.addEventListener("click", (e) => {
  e.preventDefault();
  const termsContent = `
    <div style="color:var(--secondary);font-size:13px;line-height:1.8">
      <h4 style="color:var(--accent-primary);margin-bottom:12px">1. User Agreement</h4>
      <p style="margin-bottom:16px">By using Ahona Islam, you agree to these terms and conditions. If you do not agree, please do not use our services. We reserve the right to modify these terms at any time.</p>
      
      <h4 style="color:var(--accent-primary);margin-bottom:12px">2. Content Ownership</h4>
      <p style="margin-bottom:16px">You retain full ownership of the content you create and publish. By publishing on our platform, you grant us a license to display your work to the community. All content is protected by copyright.</p>
      
      <h4 style="color:var(--accent-primary);margin-bottom:12px">3. Community Guidelines</h4>
      <p style="margin-bottom:16px">Be respectful. No harassment, hate speech, or inappropriate content. Respect others' intellectual property. Violations may result in content removal or account suspension.</p>
      
      <h4 style="color:var(--accent-primary);margin-bottom:12px">4. Acceptable Use</h4>
      <p style="margin-bottom:16px">Do not use the platform for illegal activities, spam, malware, or unauthorized access. Do not plagiarize or claim others' work as your own.</p>
      
      <h4 style="color:var(--accent-primary);margin-bottom:12px">5. Liability Disclaimer</h4>
      <p style="margin-bottom:16px">Ahona Islam is provided "as is" without warranties. We are not liable for indirect damages or lost data. Users assume all risks of platform use.</p>
      
      <p style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);font-style:italic">Last updated: January 2024</p>
    </div>
  `;
  openModal("termsModal", "Terms of Service", termsContent);
});

// Popular Tags
document.getElementById("popularTagsLink")?.addEventListener("click", (e) => {
  e.preventDefault();
  const tags = [
    "love",
    "inspiration",
    "poetry",
    "fiction",
    "adventure",
    "romance",
    "mystery",
    "fantasy",
    "drama",
    "motivation",
    "life",
    "hope",
    "emotions",
    "nature",
    "culture",
    "reflection",
    "dreams",
    "journey",
  ];
  const tagsContent = `
    <div style="display:flex;flex-wrap:wrap;gap:10px">
      ${tags
        .map(
          (tag) => `
        <button class="tagButton" style="padding:8px 16px;border-radius:20px;border:2px solid var(--accent-primary);background:transparent;color:var(--accent-primary);cursor:pointer;font-size:13px;font-weight:600;transition:all 0.3s ease" onclick="this.style.background='var(--accent-primary)';this.style.color='white'">
          #${tag}
        </button>
      `,
        )
        .join("")}
    </div>
    <p style="margin-top:20px;color:var(--secondary);font-size:13px;text-align:center">Click any tag to filter stories. Tags help organize content by themes and interests.</p>
  `;
  openModal("tagsModal", "Popular Tags", tagsContent);
});

// Browse Stories
document.getElementById("browseStoriesLink")?.addEventListener("click", (e) => {
  e.preventDefault();
  closeModal("faqModal");
  closeModal("tipsModal");
  closeModal("privacyModal");
  closeModal("termsModal");
  closeModal("tagsModal");
  // Scroll to posts section
  const postsSection = document.getElementById("posts");
  if (postsSection) {
    postsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

// Categories
document.getElementById("categoriesLink")?.addEventListener("click", (e) => {
  e.preventDefault();
  closeModal("faqModal");
  closeModal("tipsModal");
  closeModal("privacyModal");
  closeModal("termsModal");
  closeModal("tagsModal");
  // Click the first category filter
  const categoryButtons = document.querySelectorAll(".filterBtn");
  if (categoryButtons.length > 0) {
    categoryButtons[1]?.click();
    document
      .querySelector(".filterSection")
      ?.scrollIntoView({ behavior: "smooth" });
  }
});

// Community
document.getElementById("communityLink")?.addEventListener("click", (e) => {
  e.preventDefault();
  showNotification(
    "🌍 Join our growing community of writers and readers worldwide!",
    "info",
  );
  closeModal("faqModal");
  closeModal("tipsModal");
  closeModal("privacyModal");
  closeModal("termsModal");
  closeModal("tagsModal");
});

// Close modal buttons
document
  .getElementById("closeFaq")
  ?.addEventListener("click", () => closeModal("faqModal"));
document
  .getElementById("closeTips")
  ?.addEventListener("click", () => closeModal("tipsModal"));
document
  .getElementById("closePrivacy")
  ?.addEventListener("click", () => closeModal("privacyModal"));
document
  .getElementById("closeTerms")
  ?.addEventListener("click", () => closeModal("termsModal"));
document
  .getElementById("closeTags")
  ?.addEventListener("click", () => closeModal("tagsModal"));

// Close on background click
document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal(modal.id);
    }
  });
});
// ============================================
// Initialize
// ============================================
initTypewriter();
renderPosts();

// ...existing code...
window.autoSave = (function () {
  let timer = null;
  let currentDraftId = null;
  return {
    start: function (selector, uid, intervalMs = 5000) {
      const el = document.querySelector(selector);
      if (!el) return false;
      if (timer) clearInterval(timer);
      timer = setInterval(async () => {
        const content = el.value || el.innerHTML || "";
        if (!content) return;
        try {
          if (!currentDraftId) {
            currentDraftId = await saveDraft(uid, {
              title: document.title || "draft",
              content,
            });
          } else {
            await updateDraft(currentDraftId, { content });
          }
        } catch (err) {
          console.error(err);
        }
      }, intervalMs);
      return true;
    },
    stop: function () {
      if (timer) clearInterval(timer);
      timer = null;
      currentDraftId = null;
    },
  };
})();
