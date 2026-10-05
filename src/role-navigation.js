const sellerPages = new Set(['sellerHome', 'add', 'products', 'enquiries', 'buyers', 'pricing']);
const buyerPages = new Set(['buyerHome', 'search', 'categories', 'wishlist', 'buyerEnquiries', 'cart']);

export function canNavigateForRole(role, destination, explicitRoleSwitch = false) {
  if (explicitRoleSwitch) return true;
  if (role === 'seller' && buyerPages.has(destination)) return false;
  if (role === 'buyer' && sellerPages.has(destination)) return false;
  return true;
}

export function homeForRole(role) {
  return role === 'seller' ? 'sellerHome' : 'buyerHome';
}

export function startupPage() {
  return 'language';
}

export function destinationAfterPublish() {
  return 'products';
}
