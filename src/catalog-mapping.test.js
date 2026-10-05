import test from 'node:test';
import assert from 'node:assert/strict';
import { mapCatalogResult, mergeCatalogDraft } from './catalog-mapping.js';

const response = overrides => ({
  productName: 'Woven basket', productNameHindi: 'बुनी हुई टोकरी', category: 'Home Decor',
  descriptionEnglish: 'A sturdy woven basket.', descriptionHindi: 'एक मजबूत बुनी हुई टोकरी।',
  featuresEnglish: ['Handwoven'], featuresHindi: ['हाथ से बुनी हुई'], material: 'Bamboo', color: 'Natural',
  size: '', makingMethod: '', productionTime: '', style: '', suggestedUses: 'Storage', craftInformation: '', keywords: ['Basket'],
  ...overrides,
});

test('catalog response maps into every catalog field and sanitizes optional lists', () => {
  const mapped = mapCatalogResult(response({ featuresEnglish: ['Handwoven', 1, ''], keywords: ['Basket', null] }));
  assert.equal(mapped.name, 'Woven basket');
  assert.equal(mapped.description_hi, 'एक मजबूत बुनी हुई टोकरी।');
  assert.deepEqual(mapped.features_en, ['Handwoven']);
  assert.deepEqual(mapped.keywords, ['Basket']);
  assert.equal(mapped.material, 'Bamboo');
});

test('initial catalog fill preserves artisan-entered fields while filling blanks', () => {
  const draft = { name: 'My basket', category: 'Home Decor', material: '', description_en: '', description_hi: '', features_en: [], features_hi: [] };
  const merged = mergeCatalogDraft(draft, mapCatalogResult(response()));
  assert.equal(merged.name, 'My basket');
  assert.equal(merged.material, 'Bamboo');
  assert.equal(merged.description_en, 'A sturdy woven basket.');
  assert.deepEqual(merged.features_hi, ['हाथ से बुनी हुई']);
});

test('explicit catalog regeneration replaces prior generated and edited bilingual copy', () => {
  const oldGenerated = mapCatalogResult(response());
  const draft = { description_en: 'Edited English copy', description_hi: 'संपादित हिंदी', features_en: ['Edited'], features_hi: ['बदला हुआ'] };
  const fresh = mapCatalogResult(response({ descriptionEnglish: 'Fresh copy.', descriptionHindi: 'नया विवरण।', featuresEnglish: ['New feature'], featuresHindi: ['नई विशेषता'] }));
  const merged = mergeCatalogDraft(draft, fresh, oldGenerated, true);
  assert.equal(merged.description_en, 'Fresh copy.');
  assert.equal(merged.description_hi, 'नया विवरण।');
  assert.deepEqual(merged.features_en, ['New feature']);
  assert.deepEqual(merged.features_hi, ['नई विशेषता']);
});

test('incomplete AI response cannot masquerade as a generated catalog', () => {
  assert.throws(() => mapCatalogResult(response({ descriptionHindi: '' })), /incomplete product catalog/);
});
