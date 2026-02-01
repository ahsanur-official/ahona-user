// ============================================
// Preserve scroll position on reload
window.addEventListener('beforeunload', () => {
  localStorage.setItem('scrollY', window.scrollY);
});
window.addEventListener('DOMContentLoaded', () => {
  const y = parseInt(localStorage.getItem('scrollY'), 10);
  if (!isNaN(y)) {
    setTimeout(() => window.scrollTo(0, y), 50);
  }
});
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
  likeComment,
  unlikeComment,
  isCommentLikedByUser,
  savePostForUser,
  unsavePostForUser,
  saveDraft,
  updateDraft,
  getUserDrafts,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
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
const draftsBtn = document.getElementById("draftsBtn");
const likesBtn = document.getElementById("likesBtn");
const settingsBtn = document.getElementById("settingsBtn");
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
let authLoading = true;
let LANG_KEY = 'ahona_lang';
let currentLang = localStorage.getItem(LANG_KEY) || 'en';

const translations = {
  en: {
    welcome: "Welcome to the Ahona Islam's Stories World..",
    discover: "Discover beautiful novels, poems, and short stories crafted with passion",
    loading: "Loading...",
    commentPlaceholder: "Write a kind thought...",
    commentBtn: "Comment",
    comments: "Comments",
    login: "Log in",
    register: "Register",
    more: "More",
    less: "Less",
    save: "Save",
    saved: "Saved",
    profile: "Profile",
    savePosts: "Save Posts",
    settings: "Settings",
    logout: "Log out",
    signedIn: "Signed in",
    noStoriesYet: "No Stories Yet",
    storiesWillAppear: "Stories will appear here once published.",
    noStoriesFound: "No Stories Found",
    noMatch: "match your filter.",
    viewsCount: "views",
    minRead: "min",
    by: "by",
    noCommentsYet: "No comments yet",
    all: "All",
    novel: "Novel",
    poem: "Poem",
    story: "Short Story",
    searchPlaceholder: "Search stories...",
    featuredStories: "Featured Stories",
    brand: "Ahona Islam",
    pageTitle: "Ahona Islam's Stories World..",
    heroTitle: "💖Welcome to the Ahona Islam's Stories World..💖",
    heroSubtitle: "Discover beautiful novels, poems, short stories | Join our community of readers | Keep updated with the latest releases | Explore more every day | Keep your favorite stories handy | Share your thoughts and reviews | Connect with fellow readers | Dive into a world of imagination | Find your next favorite read | Stories that touch your heart | Inspiration at your fingertips | Endless adventures await | Where stories come alive | Your gateway to literary wonders | Unlock the magic of storytelling | A haven for book lovers | Fuel your passion for reading | keep supporting Ahona Islam!",
    english: "English",
    bangla: "বাংলা",
    no: "No",
    footerBrand: "📚 Ahona Islam",
    footerDescription: "A platform dedicated to sharing beautiful stories, poems, and literary works that inspire and connect readers worldwide.",
    quickLinks: "QUICK LINKS",
    browseStories: "Browse Stories",
    categories: "Categories",
    popularTags: "Popular Tags",
    community: "Community",
    resources: "RESOURCES",
    writingTips: "Writing Tips",
    faq: "FAQ",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    about: "ABOUT",
    aboutAhonaIslam: "About Ahona Islam",
    footerMeta: "Empowering writers and readers since 2024",
    footerCopyright: "© 2026 Ahona Islam. All stories and content are protected by copyright. Built with passion for storytelling.",
    // About Modal
    aboutTitle: "About Ahona Islam",
    aboutSubtitle: "Author, Poet & Literary Curator",
    aboutDescription: "Passionate storyteller sharing beautiful narratives with the world",
    aboutSectionTitle: "ABOUT",
    aboutText: "Ahona Islam is a dedicated author and poet committed to crafting meaningful stories, heartfelt poems, and insightful literary works. With a passion for language and storytelling, Ahona creates content that resonates with readers and inspires imagination.",
    missionTitle: "MISSION",
    missionText: "To create a vibrant community where writers and readers connect, share, and celebrate the beauty of literature. Every story is an opportunity to inspire, challenge, and transform perspectives through the power of words.",
    categoriesTitle: "CATEGORIES",
    novelsLabel: "Novels",
    novelsDesc: "Immersive long-form narratives exploring human emotions and experiences.",
    poemsLabel: "Poems",
    poemsDesc: "Lyrical expressions capturing moments, feelings, and reflections.",
    storiesLabel: "Short Stories",
    storiesDesc: "Concise, powerful tales that deliver impact and insight.",
    connectTitle: "CONNECT",
    connectText: "Follow Ahona for the latest releases, writing updates, and literary discussions across social media. Every story shared is crafted with care and passion for you to enjoy.",
    // Writing Tips Modal
    writingTipsTitle: "Writing Tips & Guides",
    storyStructureTitle: "Story Structure",
    storyStructureText: "Start with a compelling hook, develop your characters gradually, create conflict that drives the narrative forward, and resolve with a meaningful ending. Remember, every scene should serve a purpose.",
    writingCraftTitle: "Writing Craft",
    writingCraftText: "Show, don't tell. Use vivid descriptions and active verbs. Vary your sentence structure. Read your work aloud to catch awkward phrasing. Edit ruthlessly—the best writers are fierce editors.",
    inspirationTitle: "Finding Inspiration",
    inspirationText: "Write about what moves you. Observe real life, explore emotions, read widely, and don't be afraid to write badly at first. The magic happens in revision, not the first draft.",
    poetryTipsTitle: "Poetry Tips",
    poetryTipsText: "Use imagery to evoke emotion. Experiment with rhythm and form. Poetry is about compression—every word matters. Read poetry aloud to feel the cadence.",
    shortStoryTitle: "Short Story Magic",
    shortStoryText: "Hook readers immediately. Focus on one central conflict. Every detail counts. Surprise your reader with a twist or revelation. A great short story resonates long after reading.",
    // Privacy Policy Modal
    privacyTitle: "Privacy Policy",
    infoCollectTitle: "1. Information We Collect",
    infoCollectText: "We collect information you provide directly, such as your name, email, username, and profile information. We also automatically collect usage data and analytics about how you interact with our platform.",
    infoUseTitle: "2. How We Use Your Information",
    infoUseText: "We use your information to provide and improve our services, personalize your experience, communicate with you, and ensure platform security. We never sell or share your data with third parties without consent.",
    dataSecurityTitle: "3. Data Security",
    dataSecurityText: "Your data is encrypted and stored securely. We implement industry-standard security measures to protect your information from unauthorized access, alteration, or disclosure.",
    yourRightsTitle: "4. Your Rights",
    yourRightsText: "You have the right to access, modify, or delete your personal data. You can update your profile settings anytime. Contact support for data deletion requests.",
    cookiesTitle: "5. Cookies",
    cookiesText: "We use cookies to enhance your experience and remember your preferences. You can manage cookie settings in your browser.",
    lastUpdated: "Last updated: January 2024",
    faqTitle: "Frequently Asked Questions",
    popularTagsTitle: "Popular Tags",
    // Notifications
    notifications: "Notifications",
    clearAll: "Clear All",
    noNotifications: "No notifications",
    likedYourComment: "liked your comment",
    markAllRead: "Mark all as read",
    // Terms of Service Modal
    termsTitle: "Terms of Service",
    userAgreementTitle: "1. User Agreement",
    userAgreementText: "By using Ahona Islam, you agree to these terms and conditions. If you do not agree, please do not use our services. We reserve the right to modify these terms at any time.",
    contentOwnershipTitle: "2. Content Ownership",
    contentOwnershipText: "You retain full ownership of the content you create and publish. By publishing on our platform, you grant us a license to display your work to the community. All content is protected by copyright.",
    communityGuidelinesTitle: "3. Community Guidelines",
    communityGuidelinesText: "Be respectful. No harassment, hate speech, or inappropriate content. Respect others' intellectual property. Violations may result in content removal or account suspension.",
    acceptableUseTitle: "4. Acceptable Use",
    acceptableUseText: "Do not use the platform for illegal activities, spam, malware, or unauthorized access. Do not plagiarize or claim others' work as your own.",
    liabilityTitle: "5. Liability Disclaimer",
    liabilityText: "Ahona Islam is provided \"as is\" without warranties. We are not liable for indirect damages or lost data. Users assume all risks of platform use."
  },
  bn: {
    welcome: "অহনা ইসলামের গল্পের জগতে স্বাগতম..",
    discover: "ভালবাসা দিয়ে গড়া উপন্যাস, কবিতা ও ছোট গল্প আবিষ্কার করুন",
    loading: "লোড হচ্ছে...",
    commentPlaceholder: "একটি সুন্দর মন্তব্য লিখুন...",
    commentBtn: "মন্তব্য",
    comments: "মন্তব্যসমূহ",
    login: "লগইন",
    register: "রেজিস্টার",
    more: "আরও",
    less: "কম",
    save: "সংরক্ষণ",
    saved: "সংরক্ষিত",
    profile: "প্রোফাইল",
    savePosts: "সংরক্ষিত পোস্ট",
    settings: "সেটিংস",
    logout: "লগ আউট",
    signedIn: "সাইন ইন করা আছে",
    noStoriesYet: "এখনো কোনো গল্প নেই",
    storiesWillAppear: "প্রকাশিত হলে গল্প এখানে দেখা যাবে।",
    noStoriesFound: "কোনো গল্প পাওয়া যায়নি",
    noMatch: "আপনার ফিল্টারের সাথে মিল নেই।",
    viewsCount: "ভিউ",
    minRead: "মিনিট",
    by: "লেখক",
    noCommentsYet: "এখনো কোনো মন্তব্য নেই",
    all: "সব",
    novel: "উপন্যাস",
    poem: "কবিতা",
    story: "ছোট গল্প",
    searchPlaceholder: "গল্প খুঁজুন...",
    featuredStories: "বিশেষ গল্পসমূহ",
    brand: "অহনা ইসলাম",
    pageTitle: "অহনা ইসলামের গল্পের জগত..",
    heroTitle: "💖অহনা ইসলামের গল্পের জগতে স্বাগতম..💖",
    heroSubtitle: "ভালবাসা দিয়ে গড়া সুন্দর উপন্যাস, কবিতা এবং ছোট গল্প আবিষ্কার করুন | আমাদের পাঠক সম্প্রদায়ে যোগ দিন | সর্বশেষ প্রকাশনা সম্পর্কে আপডেট থাকুন | প্রতিদিন আরও অন্বেষণ করুন | আপনার প্রিয় গল্পগুলি সাথে রাখুন | আপনার চিন্তাভাবনা এবং পর্যালোচনা শেয়ার করুন | সহ-পাঠকদের সাথে সংযুক্ত হন | কল্পনার জগতে ডুব দিন | আপনার পরবর্তী প্রিয় পড়া খুঁজে নিন | গল্প যা আপনার হৃদয় স্পর্শ করে | আপনার আঙুলের ডগায় অনুপ্রেরণা | অসীম রোমাঞ্চ অপেক্ষা করছে | যেখানে গল্পগুলি জীবন্ত হয়ে ওঠে | সাহিত্যিক বিস্ময়ের আপনার প্রবেশদ্বার | গল্প বলার জাদু আনলক করুন | বই প্রেমীদের জন্য একটি আশ্রয় | পড়ার প্রতি আপনার আবেগকে জ্বালান | অহনা ইসলামকে সমর্থন করতে থাকুন!",
    english: "English",
    bangla: "বাংলা",
    no: "কোনো",
    footerBrand: "📚 অহনা ইসলাম",
    footerDescription: "একটি প্ল্যাটফর্ম যা সুন্দর গল্প, কবিতা এবং সাহিত্যকর্ম শেয়ার করার জন্য নিবেদিত যা বিশ্বব্যাপী পাঠকদের অনুপ্রাণিত এবং সংযুক্ত করে।",
    quickLinks: "দ্রুত লিঙ্ক",
    browseStories: "গল্প ব্রাউজ করুন",
    categories: "ক্যাটাগরি",
    popularTags: "জনপ্রিয় ট্যাগ",
    community: "কমিউনিটি",
    resources: "রিসোর্স",
    writingTips: "লেখার টিপস",
    faq: "প্রশ্ন উত্তর",
    privacyPolicy: "গোপনীয়তা নীতি",
    termsOfService: "সেবার শর্তাবলী",
    about: "সম্পর্কে",
    aboutAhonaIslam: "অহনা ইসলাম সম্পর্কে",
    footerMeta: "২০২২ সাল থেকে লেখক এবং পাঠকদের ক্ষমতায়ন",
    footerCopyright: "© ২০২৬ অহনা ইসলাম। সকল গল্প এবং বিষয়বস্তু কপিরাইট দ্বারা সুরক্ষিত। গল্প বলার আবেগ দিয়ে তৈরি।",
    // About Modal
    aboutTitle: "অহনা ইসলাম সম্পর্কে",
    aboutSubtitle: "লেখক, কবি এবং সাহিত্য কিউরেটর",
    aboutDescription: "বিশ্বের সাথে সুন্দর কাহিনী শেয়ার করার আবেগপ্রবণ গল্পকার",
    aboutSectionTitle: "সম্পর্কে",
    aboutText: "অহনা ইসলাম একজন নিবেদিত লেখক এবং কবি যিনি অর্থপূর্ণ গল্প, হৃদয়স্পর্শী কবিতা এবং অন্তর্দৃষ্টিপূর্ণ সাহিত্যকর্ম তৈরি করতে প্রতিশ্রুতিবদ্ধ। ভাষা এবং গল্প বলার প্রতি আবেগের সাথে, অহনা এমন বিষয়বস্তু তৈরি করেন যা পাঠকদের সাথে অনুরণিত হয় এবং কল্পনাকে অনুপ্রাণিত করে।",
    missionTitle: "লক্ষ্য",
    missionText: "একটি প্রাণবন্ত সম্প্রদায় তৈরি করা যেখানে লেখক এবং পাঠকরা সংযোগ করতে, শেয়ার করতে এবং সাহিত্যের সৌন্দর্য উদযাপন করতে পারেন। প্রতিটি গল্প শব্দের শক্তির মাধ্যমে অনুপ্রাণিত, চ্যালেঞ্জ এবং দৃষ্টিভঙ্গি রূপান্তরিত করার একটি সুযোগ।",
    categoriesTitle: "ক্যাটাগরি",
    novelsLabel: "উপন্যাস",
    novelsDesc: "মানুষের আবেগ এবং অভিজ্ঞতা অন্বেষণ করে নিমগ্ন দীর্ঘ-ফর্ম আখ্যান।",
    poemsLabel: "কবিতা",
    poemsDesc: "মুহূর্ত, অনুভূতি এবং প্রতিফলন ক্যাপচার করে গীতিকবিতা প্রকাশ।",
    storiesLabel: "ছোট গল্প",
    storiesDesc: "সংক্ষিপ্ত, শক্তিশালী গল্প যা প্রভাব এবং অন্তর্দৃষ্টি প্রদান করে।",
    connectTitle: "সংযোগ",
    connectText: "সর্বশেষ প্রকাশনা, লেখার আপডেট এবং সোশ্যাল মিডিয়া জুড়ে সাহিত্যিক আলোচনার জন্য অহনাকে অনুসরণ করুন। শেয়ার করা প্রতিটি গল্প যত্ন এবং আবেগের সাথে তৈরি করা হয় আপনার উপভোগ করার জন্য।",
    // Writing Tips Modal
    writingTipsTitle: "লেখার টিপস এবং গাইড",
    storyStructureTitle: "গল্পের কাঠামো",
    storyStructureText: "একটি আকর্ষণীয় হুক দিয়ে শুরু করুন, আপনার চরিত্রগুলিকে ধীরে ধীরে বিকশিত করুন, এমন দ্বন্দ্ব তৈরি করুন যা আখ্যানকে এগিয়ে নিয়ে যায় এবং একটি অর্থপূর্ণ সমাপ্তির সাথে সমাধান করুন। মনে রাখবেন, প্রতিটি দৃশ্যের একটি উদ্দেশ্য থাকা উচিত।",
    writingCraftTitle: "লেখার কারুশিল্প",
    writingCraftText: "দেখান, বলবেন না। প্রাণবন্ত বর্ণনা এবং সক্রিয় ক্রিয়া ব্যবহার করুন। আপনার বাক্য কাঠামো পরিবর্তন করুন। অস্বস্তিকর বাক্যাংশ ধরতে আপনার কাজ জোরে পড়ুন। নির্দয়ভাবে সম্পাদনা করুন—সেরা লেখকরা হলেন নিষ্ঠুর সম্পাদক।",
    inspirationTitle: "অনুপ্রেরণা খুঁজে পাওয়া",
    inspirationText: "যা আপনাকে উদ্বুদ্ধ করে তা নিয়ে লিখুন। বাস্তব জীবন পর্যবেক্ষণ করুন, আবেগ অন্বেষণ করুন, ব্যাপকভাবে পড়ুন এবং প্রথমে খারাপভাবে লিখতে ভয় পাবেন না। জাদু প্রথম খসড়ায় নয়, সংশোধনে ঘটে।",
    poetryTipsTitle: "কবিতার টিপস",
    poetryTipsText: "আবেগ জাগাতে কল্পনা ব্যবহার করুন। ছন্দ এবং ফর্ম নিয়ে পরীক্ষা করুন। কবিতা হল সংকোচন সম্পর্কে—প্রতিটি শব্দ গুরুত্বপূর্ণ। ছন্দ অনুভব করতে কবিতা জোরে পড়ুন।",
    shortStoryTitle: "ছোট গল্পের জাদু",
    shortStoryText: "অবিলম্বে পাঠকদের হুক করুন। একটি কেন্দ্রীয় দ্বন্দ্বে ফোকাস করুন। প্রতিটি বিবরণ গণনা করা হয়। একটি টুইস্ট বা উদ্ঘাটন দিয়ে আপনার পাঠককে অবাক করুন। একটি দুর্দান্ত ছোট গল্প পড়ার পরে দীর্ঘ সময় অনুরণিত হয়।",
    // Privacy Policy Modal
    privacyTitle: "গোপনীয়তা নীতি",
    infoCollectTitle: "১. আমরা যে তথ্য সংগ্রহ করি",
    infoCollectText: "আমরা আপনার নাম, ইমেল, ব্যবহারকারীর নাম এবং প্রোফাইল তথ্যের মতো আপনি সরাসরি প্রদান করা তথ্য সংগ্রহ করি। আমরা স্বয়ংক্রিয়ভাবে ব্যবহারের ডেটা এবং আপনি কীভাবে আমাদের প্ল্যাটফর্মের সাথে ইন্টারঅ্যাক্ট করেন তার বিশ্লেষণ সংগ্রহ করি।",
    infoUseTitle: "২. আমরা কীভাবে আপনার তথ্য ব্যবহার করি",
    infoUseText: "আমরা আমাদের পরিষেবাগুলি প্রদান এবং উন্নত করতে, আপনার অভিজ্ঞতা ব্যক্তিগতকৃত করতে, আপনার সাথে যোগাযোগ করতে এবং প্ল্যাটফর্ম সুরক্ষা নিশ্চিত করতে আপনার তথ্য ব্যবহার করি। আমরা আপনার সম্মতি ছাড়া তৃতীয় পক্ষের কাছে আপনার ডেটা বিক্রি বা ভাগ করি না।",
    dataSecurityTitle: "৩. ডেটা সুরক্ষা",
    dataSecurityText: "আপনার ডেটা এনক্রিপ্ট করা এবং নিরাপদে সংরক্ষণ করা হয়। আমরা আপনার তথ্যকে অননুমোদিত অ্যাক্সেস, পরিবর্তন বা প্রকাশ থেকে রক্ষা করতে শিল্প-মানের সুরক্ষা ব্যবস্থা প্রয়োগ করি।",
    yourRightsTitle: "৪. আপনার অধিকার",
    yourRightsText: "আপনার ব্যক্তিগত ডেটা অ্যাক্সেস, সংশোধন বা মুছে ফেলার অধিকার আছে। আপনি যেকোনো সময় আপনার প্রোফাইল সেটিংস আপডেট করতে পারেন। ডেটা মুছে ফেলার অনুরোধের জন্য সহায়তার সাথে যোগাযোগ করুন।",
    cookiesTitle: "৫. কুকিজ",
    cookiesText: "আমরা আপনার অভিজ্ঞতা বাড়াতে এবং আপনার পছন্দগুলি মনে রাখতে কুকিজ ব্যবহার করি। আপনি আপনার ব্রাউজারে কুকি সেটিংস পরিচালনা করতে পারেন।",
    lastUpdated: "সর্বশেষ আপডেট: জানুয়ারি ২০২২",

    // Notifications
    notifications: "বিজ্ঞপ্তি",
    clearAll: "সব পরিষ্কার করুন",
    noNotifications: "কোন বিজ্ঞপ্তি নেই",
    likedYourComment: "আপনার মন্তব্য পছন্দ করেছেন",
    markAllRead: "সব পঠিত চিহ্নিত করুন",

    // Terms of Service Modal
    termsTitle: "সেবার শর্তাবলী",
    userAgreementTitle: "১. ব্যবহারকারী চুক্তি",
    userAgreementText: "অহনা ইসলাম ব্যবহার করে, আপনি এই নিয়ম ও শর্তাবলীতে সম্মত হন। যদি আপনি সম্মত না হন, অনুগ্রহ করে আমাদের পরিষেবাগুলি ব্যবহার করবেন না। আমরা যেকোনো সময় এই শর্তাবলী সংশোধন করার অধিকার সংরক্ষণ করি।",
    contentOwnershipTitle: "২. বিষয়বস্তুর মালিকানা",
    contentOwnershipText: "আপনি তৈরি এবং প্রকাশ করা বিষয়বস্তুর সম্পূর্ণ মালিকানা ধরে রাখেন। আমাদের প্ল্যাটফর্মে প্রকাশ করে, আপনি আমাদের সম্প্রদায়ের কাছে আপনার কাজ প্রদর্শন করার জন্য একটি লাইসেন্স প্রদান করেন। সমস্ত বিষয়বস্তু কপিরাইট দ্বারা সুরক্ষিত।",
    communityGuidelinesTitle: "৩. সম্প্রদায়ের নির্দেশিকা",
    communityGuidelinesText: "সম্মানজনক হন। কোন হয়রানি, ঘৃণাত্মক বক্তব্য, বা অনুপযুক্ত বিষয়বস্তু নেই। অন্যদের বুদ্ধিবৃত্তিক সম্পত্তিকে সম্মান করুন। লঙ্ঘনের ফলে বিষয়বস্তু অপসারণ বা অ্যাকাউন্ট স্থগিত হতে পারে।",
    acceptableUseTitle: "৪. গ্রহণযোগ্য ব্যবহার",
    acceptableUseText: "অবৈধ কার্যকলাপ, স্প্যাম, ম্যালওয়্যার বা অননুমোদিত অ্যাক্সেসের জন্য প্ল্যাটফর্ম ব্যবহার করবেন না। চুরি করবেন না বা অন্যের কাজকে আপনার নিজের বলে দাবি করবেন না।",
    liabilityTitle: "৫. দায় অস্বীকৃতি",
    liabilityText: "অহনা ইসলাম ওয়ারেন্টি ছাড়াই \"যেমন আছে\" প্রদান করা হয়। আমরা পরোক্ষ ক্ষতি বা হারানো ডেটার জন্য দায়ী নই। ব্যবহারকারীরা প্ল্যাটফর্ম ব্যবহারের সমস্ত ঝুঁকি গ্রহণ করে।"
  }
};

function t(key) {
  return translations[currentLang][key] || translations['en'][key] || key;
}

function updateLangUI() {
  // Hero section
  const welcome = document.getElementById('mainWelcomeText');
  if (welcome) welcome.textContent = t('welcome');
  const discover = document.getElementById('mainDiscoverText');
  if (discover) discover.textContent = t('discover');
  
  // Search and filters
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.placeholder = t('searchPlaceholder');
  
  // Filter buttons
  document.querySelectorAll('.filterBtn').forEach((btn, index) => {
    const filters = ['all', 'novel', 'poem', 'story'];
    if (index < filters.length) {
      const icon = btn.textContent.match(/[📖✍️📝]/)?.[0] || '';
      btn.textContent = icon + ' ' + t(filters[index]);
    }
  });
  
  // Auth buttons
  const loginBtn = document.querySelector('[data-i18n="login"]');
  if (loginBtn) loginBtn.textContent = t('login');
  const registerBtn = document.querySelector('[data-i18n="register"]');
  if (registerBtn) registerBtn.textContent = t('register');
  
  // User menu
  const profileBtn = document.querySelector('#profileBtn .menuText');
  if (profileBtn) profileBtn.textContent = t('profile');
  const likesBtn = document.querySelector('#likesBtn .menuText');
  if (likesBtn) likesBtn.textContent = t('savePosts');
  const settingsBtn = document.querySelector('#settingsBtn .menuText');
  if (settingsBtn) settingsBtn.textContent = t('settings');
  const logoutBtn = document.querySelector('#logoutBtn .menuText');
  if (logoutBtn) logoutBtn.textContent = t('logout');
  
  // Language toggle button
  const langBtn = document.getElementById('langToggleBtn');
  const langBtnText = langBtn?.querySelector('.menuText');
  const langSwitch = langBtn?.querySelector('.menuSwitch');
  if (langBtnText) langBtnText.textContent = currentLang === 'en' ? t('bangla') : t('english');
  if (langSwitch) langSwitch.textContent = currentLang === 'en' ? 'EN' : 'বাং';
  
  // Comment forms
  document.querySelectorAll('.commentForm textarea').forEach(el => {
    el.placeholder = t('commentPlaceholder');
  });
  document.querySelectorAll('.commentForm button[type="submit"]').forEach(el => {
    el.textContent = t('commentBtn');
  });
  
  // Featured section
  const featuredTitle = document.querySelector('.featuredPosts h2, #featuredPosts h2');
  if (featuredTitle) featuredTitle.textContent = '✨ ' + t('featuredStories');
  
  // Update all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[currentLang][key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = t(key);
      } else {
        // Preserve icons
        const icon = el.textContent.match(/[📖✍️📝👤❤️⚙️🚪🌐]/)?.[0] || '';
        el.textContent = icon ? icon + ' ' + t(key) : t(key);
        
        // Update typewriter data-phrases if element has that attribute
        if (el.classList.contains('typewriterTarget') && el.dataset.phrases) {
          el.dataset.phrases = t(key);
          el.textContent = t(key).split('|')[0].trim();
        }
      }
    }
  });
}

document.getElementById('langToggleBtn')?.addEventListener('click', () => {
  currentLang = currentLang === 'en' ? 'bn' : 'en';
  localStorage.setItem(LANG_KEY, currentLang);
  updateLangUI();
  document.title = t('pageTitle');
  
  // Reinitialize typewriter with new language
  initTypewriter();
  
  renderPosts(); // re-render to update button labels
  
  // Auto-hide user menu on mobile after language selection
  if (userMenu && !userMenu.classList.contains('hidden')) {
    userMenu.classList.add('hidden');
    userMenu.setAttribute('aria-hidden', 'true');
  }
  
  // Update open modals
  const aboutModal = document.getElementById("aboutModal");
  if (aboutModal && !aboutModal.classList.contains("hidden")) {
    renderAboutAuthor();
  }
  
  // Check which modal is open and re-render it
  const modals = [
    { id: 'tipsModal', link: 'writingTipsLink' },
    { id: 'privacyModal', link: 'privacyLink' },
    { id: 'termsModal', link: 'termsLink' }
  ];
  
  modals.forEach(({ id, link }) => {
    const modal = document.getElementById(id);
    if (modal && !modal.classList.contains("hidden")) {
      document.getElementById(link)?.click();
    }
  });
});

window.addEventListener('DOMContentLoaded', () => {
  updateLangUI();
  document.title = t('pageTitle');
});

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
  }, 800);
}

// In-app notification center (simple, client-side)
const APP_NOTIFICATIONS = [];
// ============================================
// Notification System (Firebase-based)
// ============================================
async function loadNotifications() {
  if (!auth.currentUser) {
    renderNotifBadge(0);
    renderNotifPanel([]);
    return;
  }
  
  try {
    const notifications = await getUserNotifications(auth.currentUser.uid);
    const unreadCount = notifications.filter(n => !n.read).length;
    renderNotifBadge(unreadCount);
    renderNotifPanel(notifications);
  } catch (error) {
    console.error("Error loading notifications:", error);
  }
}

function renderNotifBadge(count) {
  if (!notifBadge) return;
  
  if (count === 0) {
    notifBadge.classList.add("hidden");
  } else {
    notifBadge.classList.remove("hidden");
    notifBadge.textContent = count > 99 ? "99+" : String(count);
    notifBadge.title = `${count} notification${count !== 1 ? "s" : ""}`;
    // Add bounce animation for new notifications
    notifBadge.style.animation = "none";
    setTimeout(() => {
      notifBadge.style.animation = "badgePulse 0.6s ease";
    }, 10);
  }
}

function renderNotifPanel(notifications) {
  if (!notifList) return;
  
  if (notifications.length === 0) {
    notifList.innerHTML = `<div style="color:var(--text-secondary);padding:20px;text-align:center;font-style:italic" data-i18n="noNotifications">${t("noNotifications")}</div>`;
    return;
  }
  
  notifList.innerHTML = notifications.map((n, index) => {
    const isUnread = !n.read;
    let icon = "💬";
    let message = "";
    let timeAgo = "";
    
    if (n.createdAt) {
      try {
        const date = n.createdAt.toDate ? n.createdAt.toDate() : new Date(n.createdAt);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) timeAgo = "Just now";
        else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
        else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
        else timeAgo = `${diffDays}d ago`;
      } catch (e) {
        timeAgo = "";
      }
    }
    
    if (n.type === "comment_like") {
      icon = "♥";
      message = `<strong>${escapeHTML(n.fromUserName)}</strong> <span data-i18n="likedYourComment">${t("likedYourComment")}</span>: "${escapeHTML((n.commentText || "").substring(0, 40))}${n.commentText && n.commentText.length > 40 ? "..." : ""}"`;
    }
    
    return `
      <div class="notifItem" data-notif-id="${n.id}" data-post-id="${n.postId}" style="
        padding:12px;
        margin-bottom:8px;
        border-radius:8px;
        background:${isUnread ? "rgba(230, 57, 70, 0.05)" : "transparent"};
        border-left:3px solid ${isUnread ? "var(--accent-primary)" : "transparent"};
        cursor:pointer;
        transition:all 0.2s;
        animation:slideInUp ${0.3 + index * 0.05}s ease forwards;
      " onmouseover="this.style.background='rgba(230, 57, 70, 0.08)'" onmouseout="this.style.background='${isUnread ? "rgba(230, 57, 70, 0.05)" : "transparent"}'">
        <div style="display:flex;align-items:start;gap:10px;">
          <div style="font-size:20px;line-height:1;">${icon}</div>
          <div style="flex:1;">
            <div style="font-size:14px;color:var(--text);line-height:1.5;margin-bottom:4px;">${message}</div>
            <div style="font-size:12px;color:var(--text-secondary);">${timeAgo}</div>
          </div>
          ${isUnread ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--accent-primary);"></div>' : ''}
        </div>
      </div>
    `;
  }).join("");
  
  // Add click handlers to notification items
  document.querySelectorAll(".notifItem").forEach(item => {
    item.addEventListener("click", async () => {
      const notifId = item.dataset.notifId;
      const postId = item.dataset.postId;
      
      // Mark as read
      await markNotificationAsRead(notifId);
      await loadNotifications();
      
      // Close notification panel
      if (notifPanel) {
        notifPanel.classList.add("hidden");
      }
      
      // Scroll to the post (if on posts page)
      if (postId) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
          postElement.scrollIntoView({ behavior: "smooth", block: "center" });
          postElement.style.animation = "highlightPost 2s ease";
        }
      }
    });
  });
}

if (notifBtn) {
  notifBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    
    // Load latest notifications before showing
    await loadNotifications();
    
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
  clearNotifs.addEventListener("click", async () => {
    if (!auth.currentUser) return;
    
    await clearAllNotifications(auth.currentUser.uid);
    await loadNotifications();
    
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
    try {
      currentUserData = await getUserData(firebaseUser.uid);
    } catch (error) {
      console.error("Error loading user data:", error);
      currentUserData = null;
    }
    updateTopbar();
    // Load notifications for logged-in user
    await loadNotifications();
  } else {
    currentUserData = null;
    updateTopbar();
    // Clear notifications for logged-out state
    renderNotifBadge(0);
    renderNotifPanel([]);
  }
  // Hide auth loading spinner
  authLoading = false;
  document.getElementById('authLoadingSpinner')?.remove();
  // Show main UI (if you hide it by default, unhide here)
  // Setup filters and search
  setupFilterButtons();
  setupSearchInput();
  // Initial render
  if (allPosts.length === 0) {
    await renderFeaturedPosts();
    await renderPosts();
  }

  // Restore scroll position after content is loaded
  const y = parseInt(localStorage.getItem('scrollY'), 10);
  if (!isNaN(y)) {
    setTimeout(() => window.scrollTo(0, y), 50);
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
  console.log(`[renderPosts] Starting - postsToRender: ${postsToRender ? postsToRender.length : 'null'}, currentUser: ${auth.currentUser?.uid || 'not logged in'}`);
  
  if (postsToRender === null) {
    allPosts = await getPublishedPosts();
    postsToRender = allPosts;
  }

  if (postsToRender === null) {
    allPosts = await getPublishedPosts();
    postsToRender = allPosts;
  }

  let posts = postsToRender;
  console.log(`[renderPosts] Total posts to render: ${posts.length}`);
  
  // Deduplicate by id to avoid duplicate cards
  const seen = new Set();
  posts = posts.filter((p) => {
    if (!p || !p.id) return true;
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  if (posts.length === 0) {
    const noPostsTitle = currentFilter === "all" ? t('noStoriesYet') : t('noStoriesFound');
    const noPostsMsg = currentFilter === "all" ? t('storiesWillAppear') : `${t('no')} ${currentFilter}${t('noMatch')}`;
    postsRoot.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--secondary)">
        <div style="font-size:48px;margin-bottom:16px">📚</div>
        <h2 style="margin:0 0 12px 0;color:var(--text);font-size:24px">${noPostsTitle}</h2>
        <p style="margin:0;font-size:15px">${noPostsMsg}</p>
      </div>
    `;
    return;
  }

  postsRoot.innerHTML = "";

  for (const post of posts) {
    console.log(`[renderPosts] Processing post - id: ${post.id}, title: ${post.title}, likes: ${post.likes || 0}, comments: ${post.comments || 0}, imageUrl: ${post.imageUrl || 'none'}, image: ${post.image || 'none'}, coverImage: ${post.coverImage || 'none'}`);
    
    const el = document.createElement("article");
    el.className = "post card";
    el.setAttribute("data-post-id", post.id);

    const categoryIcon =
      post.category === "Novel" ? "📖" : post.category === "Poem" ? "✍️" : "📝";

    // Check if user liked this post
    let isLiked = false;
    if (auth.currentUser) {
      isLiked = await isPostLikedByUser(post.id, auth.currentUser.uid);
    }

    // Check if user saved this post
    const savedList = currentUserData?.savedPosts || [];
    let isSaved = auth.currentUser ? savedList.includes(post.id) : false;

    // Get comments (support threaded comments with parentId)
    const comments = await getPostComments(post.id);
    console.log(`[renderPosts] Post ${post.id} has ${comments.length} comments:`, comments);
    
    // Check liked status for each comment if user is logged in
    if (auth.currentUser) {
      for (const comment of comments) {
        comment.likedByCurrentUser = await isCommentLikedByUser(comment.id, auth.currentUser.uid);
      }
    }
    
    // build comment tree map
    const commentsByParent = {};
    comments.forEach((c) => {
      const pid = c.parentId || null;
      if (!commentsByParent[pid]) commentsByParent[pid] = [];
      commentsByParent[pid].push(c);
    });
    function renderComment(c) {
      const replies = commentsByParent[c.id] || [];
      const likeCount = c.likes || 0;
      const isLiked = c.likedByCurrentUser || false;
      // Handle Firestore Timestamp
      let dateStr = '';
      if (c.createdAt) {
        try {
          const date = c.createdAt.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
          dateStr = date.toLocaleString();
        } catch (e) {
          dateStr = '';
        }
      }
      return `
        <div class="commentBox${c.parentId ? ' reply' : ''}" style="background:#161b22;border:1px solid #30363d;border-radius:12px;padding:16px;margin-bottom:12px;transition:all 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.2);">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
            <div class="commentAvatar" style="width:40px;height:40px;border-radius:50%;background:${c.userProfilePic ? '#e3e3e3' : 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))'};display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.1);overflow:hidden;flex-shrink:0;">
              ${c.userProfilePic ? `<img src="${c.userProfilePic}" alt="${escapeHTML(c.userName || 'User')}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.parentElement.style.background='linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))';this.parentElement.textContent='${escapeHTML((c.userName||'A').charAt(0).toUpperCase())}'">` : escapeHTML((c.userName||'A').charAt(0).toUpperCase())}
            </div>
            <div style="flex:1;">
              <span class="commentName" style="font-weight:600;color:var(--text);font-size:15px;">${escapeHTML(c.userName || 'Anonymous')}</span>
              <span style="color:var(--text-secondary);font-size:12px;margin-left:8px;">${dateStr}</span>
            </div>
          </div>
          <div class="commentText" style="margin-bottom:12px;color:var(--text);font-size:14px;line-height:1.7;padding-left:52px;">${escapeHTML(c.text || '')}</div>
          <div class="commentActions" style="display:flex;align-items:center;gap:16px;padding-left:52px;">
            <button class="commentLikeBtn${isLiked ? ' liked' : ''}" data-comment-id="${c.id}" data-liked="${isLiked}" style="background:none;border:none;cursor:pointer;color:${isLiked ? '#e63946' : 'var(--text-secondary)'};font-size:18px;transition:all 0.2s;display:flex;align-items:center;gap:4px;">
              <span>♥</span>
              <span class="commentLikeCount" style="font-size:13px;">${likeCount}</span>
            </button>
          </div>
          ${
            replies.length > 0
              ? `<div class="commentReplies" style="margin-top:12px;padding-left:52px;border-left:3px solid var(--accent-primary);">${replies
                  .map(renderComment)
                  .join('')}</div>`
              : ''
          }
        </div>`;
    }
    const allComments = commentsByParent[null] || [];
    console.log(`[renderPosts] Post ${post.id} - Top-level comments to render: ${allComments.length}`, allComments);
    
    const commentsHTML =
      allComments.length === 0
        ? '<div class="pf-empty">No comments yet</div>'
        : allComments.map(renderComment).join("");

    const tagsHTML =
      (post.tags || []).length > 0
        ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">
          ${post.tags.map((tag) => `<span class="tagBadge">#${tag}</span>`).join("")}
        </div>`
        : "";

    const fullTextRaw = post.content || post.excerpt || "";
    const plainText =
      new DOMParser().parseFromString(fullTextRaw, "text/html").body
        .textContent || "";
    const fullText = escapeHTML(plainText).replace(/\n/g, "<br>");
    const shortText =
      escapeHTML(plainText).substring(0, 150) +
      (plainText.length > 150 ? "..." : "");
    const showMore = plainText.length > 150;

    // Image HTML - check multiple possible field names for post images
    const postImageUrl = post.imageUrl || post.image || post.coverImage || null;
    const imageHTML = postImageUrl ? `
      <div class="postImageWrap" style="width:100%;max-height:300px;overflow:hidden;border-radius:12px;margin-bottom:16px;">
        <img src="${postImageUrl}" alt="${escapeHTML(post.title)}" class="postImage" style="width:100%;height:auto;max-height:300px;object-fit:cover;display:block;border-radius:12px;" onerror="this.parentElement.style.display='none'" />
      </div>
    ` : '';

    el.innerHTML = `
      <div class="postHeader">
        <h3 class="postTitle">${escapeHTML(post.title)}</h3>
        <div class="postMeta">
          <span>${new Date(post.publishedAt?.toDate?.() || new Date()).toLocaleDateString()}</span>
          ${post.category ? `<span class="moodTag" style="background:rgba(67,123,157,0.15);color:#457b9d">${categoryIcon} ${post.category}</span>` : ""}
          ${post.mood ? `<span class="moodTag" style="background:rgba(230,57,70,0.15);color:#e63946">${post.mood}</span>` : ""}
          <span>${t('by')} ${escapeHTML(post.authorName)}</span>
        </div>
      </div>

      ${imageHTML}

      <div class="postContent">
        <p class="postContentText" data-expanded="false" style="color:var(--text);line-height:1.6;margin:12px 0">
          ${shortText}
        </p>
        ${showMore ? `<span class="readMore" role="button" aria-expanded="false">${t('more') || 'More'}</span>` : ""}
      </div>

      ${tagsHTML}

      <div class="actionsRow">
        <button class="likeBtn ${isLiked ? "liked" : ""}" data-post-id="${post.id}" data-like="${isLiked}">
          <span class="heart">♥</span>
          <span class="count">${post.likes || 0}</span>
        </button>
        <button class="toggleCommentsBtn" data-post-id="${post.id}" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;border-radius:8px;padding:8px 16px;display:flex;align-items:center;gap:6px;font-weight:600;box-shadow:0 2px 8px rgba(102,126,234,0.3);transition:all 0.3s ease;">
          <span style="font-size:16px;">💬</span>
          <span class="commentCount">${comments.length}</span>
        </button>
        <button class="saveBtn ${isSaved ? "saved" : ""}" data-post-id="${post.id}" data-saved="${isSaved}">
          <span>🔖</span>
          <span>${isSaved ? t('saved') : t('save')}</span>
        </button>
        <div class="postMeta">
          <span>👁️ ${post.views || 0} ${t('viewsCount')} · ⏱️ ${post.readingTime || 1} ${t('minRead')}</span>
        </div>
      </div>

      <div class="commentsSection" id="commentsSection-${post.id}" style="display:none;padding:20px;background:var(--card);border-radius:12px;border:1px solid var(--border);margin-top:16px;">
        <h4 style="margin:0 0 16px;font-size:18px;font-weight:600;color:var(--text);">${t('comments')} (${comments.length})</h4>
        <div class="commentList" style="max-height:400px;overflow-y:auto;margin-bottom:16px;">
          ${comments.length === 0 
            ? `<div class="pf-empty" style="padding:40px 20px;text-align:center;color:var(--text-secondary);">${t('noCommentsYet')}</div>` 
            : comments.map(renderComment).join('')
          }
        </div>
        <form class="commentForm" data-post-id="${post.id}" style="margin-top:0;padding-top:16px;border-top:1px solid var(--border);">
          ${auth.currentUser ? "" : `<input name="name" placeholder="Your name" style="width:100%;padding:12px;margin-bottom:12px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text);font-size:14px;"/>`}
          <textarea name="text" placeholder="${t('commentPlaceholder') || 'Write a kind thought...'}" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text);min-height:100px;resize:vertical;font-size:14px;font-family:inherit;"></textarea>
          <button type="submit" style="margin-top:12px;padding:10px 24px;background:linear-gradient(90deg,var(--accent-primary),var(--accent-secondary));color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:14px;transition:transform 0.2s;">${t('commentBtn') || 'Comment'}</button>
        </form>
      </div>
    `;

    postsRoot.appendChild(el);

    // Comments modal open/close logic
    // Toggle comments section
    const toggleCommentsBtn = el.querySelector('.toggleCommentsBtn');
    const commentsSection = el.querySelector('.commentsSection');
    if (toggleCommentsBtn && commentsSection) {
      toggleCommentsBtn.addEventListener('click', () => {
        const isHidden = commentsSection.style.display === 'none';
        commentsSection.style.display = isHidden ? 'block' : 'none';
        toggleCommentsBtn.style.background = isHidden ? 'linear-gradient(135deg,#764ba2 0%,#667eea 100%)' : 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)';
        toggleCommentsBtn.style.transform = isHidden ? 'translateY(-2px)' : 'translateY(0)';
        toggleCommentsBtn.style.boxShadow = isHidden ? '0 4px 12px rgba(102,126,234,0.4)' : '0 2px 8px rgba(102,126,234,0.3)';
      });
    }

    // Add like handler for all comment like buttons
    el.querySelectorAll('.commentLikeBtn').forEach(btn => {
      btn.addEventListener('click', async function() {
        if (!auth.currentUser) {
          showNotification("Please log in to like comments", "error");
          return;
        }

        const commentId = btn.dataset.commentId;
        const likeCountSpan = btn.querySelector('.commentLikeCount');
        const isLiked = btn.dataset.liked === 'true';
        let count = parseInt(likeCountSpan.textContent) || 0;
        
        // Instant UI update
        if (isLiked) {
          btn.dataset.liked = 'false';
          btn.classList.remove('liked');
          btn.style.color = 'var(--text-secondary)';
          count = Math.max(0, count - 1);
          likeCountSpan.textContent = String(count);
          
          // Sync with backend
          await unlikeComment(commentId, auth.currentUser.uid);
        } else {
          btn.dataset.liked = 'true';
          btn.classList.add('liked');
          btn.style.color = '#e63946';
          count = count + 1;
          likeCountSpan.textContent = String(count);
          
          // Sync with backend (pass user name for notification)
          const userName = currentUserData?.displayName || auth.currentUser.displayName || auth.currentUser.email || "Someone";
          await likeComment(commentId, auth.currentUser.uid, userName);
          
          // Reload notifications to show the new notification
          if (auth.currentUser) {
            setTimeout(() => loadNotifications(), 1000);
          }
        }
      });
    });

    // Show all comments button handler (removed - now showing all comments by default)

    const readMoreBtn = el.querySelector(".readMore");
    const contentText = el.querySelector(".postContentText");
    if (readMoreBtn && contentText) {
      const shortHtml = shortText;
      const fullHtml = fullText;
      readMoreBtn.addEventListener("click", () => {
        const expanded = contentText.dataset.expanded === "true";
        if (expanded) {
          contentText.innerHTML = shortHtml;
          contentText.dataset.expanded = "false";
          contentText.parentElement.classList.remove("expanded");
          readMoreBtn.textContent = t('more');
          readMoreBtn.setAttribute("aria-expanded", "false");
          const backTo = Number(contentText.dataset.scrollTop || 0);
          if (Number.isFinite(backTo)) {
            window.scrollTo({ top: backTo, behavior: "smooth" });
          }
        } else {
          contentText.dataset.scrollTop = String(window.scrollY);
          contentText.innerHTML = fullHtml;
          contentText.dataset.expanded = "true";
          contentText.parentElement.classList.add("expanded");
          readMoreBtn.textContent = t('less');
          readMoreBtn.setAttribute("aria-expanded", "true");
        }
      });
    }

    // Like button handler
    el.querySelector(".likeBtn").addEventListener("click", async () => {
      if (!auth.currentUser) {
        showNotification("Please log in to react", "error");
        return;
      }

      const btn = el.querySelector(".likeBtn");
      const postId = btn.dataset.postId;
      const isCurrentlyLiked = btn.dataset.like === "true";
      const countSpan = btn.querySelector(".count");
      let count = parseInt(countSpan.textContent) || 0;

      console.log(`[likeBtn] Clicked - postId: ${postId}, userId: ${auth.currentUser.uid}, isCurrentlyLiked: ${isCurrentlyLiked}, count: ${count}`);

      // Instant UI update
      if (isCurrentlyLiked) {
        btn.dataset.like = "false";
        btn.classList.remove("liked");
        count = Math.max(0, count - 1);
        countSpan.textContent = String(count);
      } else {
        btn.dataset.like = "true";
        btn.classList.add("liked");
        count = count + 1;
        countSpan.textContent = String(count);
      }

      // Sync with backend
      try {
        let result;
        if (isCurrentlyLiked) {
          console.log(`[likeBtn] Calling unlikePost...`);
          result = await unlikePost(postId, auth.currentUser.uid);
          if (!result) throw new Error("Failed to unlike");
          console.log(`[likeBtn] Unlike successful`);
          if (window.pushAppNotification)
            window.pushAppNotification("Interaction", "You unliked this post");
        } else {
          console.log(`[likeBtn] Calling likePost...`);
          result = await likePost(postId, auth.currentUser.uid);
          if (!result) throw new Error("Failed to like");
          console.log(`[likeBtn] Like successful`);
          if (window.pushAppNotification)
            window.pushAppNotification("Interaction", "You liked this post!");
        }
      } catch (err) {
        console.error("Like error:", err);
        // Revert UI if backend fails
        const newIsLiked = isCurrentlyLiked;
        btn.dataset.like = String(newIsLiked);
        if (newIsLiked) {
          btn.classList.add("liked");
        } else {
          btn.classList.remove("liked");
        }
        count = isCurrentlyLiked ? count + 1 : Math.max(0, count - 1);
        countSpan.textContent = String(count);
        showNotification("Failed to update like. Please try again.", "error");
      }
    });

    // Save button handler
    const saveBtn = el.querySelector(".saveBtn");
    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        if (!auth.currentUser) {
          showNotification("Please log in to save", "error");
          return;
        }

        const postId = saveBtn.dataset.postId;
        const currentlySaved = saveBtn.dataset.saved === "true";

        if (currentlySaved) {
          const ok = await unsavePostForUser(auth.currentUser.uid, postId);
          if (ok) {
            saveBtn.dataset.saved = "false";
            saveBtn.classList.remove("saved");
            saveBtn.querySelector("span:last-child").textContent = "Save";
            currentUserData.savedPosts = (currentUserData.savedPosts || []).filter(
              (id) => id !== postId,
            );
            if (window.pushAppNotification)
              window.pushAppNotification("Saved", "Removed from saved");
          } else {
            showNotification("Failed to unsave", "error");
          }
        } else {
          const ok = await savePostForUser(auth.currentUser.uid, postId);
          if (ok) {
            saveBtn.dataset.saved = "true";
            saveBtn.classList.add("saved");
            saveBtn.querySelector("span:last-child").textContent = "Saved";
            currentUserData.savedPosts = [
              ...(currentUserData.savedPosts || []),
              postId,
            ];
            if (window.pushAppNotification)
              window.pushAppNotification("Saved", "Post saved to your list");
          } else {
            showNotification("Failed to save", "error");
          }
        }
      });
    }

    // Comment form handler
    el.querySelector(".commentForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      
      // Require authentication to comment
      if (!auth.currentUser) {
        showNotification("Please log in to comment", "error");
        return;
      }

      const form = e.target;
      const postId = form.dataset.postId;
      
      // Get username - prioritize current user's displayName
      const name = currentUserData?.displayName || auth.currentUser.displayName || auth.currentUser.email || "User";
      
      const text = form.elements.text.value.trim();

      if (!text) {
        showNotification("Please enter a comment", "error");
        return;
      }

      // Instant UI update
      const commentList = el.querySelector('.commentList');
      const tempId = 'temp-' + Date.now();
      const tempComment = document.createElement('div');
      tempComment.className = 'commentBox';
      tempComment.dataset.temp = tempId;
      tempComment.style.cssText = 'background:#161b22;border:1px solid #30363d;border-radius:12px;padding:14px 16px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.2);';
      const userProfilePic = currentUserData?.profilePic || null;
      tempComment.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <div class="commentAvatar" style="width:36px;height:36px;border-radius:50%;background:${userProfilePic ? '#e3e3e3' : 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))'};display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:15px;overflow:hidden;flex-shrink:0;box-shadow:0 1px 4px rgba(0,0,0,0.1);">
            ${userProfilePic ? `<img src="${userProfilePic}" alt="${escapeHTML(name)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.parentElement.style.background='linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))';this.parentElement.textContent='${escapeHTML(name.charAt(0).toUpperCase())}'">` : escapeHTML(name.charAt(0).toUpperCase())}
          </div>
          <div style="flex:1;">
            <span class="commentName" style="font-weight:600;color:var(--text, #222);font-size:15px;">${escapeHTML(name)}</span>
            <span style="color:var(--text-secondary, #aaa);font-size:12px;margin-left:8px;">Just now</span>
          </div>
        </div>
        <div class="commentText" style="margin-bottom:10px;color:var(--text);font-size:14px;line-height:1.7;padding-left:46px;">${escapeHTML(text)}</div>
        <div class="commentActions" style="display:flex;align-items:center;gap:12px;padding-left:46px;">
          <button style="background:none;border:none;cursor:pointer;color:var(--text-secondary);font-size:16px;display:flex;align-items:center;gap:4px;">
            <span>♥</span>
            <span class="commentLikeCount" style="font-size:13px;">0</span>
          </button>
        </div>
      `;
      
      // Remove "No comments yet" message if it exists
      const emptyMsg = commentList.querySelector('.pf-empty');
      if (emptyMsg) emptyMsg.remove();
      
      commentList.appendChild(tempComment);
      
      // Update comment count instantly in both toggle button and section heading
      const postCard = el; // Current post element
      const toggleCommentsBtn = postCard.querySelector('.toggleCommentsBtn');
      const commentCountSpan = toggleCommentsBtn?.querySelector('.commentCount');
      const commentsSection = postCard.querySelector('.commentsSection');
      const commentsSectionHeading = commentsSection?.querySelector('h4');
      
      if (commentCountSpan) {
        const currentCount = parseInt(commentCountSpan.textContent) || 0;
        const newCount = currentCount + 1;
        commentCountSpan.textContent = newCount;
        
        // Also update the heading "Comments (X)"
        if (commentsSectionHeading) {
          commentsSectionHeading.textContent = `${t('comments')} (${newCount})`;
        }
      }
      
      form.reset();

      // Sync with backend
      try {
        const userProfilePic = currentUserData?.profilePic || null;
        const commentId = await addComment(
          postId, 
          auth.currentUser.uid,
          name, 
          text,
          userProfilePic
        );
        
        if (!commentId) {
          throw new Error("Failed to create comment");
        }
        
        console.log(`[submitComment] Comment posted successfully: ${commentId}`);
        
        if (window.pushAppNotification)
          window.pushAppNotification("Comment", "Your comment was posted!");
        
        // Refresh comments in the modal instead of re-rendering all posts
        const freshComments = await getPostComments(postId);
        console.log(`[submitComment] Refreshed comments - now have ${freshComments.length} total`);
        
        // Update the modal with fresh comments
        const commentList = el.querySelector('.commentList');
        const commentsByParent = {};
        freshComments.forEach((c) => {
          const pid = c.parentId || null;
          if (!commentsByParent[pid]) commentsByParent[pid] = [];
          commentsByParent[pid].push(c);
        });
        
        function renderComment(c) {
          const replies = commentsByParent[c.id] || [];
          const likeCount = c.likes || 0;
          const isLiked = c.likedByCurrentUser || false;
          let dateStr = '';
          if (c.createdAt) {
            try {
              const date = c.createdAt.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
              dateStr = date.toLocaleString();
            } catch (e) {
              dateStr = '';
            }
          }
          return `
            <div class="commentBox${c.parentId ? ' reply' : ''}" style="background:#161b22;border:1px solid #30363d;border-radius:12px;padding:14px 16px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.2);">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                <div class="commentAvatar" style="width:36px;height:36px;border-radius:50%;background:${c.userProfilePic ? '#e3e3e3' : 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))'};display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:15px;overflow:hidden;flex-shrink:0;box-shadow:0 1px 4px rgba(0,0,0,0.1);">
                  ${c.userProfilePic ? `<img src="${c.userProfilePic}" alt="${escapeHTML(c.userName || 'User')}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.parentElement.style.background='linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))';this.parentElement.textContent='${escapeHTML((c.userName||'A').charAt(0).toUpperCase())}'">` : escapeHTML((c.userName||'A').charAt(0).toUpperCase())}
                </div>
                <div style="flex:1;">
                  <span class="commentName" style="font-weight:600;color:var(--text);font-size:15px;">${escapeHTML(c.userName)}</span>
                  <span style="color:var(--text-secondary);font-size:12px;margin-left:8px;">${dateStr}</span>
                </div>
              </div>
              <div class="commentText" style="margin-bottom:10px;color:var(--text);font-size:14px;line-height:1.7;padding-left:46px;">${escapeHTML(c.text)}</div>
              <div class="commentActions" style="display:flex;align-items:center;gap:12px;padding-left:46px;">
                <button class="commentLikeBtn${isLiked ? ' liked' : ''}" data-comment-id="${c.id}" data-liked="${isLiked}" style="background:none;border:none;cursor:pointer;color:${isLiked ? '#e63946' : 'var(--text-secondary)'};font-size:16px;transition:color 0.2s;display:flex;align-items:center;gap:4px;">
                  <span>♥</span>
                  <span class="commentLikeCount" style="font-size:13px;">${likeCount}</span>
                </button>
              </div>
              ${
                replies.length > 0
                  ? `<div class="commentReplies" style="margin-top:12px;padding-left:46px;border-left:2px solid var(--border);">${replies
                      .map(renderComment)
                      .join('')}</div>`
                  : ''
              }
            </div>`;
        }
        
        const allComments = commentsByParent[null] || [];
        commentList.innerHTML = allComments.length === 0 
          ? '<div class="pf-empty">No comments yet</div>'
          : allComments.map(renderComment).join('');
        
        // Re-attach event listeners for comment like buttons in modal
        el.querySelectorAll('.commentLikeBtn').forEach(btn => {
          btn.addEventListener('click', async function() {
            if (!auth.currentUser) {
              showNotification("Please log in to like comments", "error");
              return;
            }

            const commentId = btn.dataset.commentId;
            const likeCountSpan = btn.querySelector('.commentLikeCount');
            const isLiked = btn.dataset.liked === 'true';
            let count = parseInt(likeCountSpan.textContent) || 0;
            
            // Instant UI update
            if (isLiked) {
              btn.dataset.liked = 'false';
              btn.classList.remove('liked');
              btn.style.color = 'var(--text-secondary)';
              count = Math.max(0, count - 1);
              likeCountSpan.textContent = String(count);
              
              // Sync with backend
              await unlikeComment(commentId, auth.currentUser.uid);
            } else {
              btn.dataset.liked = 'true';
              btn.classList.add('liked');
              btn.style.color = '#e63946';
              count = count + 1;
              likeCountSpan.textContent = String(count);
              
              // Sync with backend
              const userName = currentUserData?.displayName || auth.currentUser.displayName || auth.currentUser.email || "Someone";
              await likeComment(commentId, auth.currentUser.uid, userName);
              
              // Reload notifications
              if (auth.currentUser) {
                setTimeout(() => loadNotifications(), 1000);
              }
            }
          });
        });
        
        // Also update comment count button
        const toggleCommentsBtn = el.querySelector('.toggleCommentsBtn');
        const commentCountSpan = toggleCommentsBtn?.querySelector('.commentCount');
        if (commentCountSpan) {
          commentCountSpan.textContent = freshComments.length;
        }
        
      } catch (err) {
        console.error("Comment error:", err);
        tempComment.remove();
        showNotification("Failed to post comment. Please try again.", "error");
      }
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

  if (user) {
    loginBtn.classList.add("hidden");
    registerBtn.classList.add("hidden");
    userIconBtn.classList.remove("hidden");
    
    // Update user menu header
    const displayName = currentUserData?.displayName || user.displayName || (user.email ? user.email.split('@')[0] : "User");
    const email = user.email || "";
    const userMenuDisplayName = document.querySelector('.userMenuDisplayName');
    const userMenuEmail = document.querySelector('.userMenuEmail');
    const userMenuAvatar = document.querySelector('.userMenuAvatar');
    
    if (userMenuDisplayName) userMenuDisplayName.textContent = displayName;
    if (userMenuEmail) userMenuEmail.textContent = email;
    
    // Update avatar in menu
    if (userMenuAvatar) {
      if (currentUserData?.profilePic) {
        const avatarUrl = appendCacheBuster(currentUserData.profilePic);
        userMenuAvatar.style.backgroundImage = `url("${avatarUrl}")`;
        userMenuAvatar.style.background = `url("${avatarUrl}") center/cover`;
        userMenuAvatar.textContent = '';
      } else {
        userMenuAvatar.style.backgroundImage = '';
        userMenuAvatar.style.background = 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))';
        userMenuAvatar.textContent = displayName.charAt(0).toUpperCase();
      }
    }
    
    // Update likes badge
    const likesBadge = document.getElementById('likesBadge');
    if (likesBadge && currentUserData?.savedPosts) {
      const likeCount = currentUserData.savedPosts.length;
      likesBadge.textContent = likeCount;
      likesBadge.style.display = likeCount > 0 ? 'flex' : 'none';
    } else if (likesBadge) {
      likesBadge.textContent = '0';
      likesBadge.style.display = 'none';
    }

    if (currentUserData?.profilePic) {
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
    
    // Clear user menu header
    const userMenuDisplayName = document.querySelector('.userMenuDisplayName');
    const userMenuEmail = document.querySelector('.userMenuEmail');
    const userMenuAvatar = document.querySelector('.userMenuAvatar');
    if (userMenuDisplayName) userMenuDisplayName.textContent = '';
    if (userMenuEmail) userMenuEmail.textContent = '';
    if (userMenuAvatar) {
      userMenuAvatar.style.backgroundImage = '';
      userMenuAvatar.textContent = '';
    }
    
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
window.switchToLogin = switchToLogin;

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

  // No password validation for login - allow existing users with old passwords to login
  if (!password) {
    showNotification("⚠️ Please enter your password", "error");
    return;
  }

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

  // Strong password validation
  if (password.length < 8) {
    showNotification("⚠️ Password must be at least 8 characters", "error");
    return;
  }
  
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  if (!passwordRegex.test(password)) {
    showNotification("⚠️ Password must contain: uppercase, lowercase, number, and special character (@$!%*?&#)", "error");
    return;
  }

  try {
    await registerUser(email, password, username, fullName);
    registerForm.reset();
    showNotification("✅ Account created successfully! Please log in.", "success");
    
    // Automatically switch to login form
    setTimeout(() => {
      switchToLogin();
    }, 500);
  } catch (error) {
    showNotification(`❌ ${error.message}`, "error");
  }
});

// ============================================
// User Menu
// ============================================
if (userIconBtn) {
  userIconBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    userMenu.classList.toggle("hidden");
    userMenu.setAttribute(
      "aria-hidden",
      userMenu.classList.contains("hidden"),
    );
    if (notifPanel) {
      notifPanel.classList.add("hidden");
      notifPanel.setAttribute("aria-hidden", "true");
    }
  });
}

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

if (draftsBtn) {
  draftsBtn.addEventListener("click", async () => {
    if (!auth.currentUser || !currentUserData) {
      showNotification("Please log in to view drafts", "error");
      return;
    }
    try {
      await renderProfileModalFancy();
      showNotification("Opening your drafts...", "info");
    } catch (err) {
      console.error(err);
      showNotification("Unable to open drafts", "error");
    }
  });
}

if (likesBtn) {
  likesBtn.addEventListener("click", async () => {
    if (!auth.currentUser || !currentUserData) {
      showNotification("Not signed in", "error");
      return;
    }
    try {
      await renderProfileModalFancy();
      // Switch to Posts tab and show saved posts
      setTimeout(() => {
        const postsTabBtn = document.querySelector('.pf-tab[data-tab="posts"]');
        if (postsTabBtn) {
          postsTabBtn.click();
        }
        // Then click the Saved button
        setTimeout(() => {
          const savedBtn = document.getElementById('pf-showSaved');
          if (savedBtn) {
            savedBtn.click();
          }
        }, 150);
      }, 150);
    } catch (err) {
      console.error(err);
      showNotification("Unable to open saved posts", "error");
    }
  });
}

if (settingsBtn) {
  settingsBtn.addEventListener("click", async () => {
    if (!auth.currentUser || !currentUserData) {
      showNotification("Not signed in", "error");
      return;
    }
    try {
      await renderProfileModalFancy();
      // Switch to Settings tab
      setTimeout(() => {
        const settingsTabBtn = document.querySelector('.pf-tab[data-tab="settings"]');
        if (settingsTabBtn) {
          settingsTabBtn.click();
        }
      }, 150);
    } catch (err) {
      console.error(err);
      showNotification("Unable to open settings", "error");
    }
  });
}

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
        <h4>${t('aboutTitle')}</h4>
        <p>${t('aboutSubtitle')}</p>
        <p style="font-size:12px;color:var(--secondary);margin-top:8px">${t('aboutDescription')}</p>
      </div>
    </div>

    <div class="aboutSection">
      <h5>${t('aboutSectionTitle')}</h5>
      <p>${t('aboutText')}</p>
    </div>

    <div class="aboutSection">
      <h5>${t('missionTitle')}</h5>
      <p>${t('missionText')}</p>
    </div>

    <div class="aboutSection">
      <h5>${t('categoriesTitle')}</h5>
      <p><strong>${t('novelsLabel')}</strong> — ${t('novelsDesc')}<br><strong>${t('poemsLabel')}</strong> — ${t('poemsDesc')}<br><strong>${t('storiesLabel')}</strong> — ${t('storiesDesc')}</p>
    </div>

    <div class="aboutSection">
      <h5>${t('connectTitle')}</h5>
      <p>${t('connectText')}</p>
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
        <h4 style="margin:0 0 10px 0;color:var(--accent-primary);font-size:16px">📖 ${t('storyStructureTitle')}</h4>
        <p style="margin:0;color:var(--secondary);font-size:14px;line-height:1.7">${t('storyStructureText')}</p>
      </div>
      <div class="tipSection">
        <h4 style="margin:0 0 10px 0;color:var(--accent-primary);font-size:16px">✍️ ${t('writingCraftTitle')}</h4>
        <p style="margin:0;color:var(--secondary);font-size:14px;line-height:1.7">${t('writingCraftText')}</p>
      </div>
      <div class="tipSection">
        <h4 style="margin:0 0 10px 0;color:var(--accent-primary);font-size:16px">💡 ${t('inspirationTitle')}</h4>
        <p style="margin:0;color:var(--secondary);font-size:14px;line-height:1.7">${t('inspirationText')}</p>
      </div>
      <div class="tipSection">
        <h4 style="margin:0 0 10px 0;color:var(--accent-primary);font-size:16px">🎯 ${t('poetryTipsTitle')}</h4>
        <p style="margin:0;color:var(--secondary);font-size:14px;line-height:1.7">${t('poetryTipsText')}</p>
      </div>
      <div class="tipSection">
        <h4 style="margin:0 0 10px 0;color:var(--accent-primary);font-size:16px">⚡ ${t('shortStoryTitle')}</h4>
        <p style="margin:0;color:var(--secondary);font-size:14px;line-height:1.7">${t('shortStoryText')}</p>
      </div>
    </div>
  `;
  openModal("tipsModal", t('writingTipsTitle'), tipsContent);
});

// Privacy Policy
document.getElementById("privacyLink")?.addEventListener("click", (e) => {
  e.preventDefault();
  const privacyContent = `
    <div style="color:var(--secondary);font-size:13px;line-height:1.8">
      <h4 style="color:var(--accent-primary);margin-bottom:12px">${t('infoCollectTitle')}</h4>
      <p style="margin-bottom:16px">${t('infoCollectText')}</p>
      
      <h4 style="color:var(--accent-primary);margin-bottom:12px">${t('infoUseTitle')}</h4>
      <p style="margin-bottom:16px">${t('infoUseText')}</p>
      
      <h4 style="color:var(--accent-primary);margin-bottom:12px">${t('dataSecurityTitle')}</h4>
      <p style="margin-bottom:16px">${t('dataSecurityText')}</p>
      
      <h4 style="color:var(--accent-primary);margin-bottom:12px">${t('yourRightsTitle')}</h4>
      <p style="margin-bottom:16px">${t('yourRightsText')}</p>
      
      <h4 style="color:var(--accent-primary);margin-bottom:12px">${t('cookiesTitle')}</h4>
      <p style="margin-bottom:16px">${t('cookiesText')}</p>
      
      <p style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);font-style:italic">${t('lastUpdated')}</p>
    </div>
  `;
  openModal("privacyModal", t('privacyTitle'), privacyContent);
});

// Terms of Service
document.getElementById("termsLink")?.addEventListener("click", (e) => {
  e.preventDefault();
  const termsContent = `
    <div style="color:var(--secondary);font-size:13px;line-height:1.8">
      <h4 style="color:var(--accent-primary);margin-bottom:12px">${t('userAgreementTitle')}</h4>
      <p style="margin-bottom:16px">${t('userAgreementText')}</p>
      
      <h4 style="color:var(--accent-primary);margin-bottom:12px">${t('contentOwnershipTitle')}</h4>
      <p style="margin-bottom:16px">${t('contentOwnershipText')}</p>
      
      <h4 style="color:var(--accent-primary);margin-bottom:12px">${t('communityGuidelinesTitle')}</h4>
      <p style="margin-bottom:16px">${t('communityGuidelinesText')}</p>
      
      <h4 style="color:var(--accent-primary);margin-bottom:12px">${t('acceptableUseTitle')}</h4>
      <p style="margin-bottom:16px">${t('acceptableUseText')}</p>
      
      <h4 style="color:var(--accent-primary);margin-bottom:12px">${t('liabilityTitle')}</h4>
      <p style="margin-bottom:16px">${t('liabilityText')}</p>
      
      <p style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);font-style:italic">${t('lastUpdated')}</p>
    </div>
  `;
  openModal("termsModal", t('termsTitle'), termsContent);
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

// Expose renderPosts globally for profile modal navigation
window.renderPosts = renderPosts;
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
