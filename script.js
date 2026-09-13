// ==========================================
// NAVIGATION SYSTEM & VIEW MANAGEMENT
// ==========================================
let viewHistory = ['pageHome'];

function showPage(pageId, isBack = false) {
  document.querySelectorAll('.view-page').forEach(page => {
    page.classList.remove('active');
  });

  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
  }

  // Update Back Button visibility
  const backBtn = document.getElementById('backBtn');
  if (pageId === 'pageHome') {
    backBtn.classList.remove('visible');
    document.getElementById('defaultLogoSection').style.display = 'flex';
    document.getElementById('categoriesHeaderSection').style.display = 'none';
  } else {
    backBtn.classList.add('visible');
    document.getElementById('defaultLogoSection').style.display = 'none';
    if (pageId === 'pageCategories') {
      document.getElementById('categoriesHeaderSection').style.display = 'flex';
    } else {
      document.getElementById('categoriesHeaderSection').style.display = 'none';
    }
  }

  if (!isBack && (viewHistory.length === 0 || viewHistory[viewHistory.length - 1] !== pageId)) {
    viewHistory.push(pageId);
  }
}

window.goBack = function() {
  if (viewHistory.length > 1) {
    viewHistory.pop();
    const previousPage = viewHistory[viewHistory.length - 1];
    showPage(previousPage, true);
  } else {
    showPage('pageHome', true);
  }
};

window.openCategories = function() {
  showPage('pageCategories');
};

// ==========================================
// ADMIN ACCESSIBILITY & STUBS
// ==========================================
let adminClickCounter = 0;
window.checkAdminAccess = function() {
  adminClickCounter++;
  if (adminClickCounter >= 5) {
    adminClickCounter = 0;
    showPage('pageLogin');
  }
};

window.performAdminLogin = function() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  if (email && password) {
    showPage('pageAdmin');
  } else {
    alert('يرجى كتابة البريد الإلكتروني وكلمة المرور');
  }
};

window.logoutAdmin = function() {
  showPage('pageHome');
};

// Filter functions
window.filterCategories = function() {
  // Logic for filtering categories dynamically
};

window.filterRestaurants = function() {
  // Logic for filtering restaurants dynamically
};

window.saveCategoryToFirebase = function() {};
window.resetCategoryForm = function() {};
window.saveRestaurantToFirebase = function() {};
window.resetAdminForm = function() {};

// Default Init
document.addEventListener('DOMContentLoaded', () => {
  showPage('pageHome');
});
