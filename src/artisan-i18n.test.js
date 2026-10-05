import test from 'node:test';
import assert from 'node:assert/strict';
import { getArtisanCopy } from './artisan-i18n.js';

test('artisan language packs expose complete page copy', () => {
  const languages = ['en-IN', 'ta-IN', 'hi-IN', 'ml-IN'];
  const referenceKeys = Object.keys(getArtisanCopy(languages[0])).sort();
  for (const language of languages) {
    const copy = getArtisanCopy(language);
    assert.deepEqual(Object.keys(copy).sort(), referenceKeys, `${language} has a different set of UI keys`);
    for (const [key, value] of Object.entries(copy)) {
      assert.equal(typeof value, 'string', `${language}.${key} must be text`);
      assert.ok(value.trim(), `${language}.${key} must not be empty`);
    }
  }
});

test('unknown artisan language safely falls back to English', () => {
  assert.equal(getArtisanCopy('xx-XX').addTitle, getArtisanCopy('en-IN').addTitle);
});
