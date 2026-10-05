import test from 'node:test';
import assert from 'node:assert/strict';
import { canNavigateForRole, destinationAfterPublish, homeForRole, startupPage } from './role-navigation.js';

test('seller routes cannot enter buyer pages without an explicit role switch', () => {
  for (const route of ['buyerHome', 'search', 'categories', 'wishlist', 'buyerEnquiries', 'cart']) {
    assert.equal(canNavigateForRole('seller', route), false, route);
  }
  for (const route of ['sellerHome', 'add', 'products', 'orders', 'enquiries', 'buyers', 'pricing', 'profile']) {
    assert.equal(canNavigateForRole('seller', route), true, route);
  }
});

test('buyer routes cannot enter seller pages without an explicit role switch', () => {
  for (const route of ['sellerHome', 'add', 'products', 'enquiries', 'buyers', 'pricing']) {
    assert.equal(canNavigateForRole('buyer', route), false, route);
  }
  for (const route of ['buyerHome', 'search', 'categories', 'wishlist', 'buyerEnquiries', 'cart', 'orders', 'profile']) {
    assert.equal(canNavigateForRole('buyer', route), true, route);
  }
});

test('only explicit switching crosses roles and seller publish stays in My Products', () => {
  assert.equal(canNavigateForRole('seller', 'buyerHome', true), true);
  assert.equal(canNavigateForRole('buyer', 'sellerHome', true), true);
  assert.equal(homeForRole('seller'), 'sellerHome');
  assert.equal(homeForRole('buyer'), 'buyerHome');
  assert.equal(destinationAfterPublish(), 'products');
});

test('every app startup begins at language selection even when a role was previously saved', () => {
  assert.equal(startupPage(), 'language');
});
