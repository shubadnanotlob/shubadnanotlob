import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDj5Cp_Fw8zRcCJGCPQ6F0_A6vLp98NNfU",
  authDomain: "shubadnanotlob-b5ff3.firebaseapp.com",
  projectId: "shubadnanotlob-b5ff3",
  storageBucket: "shubadnanotlob-b5ff3.firebasestorage.app",
  messagingSenderId: "549895905471",
  appId: "1:549895905471:web:5edaf449f3a4021e97e60a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentView = 'home';
let navigationHistory = [];
let currentRestaurantsList = [];
let currentHeroImage = '';
let adminClickCount = 0;
let adminClickTimer = null;
let isAuthenticated = false;

onAuthStateChanged(auth, (user) => {
  isAuthenticated = !!user;
});

function checkAdminAccess() {
  adminClickCount++;
  clearTimeout(adminClickTimer);
  adminClickTimer = setTimeout(() => { adminClickCount = 0; }, 1200);
  
  if (adminClickCount >= 6) {
    adminClickCount = 0;
    if (isAuthenticated || auth.currentUser) {
      renderAdminManageList();
      navigateTo('pageAdmin');
    } else {
      navigateTo('pageLogin');
    }
  }
}

function performAdminLogin() {
  let email = document.getElementById('loginEmail').value.trim();
  let password = document.getElementById('loginPassword').value.trim();
  
  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }
  
  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      document.getElementById('loginEmail').value = '';
      document.getElementById('loginPassword').value = '';
      renderAdminManageList();
      navigateTo('pageAdmin');
    })
    .catch(err => alert("Access Denied: " + err.message));
}

function logoutAdmin() {
  signOut(auth).then(() => {
    resetAdminForm();
    navigateTo('pageHome');
  });
}

async function saveRestaurantToFirebase() {
  if (!isAuthenticated && !auth.currentUser) {
    alert("Unauthorized session! Please log in again.");
    navigateTo('pageLogin');
    return;
  }
  
  let docId = document.getElementById('editDocId').value;
  let category = document.getElementById('adminCategory').value;
  let name = document.getElementById('adminName').value.trim();
  let desc = document.getElementById('adminDesc').value.trim();
  let logo = document.getElementById('adminLogo').value.trim();
  let galleryRaw = document.getElementById('adminGallery') ? document.getElementById('adminGallery').value.trim() : '';
  let phone = document.getElementById('adminPhone').value.trim();
  let menuUrl = document.getElementById('adminMenu').value.trim();
  let mapUrl = document.getElementById('adminMap').value.trim();
  
  if (!name) { alert('Please enter restaurant name'); return; }

  let gallery = galleryRaw ? galleryRaw.split(',').map(item => item.trim()).filter(Boolean) : [];
  
  let restData = {
    category,
    name,
    desc: desc || 'Delicious Food',
    logo: logo || '',
    gallery: gallery,
    phone: phone || '96170725668',
    menuUrl: menuUrl || '#',
    mapUrl: mapUrl || 'https://maps.google.com',
    updatedAt: serverTimestamp()
  };
  
  try {
    if (docId) {
      await updateDoc(doc(db, 'restaurants', docId), restData);
      alert('Restaurant updated successfully!');
    } else {
      await addDoc(collection(db, 'restaurants'), restData);
      alert('Restaurant saved successfully!');
    }
    resetAdminForm();
    renderAdminManageList();
  } catch (err) {
    alert("Error saving: " + err.message);
  }
}

function resetAdminForm() {
  document.getElementById('editDocId').value = '';
  document.getElementById('adminName').value = '';
  document.getElementById('adminDesc').value = '';
  document.getElementById('adminLogo').value = '';
  if (document.getElementById('adminGallery')) document.getElementById('adminGallery').value = '';
  document.getElementById('adminPhone').value = '';
  document.getElementById('adminMenu').value = '';
  document.getElementById('adminMap').value = '';
  document.getElementById('formTitle').innerText = 'Add New Restaurant';
}

async function renderAdminManageList() {
  let container = document.getElementById('adminManageListContainer');
  container.innerHTML = '<p style="text-align:center; padding:10px; font-size:12px; color:#666;">Loading servers...</p>';
  
  try {
    let snapshot = await getDocs(collection(db, 'restaurants'));
    container.innerHTML = '';
    if (snapshot.empty) {
      container.innerHTML = '<p style="text-align:center; color:#777; font-size:12px;">No restaurants found in database.</p>';
      return;
    }
    snapshot.forEach(docSnap => {
      let rest = docSnap.data();
      container.innerHTML += `
      <div class="admin-rest-item">
        <div>
          <strong style="font-size:13px; color:#141414;">${rest.name}</strong>
          <br><small style="color:#0f4c5c; font-weight:700;">${rest.category}</small>
        </div>
        <div style="display:flex; gap:6px;">
          <button onclick="editRest('${docSnap.id}')" style="background:#0f4c5c; color:#fff; border:none; padding:5px 10px; border-radius:6px; font-weight:700; cursor:pointer; font-size:11px;">Edit</button>
          <button onclick="deleteRest('${docSnap.id}')" style="background:#d32f2f; color:#fff; border:none; padding:5px 10px; border-radius:6px; font-weight:700; cursor:pointer; font-size:11px;">Delete</button>
        </div>
      </div>
      `;
    });
  } catch (err) {
    container.innerHTML = '<p style="text-align:center; color:red; font-size:12px;">Failed to load data</p>';
  }
}

window.editRest = async function(docId) {
  let docSnap = await getDoc(doc(db, 'restaurants', docId));
  if (docSnap.exists()) {
    let rest = docSnap.data();
    document.getElementById('editDocId').value = docSnap.id;
    document.getElementById('adminCategory').value = rest.category;
    document.getElementById('adminName').value = rest.name;
    document.getElementById('adminDesc').value = rest.desc || '';
    document.getElementById('adminLogo').value = rest.logo || '';
    if (document.getElementById('adminGallery')) {
      document.getElementById('adminGallery').value = rest.gallery ? rest.gallery.join(', ') : '';
    }
    document.getElementById('adminPhone').value = rest.phone || '';
    document.getElementById('adminMenu').value = rest.menuUrl || '';
    document.getElementById('adminMap').value = rest.mapUrl || '';
    document.getElementById('formTitle').innerText = 'Edit Restaurant Profile';
  }
};

window.deleteRest = async function(docId) {
  if (confirm('Delete this restaurant permanently from server?')) {
    await deleteDoc(doc(db, 'restaurants', docId));
    renderAdminManageList();
  }
};

function updateHeaders(pageId) {
  document.getElementById('defaultLogoSection').style.display = pageId === 'pageCategories' ? 'none' : 'flex';
  document.getElementById('categoriesHeaderSection').style.display = pageId === 'pageCategories' ? 'flex' : 'none';
  
  let headerTitles = {
    'pageHome': 'خيارك الأفضل دائماً',
    'pageCategories': 'الأقسام المتاحة',
    'pageRestaurants': 'قائمة المطاعم',
    'pageRestProfile': 'تفاصيل المطعم',
    'pageLogin': 'بوابة الإدارة',
    'pageAdmin': 'لوحة التحكم النشطة'
  };
  document.getElementById('headerTitleText').innerText = headerTitles[pageId] || 'Shu Badna Notlob';
}

function navigateTo(pageId, pushHistory = true) {
  if (pushHistory && currentView !== pageId) navigationHistory.push(currentView);
  document.querySelectorAll('.view-page').forEach(page => page.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  currentView = pageId;
  updateHeaders(pageId);
  document.getElementById('backBtn').classList.toggle('visible', pageId !== 'pageHome');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openCategories() { navigateTo('pageCategories'); }

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function openRestaurants(titleAr, titleEn, heroImageUrl) {
  document.getElementById('categoryHeroImg').src = heroImageUrl;
  document.getElementById('categoryHeroTitle').innerText = `${titleAr} / ${titleEn}`;
  currentHeroImage = heroImageUrl;
  
  const container = document.getElementById('restaurantsListContainer');
  container.innerHTML = '<p style="grid-column: span 2; text-align: center; color: #777; font-size: 13px; padding: 30px;">جاري تحميل المطاعم...</p>';
  navigateTo('pageRestaurants');

  try {
    let q = query(collection(db, 'restaurants'), where('category', '==', titleAr));
    let snapshot = await getDocs(q);
    currentRestaurantsList = [];
    snapshot.forEach(docSnap => {
      let data = docSnap.data();
      data.id = docSnap.id;
      currentRestaurantsList.push(data);
    });
    
    shuffleArray(currentRestaurantsList);
    renderRestaurants(currentRestaurantsList);
  } catch (err) {
    container.innerHTML = '<p style="grid-column: span 2; text-align: center; color: red; font-size: 13px; padding: 30px;">تعذر تحميل البيانات</p>';
  }
}

function renderRestaurants(list) {
  const container = document.getElementById('restaurantsListContainer');
  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = `<p style="grid-column: span 2; text-align: center; color: #777; font-size: 13px; padding: 30px;">لا توجد مطاعم متوفرة حالياً في هذا التصنيف</p>`;
    return;
  }

  const defaultFallbackLogo = 'assets/logo.png';

  list.forEach((rest, index) => {
    const logoSrc = (rest.logo && rest.logo.trim() !== '') ? rest.logo : defaultFallbackLogo;
    
    container.innerHTML += `
    <div class="restaurant-card" style="cursor: pointer;">
      <div class="rest-top-content" onclick="openRestaurantProfile(${index})">
        <img class="rest-icon" src="${logoSrc}" alt="Logo" onerror="this.onerror=null; this.src='${defaultFallbackLogo}';">
        <div class="rest-info">
          <h4>${rest.name}</h4>
          <p>${rest.desc}</p>
        </div>
      </div>
      <div class="rest-actions">
        <a href="${rest.menuUrl}" target="_blank" class="action-btn btn-menu" onclick="event.stopPropagation();">MENU</a>
        <a href="https://wa.me/${rest.phone}" target="_blank" class="action-btn btn-contact" onclick="event.stopPropagation();">CONTACT</a>
        <a href="${rest.mapUrl}" target="_blank" class="action-btn btn-location" onclick="event.stopPropagation();">LOCATION</a>
      </div>
    </div>
    `;
  });
}

window.openRestaurantProfile = function(index) {
  const rest = currentRestaurantsList[index];
  if (!rest) return;

  const defaultFallbackLogo = 'assets/logo.png';
  const logoSrc = (rest.logo && rest.logo.trim() !== '') ? rest.logo : defaultFallbackLogo;

  document.getElementById('profileLogo').src = logoSrc;
  document.getElementById('profileName').innerText = rest.name;
  document.getElementById('profileDesc').innerText = rest.desc;

  document.getElementById('profileMenuBtn').href = rest.menuUrl || '#';
  document.getElementById('profileContactBtn').href = `https://wa.me/${rest.phone}`;
  document.getElementById('profileLocationBtn').href = rest.mapUrl || '#';

  const galleryContainer = document.getElementById('profileGalleryContainer');
  galleryContainer.innerHTML = '';

  if (rest.gallery && rest.gallery.length > 0) {
    rest.gallery.forEach(imgUrl => {
      galleryContainer.innerHTML += `<img src="${imgUrl}" alt="Gallery Image" onerror="this.style.display='none'">`;
    });
  } else {
    galleryContainer.innerHTML = '<p style="grid-column: span 2; text-align:center; color:#888; font-size:12px;">لا توجد صور إضافية متوفرة حالياً</p>';
  }

  navigateTo('pageRestProfile');
};

function filterCategories() {
  let queryText = document.getElementById('categoriesSearchInput').value.toLowerCase();
  document.querySelectorAll('#categoriesGridContainer .category-card').forEach(card => {
    let match = card.getAttribute('data-ar').includes(queryText) || card.getAttribute('data-en').includes(queryText);
    card.style.display = match ? 'flex' : 'none';
  });
}

function filterRestaurants() {
  let queryText = document.getElementById('restaurantsSearchInput').value.toLowerCase();
  let filtered = currentRestaurantsList.filter(r => r.name.toLowerCase().includes(queryText));
  renderRestaurants(filtered);
}

function goBack() {
  if (navigationHistory.length > 0) navigateTo(navigationHistory.pop(), false);
  else navigateTo('pageHome', false);
}

window.checkAdminAccess = checkAdminAccess;
window.performAdminLogin = performAdminLogin;
window.logoutAdmin = logoutAdmin;
window.saveRestaurantToFirebase = saveRestaurantToFirebase;
window.resetAdminForm = resetAdminForm;
window.openCategories = openCategories;
window.openRestaurants = openRestaurants;
window.filterCategories = filterCategories;
window.filterRestaurants = filterRestaurants;
window.goBack = goBack;

