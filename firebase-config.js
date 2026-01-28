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
   - twitter: string
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
      twitter: "",
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
    return false;
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
      publishedAt: serverTimestamp(),
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
    // Check if already liked
    const q = query(
      collection(db, "likes"),
      where("postId", "==", postId),
      where("userId", "==", userId),
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Add like
      await addDoc(collection(db, "likes"), {
        postId: postId,
        userId: userId,
        createdAt: serverTimestamp(),
      });

      // Increment post like count
      await updateDoc(doc(db, "posts", postId), {
        likes: increment(1),
      });

      return true;
    }
    return false;
  } catch (error) {
    console.error("Error liking post:", error);
    return false;
  }
}

async function unlikePost(postId, userId) {
  try {
    // Find like document
    const q = query(
      collection(db, "likes"),
      where("postId", "==", postId),
      where("userId", "==", userId),
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Delete like
      const likeDocId = querySnapshot.docs[0].id;
      await deleteDoc(doc(db, "likes", likeDocId));

      // Decrement post like count
      await updateDoc(doc(db, "posts", postId), {
        likes: increment(-1),
      });

      return true;
    }
    return false;
  } catch (error) {
    console.error("Error unliking post:", error);
    return false;
  }
}

async function isPostLikedByUser(postId, userId) {
  try {
    const q = query(
      collection(db, "likes"),
      where("postId", "==", postId),
      where("userId", "==", userId),
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking like status:", error);
    return false;
  }
}

// ============================================
// Comment Functions
// ============================================

async function addComment(postId, userId, userName, text) {
  try {
    const docRef = await addDoc(collection(db, "comments"), {
      postId: postId,
      userId: userId,
      userName: userName,
      text: text,
      createdAt: serverTimestamp(),
      likes: 0,
    });

    // Increment post comment count
    await updateDoc(doc(db, "posts", postId), {
      comments: increment(1),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error adding comment:", error);
    return null;
  }
}

async function getPostComments(postId) {
  try {
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId),
      orderBy("createdAt", "desc"),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting comments:", error);
    return [];
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
  // Analytics
  getAnalytics,
};
