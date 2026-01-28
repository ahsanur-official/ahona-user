import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// User Panel - Stories & Poems Reading
// Vanilla JS - read-only user interface; no post creation allowed

// Storage keys (shared with main app)
const POSTS_KEY = "diary_posts_v1";
const LIKES_KEY = "diary_likes_v1";
const COMMENTS_KEY = "diary_comments_v1";
const SETTINGS_KEY = "diary_settings_v1";
const USERS_KEY = "diary_users_v1";
const SESSION_KEY = "diary_session_v1";

// Elements
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

// Helpers for storage
function loadJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch (e) {
    return {};
  }
}
function saveJSON(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function loadPosts() {
  return JSON.parse(localStorage.getItem(POSTS_KEY) || "[]");
}

function loadUsers() {
  return loadJSON(USERS_KEY);
}
function saveUsers(u) {
  saveJSON(USERS_KEY, u);
}

function setSession(username) {
  localStorage.setItem(SESSION_KEY, username);
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
function getSession() {
  return localStorage.getItem(SESSION_KEY);
}

// Reading time estimation (200 words per minute)
function estimateReadingTime(html) {
  const text =
    new DOMParser().parseFromString(html, "text/html").body.textContent || "";
  const words = text.trim().split(/\s+/).filter(Boolean).length || 0;
  const minutes = Math.max(1, Math.round(words / 200));
  return { words, minutes };
}

// simple HTML escaper for comment text
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, function (m) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m];
  });
}

// UI helpers
function show(el) {
  if (!el) return;
  el.classList.remove("hidden");
}
function hide(el) {
  if (!el) return;
  el.classList.add("hidden");
}

function currentUser() {
  const username = getSession();
  if (!username) return null;
  const users = loadUsers();
  return users[username] ? { username, ...users[username] } : null;
}

// Render all posts (latest first) - READ ONLY
function renderPosts() {
  let posts = loadPosts();
  const likes = loadJSON(LIKES_KEY);
  const comments = loadJSON(COMMENTS_KEY);
  const me = currentUser();
  postsRoot.innerHTML = "";

  // Filter to only published posts
  posts = posts.filter((p) => p.published === true);

  // sort by createdAt desc
  posts.sort((a, b) => b.createdAt - a.createdAt);

  if (posts.length === 0) {
    postsRoot.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--secondary)">
        <div style="font-size:48px;margin-bottom:16px">📚</div>
        <h2 style="margin:0 0 12px 0;color:var(--text);font-size:24px">No Stories Yet</h2>
        <p style="margin:0;font-size:15px">Stories from Ahona Islam will appear here once they're published.</p>
      </div>
    `;
    updateTopbar();
    return;
  }

  posts.forEach((post) => {
    const el = document.createElement("article");
    el.className = "post card";

    // header
    const header = document.createElement("div");
    header.className = "postHeader";
    const title = document.createElement("h3");
    title.className = "postTitle";
    title.textContent = post.title || "Untitled";
    const meta = document.createElement("div");
    meta.className = "postMeta";
    const date = new Date(post.date).toLocaleDateString();
    const categoryIcon =
      post.category === "Novel"
        ? "📖"
        : post.category === "Poem"
          ? "✍️"
          : post.category === "Short Story"
            ? "📝"
            : "📝";
    meta.innerHTML = `<div>${date}</div>`;
    if (post.category)
      meta.innerHTML += `<span class="moodTag" style="background:rgba(67,123,157,0.15);color:var(--accent-tertiary)">${categoryIcon} ${post.category}</span>`;
    if (post.mood)
      meta.innerHTML += `<span class="moodTag">${post.mood}</span>`;
    // show author
    if (post.author)
      meta.innerHTML += `<span style="margin-left:8px;color:var(--muted);font-size:13px">by ${escapeHTML(post.author)}</span>`;

    header.appendChild(title);
    header.appendChild(meta);

    // content - show only excerpt (150 characters)
    const content = document.createElement("div");
    content.className = "postContent";
    const fullContent = post.content || "";
    const plainText =
      new DOMParser().parseFromString(fullContent, "text/html").body
        .textContent || "";
    const excerpt =
      plainText.length > 150 ? plainText.substring(0, 150) + "..." : plainText;
    content.innerHTML = `<p style="color:var(--text);line-height:1.6;margin:12px 0">${escapeHTML(excerpt)}</p>
    <p style="color:var(--accent-primary);font-weight:600;cursor:pointer;margin:8px 0;font-size:14px">
      → Read the full post on Ahona's profile
    </p>`;

    // reading time
    const estimate = estimateReadingTime(post.content || "");

    // actions row
    const actions = document.createElement("div");
    actions.className = "actionsRow";
    const likeBtn = document.createElement("button");
    likeBtn.className = "likeBtn";
    const userLiked = me && me.liked && me.liked.includes(post.id);
    likeBtn.innerHTML = `<span class="heart">♥</span><span class="count">${likes[post.id] || 0}</span>`;
    if (userLiked) likeBtn.classList.add("liked");
    likeBtn.addEventListener("click", () => {
      if (!me) {
        alert("Please log in to react.");
        return;
      }
      const users = loadUsers();
      const u = users[me.username];
      u.liked = u.liked || [];
      if (u.liked.includes(post.id)) return; // already reacted
      u.liked.push(post.id);
      users[me.username] = u;
      saveUsers(users);
      const current = loadJSON(LIKES_KEY);
      current[post.id] = (current[post.id] || 0) + 1;
      saveJSON(LIKES_KEY, current);
      renderPosts();
    });

    const reading = document.createElement("div");
    reading.className = "postMeta";
    reading.textContent = `${estimate.minutes} min read · ${estimate.words} words`;

    // save button for users
    const saveBtn = document.createElement("button");
    saveBtn.className = "likeBtn";
    saveBtn.style.marginLeft = "8px";
    saveBtn.textContent =
      me && me.saved && me.saved.includes(post.id) ? "Saved" : "Save";
    saveBtn.addEventListener("click", () => {
      if (!me) {
        alert("Please log in to save posts.");
        return;
      }
      const users = loadUsers();
      const u = users[me.username];
      u.saved = u.saved || [];
      if (u.saved.includes(post.id)) {
        // unsave
        u.saved = u.saved.filter((x) => x !== post.id);
      } else {
        u.saved.push(post.id);
      }
      users[me.username] = u;
      saveUsers(users);
      renderPosts();
    });

    actions.appendChild(likeBtn);
    actions.appendChild(saveBtn);
    actions.appendChild(reading);

    // comments area
    const commentsEl = document.createElement("div");
    commentsEl.className = "comments";
    const commentList = document.createElement("div");
    commentList.className = "commentList";

    const postComments = comments[post.id] || [];
    postComments.forEach((c) => {
      const ce = document.createElement("div");
      ce.className = "comment";
      ce.innerHTML = `<div class="commentName">${escapeHTML(c.name || "Anonymous")}</div><div class="commentText">${escapeHTML(c.text)}</div>`;
      commentList.appendChild(ce);
    });

    // comment form
    const form = document.createElement("form");
    form.className = "commentForm";
    if (getSession()) {
      form.innerHTML = `<textarea name="text" placeholder="Write a kind thought..."></textarea><button type="submit">Comment</button>`;
    } else {
      form.innerHTML = `<input name="name" placeholder="Name (optional)"/><textarea name="text" placeholder="Write a kind thought..."></textarea><button type="submit">Comment</button>`;
    }
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const formData = new FormData(form);
      const name = getSession()
        ? getSession()
        : formData.get("name") || "Anonymous";
      const text = formData.get("text") || "";
      if (!text.trim()) return;
      const allComments = loadJSON(COMMENTS_KEY);
      allComments[post.id] = allComments[post.id] || [];
      allComments[post.id].push({ name, text, date: Date.now() });
      saveJSON(COMMENTS_KEY, allComments);
      renderPosts();
    });

    commentsEl.appendChild(commentList);
    commentsEl.appendChild(form);

    el.appendChild(header);
    el.appendChild(content);
    el.appendChild(actions);
    el.appendChild(commentsEl);

    postsRoot.appendChild(el);
  });

  updateTopbar();
}

function updateTopbar() {
  const me = currentUser();
  if (me) {
    hide(loginBtn);
    hide(registerBtn);
    show(userIconBtn);
    currentUserName.textContent = `Signed in: ${me.username}`;
  } else {
    show(loginBtn);
    show(registerBtn);
    hide(userIconBtn);
    hide(userMenu);
    currentUserName.textContent = "";
  }
}

// theme toggle + persistence with animation
function applyTheme(theme) {
  if (theme === "dark") document.body.classList.add("dark");
  else document.body.classList.remove("dark");
  // Update icon with animation
  toggleTheme.style.transform = "rotate(360deg) scale(0.8)";
  setTimeout(() => {
    toggleTheme.textContent = theme === "dark" ? "☀️" : "🌙";
    toggleTheme.style.transform = "rotate(0deg) scale(1)";
  }, 150);
}

toggleTheme.addEventListener("click", () => {
  document.body.classList.add("theme-transitioning");
  const s = loadJSON(SETTINGS_KEY);
  s.theme = s.theme === "dark" ? "light" : "dark";
  saveJSON(SETTINGS_KEY, s);
  applyTheme(s.theme);

  setTimeout(() => {
    document.body.classList.remove("theme-transitioning");
  }, 500);
});

// Initialize theme on page load
const initialSettings = loadJSON(SETTINGS_KEY);
if (initialSettings.theme === "dark") {
  document.body.classList.add("dark");
  toggleTheme.textContent = "☀️";
} else {
  toggleTheme.textContent = "🌙";
}

// Auth mode switching
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

// Auth actions
loginBtn.addEventListener("click", () => {
  switchToLogin();
  authModalOverlay.classList.remove("hidden");
});

registerBtn.addEventListener("click", () => {
  switchToRegister();
  authModalOverlay.classList.remove("hidden");
});

// Toggle user menu with profile icon
userIconBtn.addEventListener("click", () => {
  userMenu.classList.toggle("hidden");
});

// Close user menu when clicking outside
document.addEventListener("click", (e) => {
  if (!userIconBtn.contains(e.target) && !userMenu.contains(e.target)) {
    userMenu.classList.add("hidden");
  }
});

cancelLogin.addEventListener("click", () => {
  authModalOverlay.classList.add("hidden");
  loginForm.reset();
});

cancelRegister.addEventListener("click", () => {
  authModalOverlay.classList.add("hidden");
  registerForm.reset();
});

// Close modal when clicking overlay
authModalOverlay.addEventListener("click", (e) => {
  if (e.target === authModalOverlay) {
    authModalOverlay.classList.add("hidden");
  }
});

loginForm.addEventListener("submit", (ev) => {
  ev.preventDefault();
  const u = document.getElementById("loginUsername").value.trim();
  const p = document.getElementById("loginPassword").value;
  const users = loadUsers();
  if (users[u] && users[u].password === p) {
    setSession(u);
    authModalOverlay.classList.add("hidden");
    loginForm.reset();
    renderPosts();
    updateTopbar();
  } else {
    alert("❌ Invalid credentials");
  }
});

registerForm.addEventListener("submit", (ev) => {
  ev.preventDefault();
  const fullName = document.getElementById("registerName").value.trim();
  const u = document.getElementById("registerUsername").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const address = document.getElementById("registerAddress").value.trim();
  const p = document.getElementById("registerPassword").value;
  const cp = document.getElementById("registerConfirmPassword").value;

  if (!fullName || !u || !email || !address || !p || !cp) {
    alert("⚠️ Please fill all fields");
    return;
  }

  if (p !== cp) {
    alert("⚠️ Passwords do not match");
    return;
  }

  if (p.length < 6) {
    alert("⚠️ Password must be at least 6 characters");
    return;
  }

  const users = loadUsers();
  if (users[u]) {
    alert("⚠️ Username already taken");
    return;
  }

  users[u] = {
    password: p,
    fullName: fullName,
    email: email,
    address: address,
    saved: [],
    liked: [],
    createdAt: Date.now(),
  };
  saveUsers(users);
  setSession(u);
  authModalOverlay.classList.add("hidden");
  registerForm.reset();
  renderPosts();
  updateTopbar();
});

logoutBtn.addEventListener("click", () => {
  clearSession();
  renderPosts();
  updateTopbar();
});

profileBtn.addEventListener("click", () => {
  const me = currentUser();
  if (!me) {
    alert("Not signed in");
    return;
  }
  renderProfileModal();
  show(profileModal);
});

closeProfile.addEventListener("click", () => {
  hide(profileModal);
});

function renderProfileModal() {
  const me = currentUser();
  if (!me) return;
  const users = loadUsers();
  const posts = loadPosts();
  const saved = (me.saved || [])
    .map((id) => posts.find((p) => p.id === id))
    .filter(Boolean);
  const liked = (me.liked || [])
    .map((id) => posts.find((p) => p.id === id))
    .filter(Boolean);

  let html = `
    <div style="background:var(--soft);padding:16px;border-radius:12px;margin-bottom:16px">
      <h3 style="margin:0 0 12px 0;color:var(--accent-primary)">👤 Profile Information</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px;color:var(--text)">
        <div><strong>Full Name:</strong><br/>${escapeHTML(me.fullName || "Not set")}</div>
        <div><strong>Username:</strong><br/>${escapeHTML(me.username)}</div>
        <div><strong>Email:</strong><br/>${escapeHTML(me.email || "Not set")}</div>
        <div><strong>Address:</strong><br/>${escapeHTML(me.address || "Not set")}</div>
        <div><strong>Member Since:</strong><br/>${new Date(me.createdAt || Date.now()).toLocaleDateString()}</div>
      </div>
    </div>

    <form id="editProfileForm" style="background:var(--soft);padding:16px;border-radius:12px;margin-bottom:16px">
      <h4 style="margin:0 0 12px 0;color:var(--accent-primary)">✏️ Edit Profile</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div>
          <label style="display:block;margin-bottom:4px;font-weight:600">Full Name</label>
          <input type="text" name="fullName" value="${escapeHTML(me.fullName || "")}" placeholder="Your full name" style="width:100%;padding:8px;border-radius:8px;border:2px solid var(--border);background:var(--bg);color:var(--text)"/>
        </div>
        <div>
          <label style="display:block;margin-bottom:4px;font-weight:600">Email</label>
          <input type="email" name="email" value="${escapeHTML(me.email || "")}" placeholder="your@email.com" style="width:100%;padding:8px;border-radius:8px;border:2px solid var(--border);background:var(--bg);color:var(--text)"/>
        </div>
      </div>
      <div>
        <label style="display:block;margin-bottom:4px;font-weight:600">Address</label>
        <input type="text" name="address" value="${escapeHTML(me.address || "")}" placeholder="City, Country" style="width:100%;padding:8px;border-radius:8px;border:2px solid var(--border);background:var(--bg);color:var(--text);margin-bottom:12px"/>
      </div>
      <div>
        <label style="display:block;margin-bottom:4px;font-weight:600">Bio</label>
        <textarea name="bio" placeholder="Tell us about yourself..." rows="3" style="width:100%;padding:8px;border-radius:8px;border:2px solid var(--border);background:var(--bg);color:var(--text);margin-bottom:12px;resize:vertical">${escapeHTML(me.bio || "")}</textarea>
      </div>
      <button type="submit" style="padding:10px 16px;background:var(--accent-primary);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600">💾 Save Profile</button>
    </form>

    <form id="changePassForm" style="background:var(--soft);padding:16px;border-radius:12px;margin-bottom:16px">
      <h4 style="margin:0 0 12px 0;color:var(--accent-primary)">🔐 Change Password</h4>
      <div style="margin-bottom:12px">
        <label style="display:block;margin-bottom:4px;font-weight:600">Current Password</label>
        <input name="cur" type="password" placeholder="Enter current password" style="width:100%;padding:8px;border-radius:8px;border:2px solid var(--border);background:var(--bg);color:var(--text)" required/>
      </div>
      <div style="margin-bottom:12px">
        <label style="display:block;margin-bottom:4px;font-weight:600">New Password</label>
        <input name="newp" type="password" placeholder="Enter new password" style="width:100%;padding:8px;border-radius:8px;border:2px solid var(--border);background:var(--bg);color:var(--text)" required/>
      </div>
      <div style="margin-bottom:12px">
        <label style="display:block;margin-bottom:4px;font-weight:600">Confirm Password</label>
        <input name="confirmnewp" type="password" placeholder="Confirm new password" style="width:100%;padding:8px;border-radius:8px;border:2px solid var(--border);background:var(--bg);color:var(--text)" required/>
      </div>
      <button type="submit" style="padding:10px 16px;background:var(--accent-primary);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600">🔒 Update Password</button>
    </form>

    <div style="background:var(--soft);padding:16px;border-radius:12px;margin-bottom:16px">
      <h4 style="margin:0 0 12px 0;color:var(--accent-primary)">❤️ Saved Posts (${saved.length})</h4>
      <div id="savedList">`;
  if (saved.length) {
    saved.forEach((p) => {
      html += `<div style="margin-bottom:8px;padding:8px;background:var(--bg);border-radius:8px;display:flex;justify-content:space-between;align-items:center"><strong>${escapeHTML(p.title || "Untitled")}</strong> <button data-unsave="${p.id}" type="button" style="padding:4px 12px;background:#dc2626;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px">Remove</button></div>`;
    });
  } else {
    html += `<div style="color:var(--secondary);font-style:italic">No saved posts yet</div>`;
  }
  html += `</div>
    </div>

    <div style="background:var(--soft);padding:16px;border-radius:12px">
      <h4 style="margin:0 0 12px 0;color:var(--accent-primary)">❤️ Liked Posts (${liked.length})</h4>
      <div id="likedList">`;
  if (liked.length) {
    liked.forEach((p) => {
      html += `<div style="margin-bottom:8px;padding:8px;background:var(--bg);border-radius:8px;display:flex;justify-content:space-between;align-items:center"><strong>${escapeHTML(p.title || "Untitled")}</strong> <button data-unlike="${p.id}" type="button" style="padding:4px 12px;background:#dc2626;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px">Remove</button></div>`;
    });
  } else {
    html += `<div style="color:var(--secondary);font-style:italic">No liked posts yet</div>`;
  }
  html += `</div>
    </div>`;

  profileContent.innerHTML = html;

  // edit profile form
  const epf = document.getElementById("editProfileForm");
  epf.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const fd = new FormData(epf);
    const users = loadUsers();
    users[me.username].fullName = fd.get("fullName");
    users[me.username].email = fd.get("email");
    users[me.username].address = fd.get("address");
    users[me.username].bio = fd.get("bio");
    saveUsers(users);
    alert("✅ Profile updated successfully!");
    renderProfileModal();
  });

  // bind change password
  const cpf = document.getElementById("changePassForm");
  cpf.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const fd = new FormData(cpf);
    const cur = fd.get("cur");
    const np = fd.get("newp");
    const cnp = fd.get("confirmnewp");

    if (users[me.username].password !== cur) {
      alert("❌ Current password incorrect");
      return;
    }

    if (np !== cnp) {
      alert("❌ New passwords do not match");
      return;
    }

    if (np.length < 6) {
      alert("⚠️ Password must be at least 6 characters");
      return;
    }

    users[me.username].password = np;
    saveUsers(users);
    alert("✅ Password updated successfully!");
    cpf.reset();
  });

  // bind unsave buttons
  profileContent.querySelectorAll("[data-unsave]").forEach((b) => {
    b.addEventListener("click", () => {
      const id = b.getAttribute("data-unsave");
      const users = loadUsers();
      users[me.username].saved = (users[me.username].saved || []).filter(
        (x) => x !== id,
      );
      saveUsers(users);
      renderProfileModal();
      renderPosts();
    });
  });

  // bind unlike buttons
  profileContent.querySelectorAll("[data-unlike]").forEach((b) => {
    b.addEventListener("click", () => {
      const id = b.getAttribute("data-unlike");
      const users = loadUsers();
      users[me.username].liked = (users[me.username].liked || []).filter(
        (x) => x !== id,
      );
      saveUsers(users);
      const likes = loadJSON(LIKES_KEY);
      likes[id] = Math.max(0, (likes[id] || 1) - 1);
      saveJSON(LIKES_KEY, likes);
      renderProfileModal();
      renderPosts();
    });
  });
}

// On load
(function init() {
  // Hide profile modal
  hide(profileModal);

  // load settings
  const s = loadJSON(SETTINGS_KEY);
  applyTheme(s.theme || "light");

  // Check if user is logged in
  const session = getSession();
  if (session) {
    // User logged in, hide auth modal and show content
    hide(authModalOverlay);
    renderPosts();
    updateTopbar();
  } else {
    // Not logged in, show login modal first
    switchToLogin();
    show(authModalOverlay);
    postsRoot.innerHTML = ""; // Hide posts until login
  }
})();
