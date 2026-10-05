import test from 'node:test';
import assert from 'node:assert/strict';
import { getAppCopy } from './app-i18n.js';

test('buyer marketplace copy is complete and localized in every supported language', () => {
  for (const language of ['en-IN', 'ta-IN', 'hi-IN', 'ml-IN']) {
    const copy = getAppCopy(language);
    for (const key of ['artisanProducts', 'recommendedProducts', 'myEnquiries', 'buyerEnquiries', 'myOrders', 'profile', 'sendEnquiry', 'bulkRequest', 'materialFilter', 'artisanFilter', 'availabilityFilter', 'minPrice', 'maxPrice', 'businessName', 'businessType', 'contactInfo', 'interests', 'wholesale', 'recentEnquiries', 'buyers', 'markCancelled']) {
      assert.equal(typeof copy[key], 'string', `${language}.${key} must be text`);
      assert.ok(copy[key].trim(), `${language}.${key} must not be empty`);
    }
  }
});
