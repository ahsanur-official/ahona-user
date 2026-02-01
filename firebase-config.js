// ============================================
// Firebase Configuration (Shared)
// ============================================
// Import this file in both Admin and User panels

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  browserLocalPersistence,
  setPersistence,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  writeBatch,
  limit,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// ============================================
// TODO: Replace with your Firebase credentials
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyAK6oKGUKyCbHK209Wub7AS1WQyTSNiqEM",
  authDomain: "ahona-blog.firebaseapp.com",
  projectId: "ahona-blog",
  storageBucket: "ahona-blog.firebasestorage.app",
  messagingSenderId: "1013172380487",
  appId: "1:1013172380487:web:067da2c0eb9b7f1d38e262",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Ensure persistence is set before any auth usage
await setPersistence(auth, browserLocalPersistence);
const db = getFirestore(app);
const storage = getStorage(app);

// ============================================
// Firestore Database Structure
// ============================================
/*
Collections:
1. users/
   - uid (docId)
   - displayName: string
   - email: string
   - username: string (unique)
   - profilePic: string (URL)
   - bio: string
   - createdAt: timestamp
   - updatedAt: timestamp
   - isAdmin: boolean
   - settings: {
       theme: 'light' | 'dark'
       autoSave: boolean
       notifications: boolean
     }
   - website: string
   - facebook: string
   - instagram: string
   - writingGoal: number (words)

2. posts/
   - postId (docId)
   - title: string
   - content: string (HTML)
   - excerpt: string (first 150 chars)
   - authorId: string (uid)
   - authorName: string (cached)
   - category: string ('Novel', 'Poem', 'Short Story')
   - mood: string ('Pain', 'Love', 'Silence', 'Hope')
   - tags: array
   - status: string ('published' | 'draft')
   - createdAt: timestamp
   - updatedAt: timestamp
   - publishedAt: timestamp
   - wordCount: number
   - readingTime: number (minutes)
   - views: number
   - likes: number
   - comments: number
   - featured: boolean

3. drafts/
   - draftId (docId)
   - title: string
   - content: string (HTML)
   - authorId: string (uid)
   - category: string
   - mood: string
   - tags: array
   - savedAt: timestamp
   - autoSavedAt: timestamp

4. likes/
   - likeId (docId)
   - postId: string
   - userId: string
   - createdAt: timestamp

5. comments/
   - commentId (docId)
   - postId: string
   - userId: string
   - userName: string (cached)
   - text: string
   - createdAt: timestamp
   - likes: number

6. analytics/ (admin only)
   - userId (docId)
   - totalPosts: number
   - totalViews: number
   - totalLikes: number
   - totalComments: number
   - totalWords: number
   - publishedAt: timestamp
*/

// ============================================
// Auth Functions
// ============================================

async function registerUser(email, password, username, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // Update profile
    await updateProfile(user, {
      displayName: displayName,
    });

    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      username: username.toLowerCase(),
      displayName: displayName,
      profilePic: "",
      bio: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isAdmin: false,
      settings: {
        theme: "light",
        autoSave: true,
        notifications: true,
      },
      website: "",
      facebook: "",
      instagram: "",
      writingGoal: 500,
    });

    return user;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(error.message);
  }
}

function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ============================================
// User Functions
// ============================================

async function getUserData(uid) {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
}

async function updateUserProfile(uid, data) {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return true;
    }

    // Fallback for legacy records that used a different doc id
    const q = query(collection(db, "users"), where("uid", "==", uid));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDocId = querySnapshot.docs[0].id;
      await updateDoc(doc(db, "users", userDocId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return true;
    }

    // If no doc exists, create it with merge
    await setDoc(
      userRef,
      {
        uid,
        ...data,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    return false;
  }
}

async function uploadProfilePicture(uid, file) {
  try {
    const storageRef = ref(storage, `profile-pictures/${uid}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Update user document
    await updateUserProfile(uid, { profilePic: downloadURL });
    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    return null;
  }
}

// ============================================
// Post Functions
// ============================================

async function createPost(postData) {
  try {
    const docRef = await addDoc(collection(db, "posts"), {
      ...postData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      publishedAt: postData.publishedAt || serverTimestamp(),
      views: 0,
      likes: 0,
      comments: 0,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating post:", error);
    return null;
  }
}

// Upload an image for posts and return download URL
async function uploadPostImage(uid, file, filename = null) {
  try {
    const name = filename || `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `post-images/${uid}/${name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading post image:', error);
    return null;
  }
}

async function getPublishedPosts(limit = 50) {
  try {
    const q = query(
      collection(db, "posts"),
      where("status", "==", "published")
    );
    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Sort manually by publishedAt
    posts.sort((a, b) => {
      const aTime = a.publishedAt?.toMillis?.() || 0;
      const bTime = b.publishedAt?.toMillis?.() || 0;
      return bTime - aTime; // descending (newest first)
    });
    
    return posts;
  } catch (error) {
    console.error("Error getting published posts:", error);
    return [];
  }
}

async function getUserPosts(uid, status = "published") {
  try {
    const q = query(
      collection(db, "posts"),
      where("authorId", "==", uid),
      where("status", "==", status)
    );
    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Sort manually by createdAt
    posts.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime; // descending
    });
    
    return posts;
  } catch (error) {
    console.error("Error getting user posts:", error);
    return [];
  }
}

async function getPost(postId) {
  try {
    const docRef = doc(db, "posts", postId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting post:", error);
    return null;
  }
}

async function updatePost(postId, data) {
  try {
    const docRef = doc(db, "posts", postId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error updating post:", error);
    return false;
  }
}

async function deletePost(postId) {
  try {
    await deleteDoc(doc(db, "posts", postId));
    return true;
  } catch (error) {
    console.error("Error deleting post:", error);
    return false;
  }
}

async function publishPost(postId) {
  try {
    await updatePost(postId, {
      status: "published",
      publishedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error publishing post:", error);
    return false;
  }
}

async function incrementViewCount(postId) {
  try {
    await updateDoc(doc(db, "posts", postId), {
      views: increment(1),
    });
  } catch (error) {
    console.error("Error incrementing view count:", error);
  }
}

// ============================================
// Draft Functions
// ============================================

async function saveDraft(uid, draftData) {
  try {
    const docRef = await addDoc(collection(db, "drafts"), {
      ...draftData,
      authorId: uid,
      savedAt: serverTimestamp(),
      autoSavedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving draft:", error);
    return null;
  }
}

async function updateDraft(draftId, data) {
  try {
    await updateDoc(doc(db, "drafts", draftId), {
      ...data,
      autoSavedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error updating draft:", error);
    return false;
  }
}

async function getUserDrafts(uid) {
  try {
    const q = query(
      collection(db, "drafts"),
      where("authorId", "==", uid),
      orderBy("autoSavedAt", "desc"),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting drafts:", error);
    return [];
  }
}

async function deleteDraft(draftId) {
  try {
    await deleteDoc(doc(db, "drafts", draftId));
    return true;
  } catch (error) {
    console.error("Error deleting draft:", error);
    return false;
  }
}

// ============================================
// Like Functions
// ============================================

async function likePost(postId, userId) {
  try {
    console.log(`[likePost] Starting - postId: ${postId}, userId: ${userId}`);
    
    if (!userId || userId === "") {
      console.error("[likePost] Error: userId is empty");
      return false;
    }
    
    // First, verify post exists
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) {
      console.error(`[likePost] Post does not exist: ${postId}`);
      return false;
    }
    console.log(`[likePost] Post exists, likes field: ${postSnap.data().likes}`);
    
    // Check if already liked
    const q = query(
      collection(db, "likes"),
      where("postId", "==", postId),
      where("userId", "==", userId),
    );
    const querySnapshot = await getDocs(q);
    console.log(`[likePost] Query result - found ${querySnapshot.docs.length} existing likes`);

    if (querySnapshot.empty) {
      // Add like
      const likeRef = await addDoc(collection(db, "likes"), {
        postId: postId,
        userId: userId,
        createdAt: serverTimestamp(),
      });
      console.log(`[likePost] Like document created with ID: ${likeRef.id}`);

      // Increment post like count
      await updateDoc(postRef, {
        likes: increment(1),
      });
      console.log(`[likePost] Post likes incremented`);

      return true;
    }
    console.log(`[likePost] Post already liked by this user`);
    return false;
  } catch (error) {
    console.error("[likePost] ERROR:", error.code || error.message || error);
    if (error.code === "permission-denied") {
      console.error("[likePost] Permission denied! Check Firestore security rules");
    }
    return false;
  }
}

async function unlikePost(postId, userId) {
  try {
    console.log(`[unlikePost] Starting - postId: ${postId}, userId: ${userId}`);
    
    // Verify post exists
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) {
      console.error(`[unlikePost] Post does not exist: ${postId}`);
      return false;
    }
    
    // Find like document
    const q = query(
      collection(db, "likes"),
      where("postId", "==", postId),
      where("userId", "==", userId),
    );
    const querySnapshot = await getDocs(q);
    console.log(`[unlikePost] Found ${querySnapshot.docs.length} likes to delete`);

    if (!querySnapshot.empty) {
      // Delete like
      const likeDocId = querySnapshot.docs[0].id;
      await deleteDoc(doc(db, "likes", likeDocId));
      console.log(`[unlikePost] Like document deleted: ${likeDocId}`);

      // Decrement post like count
      await updateDoc(postRef, {
        likes: increment(-1),
      });
      console.log(`[unlikePost] Post likes decremented`);

      return true;
    }
    console.log(`[unlikePost] No like found for this user`);
    return false;
  } catch (error) {
    console.error("[unlikePost] ERROR:", error.code || error.message || error);
    if (error.code === "permission-denied") {
      console.error("[unlikePost] Permission denied! Check Firestore security rules");
    }
    return false;
  }
}

async function isPostLikedByUser(postId, userId) {
  try {
    console.log(`[isPostLikedByUser] Checking - postId: ${postId}, userId: ${userId}`);
    const q = query(
      collection(db, "likes"),
      where("postId", "==", postId),
      where("userId", "==", userId),
    );
    const querySnapshot = await getDocs(q);
    const isLiked = !querySnapshot.empty;
    console.log(`[isPostLikedByUser] Result: ${isLiked} (found ${querySnapshot.docs.length} likes)`);
    return isLiked;
  } catch (error) {
    console.error("Error checking like status:", error);
    return false;
  }
}

// ============================================
// Comment Functions
// ============================================

async function addComment(postId, userId, userName, text, userProfilePic = null) {
  try {
    console.log(`[addComment] Starting - postId: ${postId}, userId: ${userId}, userName: ${userName}, text: ${text.substring(0, 50)}...`);
    
    if (!userId || userId === "") {
      console.error("[addComment] Error: userId is empty");
      return null;
    }
    
    if (!text || text.trim() === "") {
      console.error("[addComment] Error: text is empty");
      return null;
    }
    
    // First, verify post exists
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) {
      console.error(`[addComment] Post does not exist: ${postId}`);
      return null;
    }
    console.log(`[addComment] Post exists, comments field: ${postSnap.data().comments}`);
    
    const commentData = {
      postId: postId,
      userId: userId,
      userName: userName,
      text: text,
      parentId: null,
      createdAt: serverTimestamp(),
      likes: 0,
    };
    
    // Add profile pic if provided
    if (userProfilePic) {
      commentData.userProfilePic = userProfilePic;
    }
    
    const docRef = await addDoc(collection(db, "comments"), commentData);
    console.log(`[addComment] Comment created with ID: ${docRef.id}`);

    // Increment post comment count
    await updateDoc(postRef, {
      comments: increment(1),
    });
    console.log(`[addComment] Post comments incremented`);

    return docRef.id;
  } catch (error) {
    console.error("[addComment] ERROR:", error.code || error.message || error);
    if (error.code === "permission-denied") {
      console.error("[addComment] Permission denied! Check Firestore security rules");
    }
    return null;
  }
}

async function getPostComments(postId) {
  try {
    console.log(`[getPostComments] Fetching comments for post: ${postId}`);
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId)
    );
    const querySnapshot = await getDocs(q);
    let comments = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Sort manually by createdAt (newest first)
    comments.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
    
    console.log(`[getPostComments] Found ${comments.length} comments for post: ${postId}`);
    return comments;
  } catch (error) {
    console.error("Error getting comments:", error);
    return [];
  }
}

// Like/Unlike comment functions
async function likeComment(commentId, userId, userName) {
  try {
    // Add to commentLikes collection to track who liked
    const likeRef = doc(db, "commentLikes", `${commentId}_${userId}`);
    await setDoc(likeRef, {
      commentId: commentId,
      userId: userId,
      createdAt: serverTimestamp(),
    });

    // Increment comment likes count
    const commentRef = doc(db, "comments", commentId);
    const commentSnap = await getDoc(commentRef);
    
    await updateDoc(commentRef, {
      likes: increment(1),
    });

    // Create notification for comment author (if not liking own comment)
    if (commentSnap.exists()) {
      const commentData = commentSnap.data();
      const commentAuthorId = commentData.userId;
      
      if (commentAuthorId && commentAuthorId !== userId) {
        const notifRef = doc(collection(db, "notifications"));
        await setDoc(notifRef, {
          userId: commentAuthorId,
          type: "comment_like",
          commentId: commentId,
          postId: commentData.postId,
          fromUserId: userId,
          fromUserName: userName || "Someone",
          commentText: (commentData.text || "").substring(0, 50),
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    }

    return true;
  } catch (error) {
    console.error("Error liking comment:", error);
    return false;
  }
}

async function unlikeComment(commentId, userId) {
  try {
    // Remove from commentLikes collection
    const likeRef = doc(db, "commentLikes", `${commentId}_${userId}`);
    await deleteDoc(likeRef);

    // Decrement comment likes count
    const commentRef = doc(db, "comments", commentId);
    await updateDoc(commentRef, {
      likes: increment(-1),
    });

    return true;
  } catch (error) {
    console.error("Error unliking comment:", error);
    return false;
  }
}

async function isCommentLikedByUser(commentId, userId) {
  try {
    const likeRef = doc(db, "commentLikes", `${commentId}_${userId}`);
    const likeSnap = await getDoc(likeRef);
    return likeSnap.exists();
  } catch (error) {
    console.error("Error checking comment like:", error);
    return false;
  }
}

// Get notifications for a user
async function getUserNotifications(userId, maxResults = 20) {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(maxResults)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error getting notifications:", error);
    return [];
  }
}

// Get unread notification count
async function getUnreadNotificationCount(userId) {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
}

// Mark notification as read
async function markNotificationAsRead(notificationId) {
  try {
    await updateDoc(doc(db, "notifications", notificationId), {
      read: true,
    });
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
}

// Mark all notifications as read for a user
async function markAllNotificationsAsRead(userId) {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error marking all as read:", error);
    return false;
  }
}

// Delete all notifications for a user
async function clearAllNotifications(userId) {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error clearing notifications:", error);
    return false;
  }
}

// Allow comments with optional parentId for threaded replies
async function addThreadedComment(postId, userId, userName, text, parentId = null) {
  try {
    const docRef = await addDoc(collection(db, "comments"), {
      postId,
      userId,
      userName,
      text,
      parentId: parentId || null,
      createdAt: serverTimestamp(),
      likes: 0,
    });

    // Increment post comment count
    await updateDoc(doc(db, "posts", postId), {
      comments: increment(1),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error adding threaded comment:", error);
    return null;
  }
}

// Save / unsave posts for a user (persist in users doc as `savedPosts` array)
async function savePostForUser(uid, postId) {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      savedPosts: arrayUnion(postId),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error saving post for user:", error);
    return false;
  }
}

async function unsavePostForUser(uid, postId) {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      savedPosts: arrayRemove(postId),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error unsaving post for user:", error);
    return false;
  }
}

async function getSavedPostsForUser(uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) return [];
    const data = userDoc.data();
    const ids = data.savedPosts || [];
    if (ids.length === 0) return [];
    // fetch posts by ids (batched)
    const posts = [];
    for (const id of ids) {
      const p = await getPost(id);
      if (p) posts.push(p);
    }
    return posts;
  } catch (error) {
    console.error("Error getting saved posts:", error);
    return [];
  }
}

// Follow / unfollow users: maintain followers and following arrays on user docs
async function followUser(followerUid, targetUid) {
  try {
    const followerRef = doc(db, "users", followerUid);
    const targetRef = doc(db, "users", targetUid);
    await updateDoc(followerRef, { following: arrayUnion(targetUid), updatedAt: serverTimestamp() });
    await updateDoc(targetRef, { followers: arrayUnion(followerUid), updatedAt: serverTimestamp() });
    return true;
  } catch (error) {
    console.error("Error following user:", error);
    return false;
  }
}

async function unfollowUser(followerUid, targetUid) {
  try {
    const followerRef = doc(db, "users", followerUid);
    const targetRef = doc(db, "users", targetUid);
    await updateDoc(followerRef, { following: arrayRemove(targetUid), updatedAt: serverTimestamp() });
    await updateDoc(targetRef, { followers: arrayRemove(followerUid), updatedAt: serverTimestamp() });
    return true;
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return false;
  }
}

async function deleteComment(commentId, postId) {
  try {
    await deleteDoc(doc(db, "comments", commentId));

    // Decrement post comment count
    await updateDoc(doc(db, "posts", postId), {
      comments: increment(-1),
    });

    return true;
  } catch (error) {
    console.error("Error deleting comment:", error);
    return false;
  }
}

// ============================================
// Analytics Functions
// ============================================

async function getAnalytics(uid) {
  try {
    const posts = await getUserPosts(uid, "published");
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalWords = 0;

    for (const post of posts) {
      totalViews += post.views || 0;
      totalLikes += post.likes || 0;
      totalComments += post.comments || 0;
      totalWords += post.wordCount || 0;
    }

    return {
      totalPosts: posts.length,
      totalViews,
      totalLikes,
      totalComments,
      totalWords,
      avgReadingTime: posts.length > 0 ? Math.round(totalWords / posts.length / 200) : 0,
    };
  } catch (error) {
    console.error("Error getting analytics:", error);
    return null;
  }
}

// ============================================
// Export Functions
// ============================================

export {
  app,
  auth,
  db,
  storage,
  // Auth
  registerUser,
  loginUser,
  logoutUser,
  onAuthStateChange,
  // User
  getUserData,
  updateUserProfile,
  uploadProfilePicture,
  // Posts
  createPost,
  getPublishedPosts,
  getUserPosts,
  getPost,
  updatePost,
  deletePost,
  publishPost,
  incrementViewCount,
  // Drafts
  saveDraft,
  updateDraft,
  getUserDrafts,
  deleteDraft,
  // Likes
  likePost,
  unlikePost,
  isPostLikedByUser,
  // Comments
  addComment,
  getPostComments,
  deleteComment,
  addThreadedComment,
  likeComment,
  unlikeComment,
  isCommentLikedByUser,
  // Notifications
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  // Post images
  uploadPostImage,
  // Saved posts
  savePostForUser,
  unsavePostForUser,
  getSavedPostsForUser,
  // Follow
  followUser,
  unfollowUser,
  // Analytics
  getAnalytics,
};
