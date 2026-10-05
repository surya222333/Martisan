import test from 'node:test';
import assert from 'node:assert/strict';
import { enhancePhotoPixels, enhancePhotoWithFallback } from './local-photo-enhancement.js';

function image(width, height, color) {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < pixels.length; i += 4) pixels.set([...color, 255], i);
  return pixels;
}

test('offline photo enhancement whitens a uniform connected background and preserves original pixels', () => {
  const width = 9, height = 9;
  const original = image(width, height, [220, 220, 220]);
  for (let y = 3; y < 6; y++) for (let x = 3; x < 6; x++) original.set([160, 60, 35, 255], (y * width + x) * 4);
  const source = original.slice();

  const result = enhancePhotoPixels(original, width, height);

  assert.equal(result.backgroundRemoved, true);
  assert.deepEqual(Array.from(result.pixels.slice(0, 3)), [255, 255, 255]);
  assert.deepEqual(Array.from(result.pixels.slice((4 * width + 4) * 4, (4 * width + 4) * 4 + 3)), [164, 61, 35]);
  assert.deepEqual(original, source);
  assert.equal(result.pixels.length, width * height * 4);
});

test('offline photo enhancement keeps a busy background instead of masking uncertain pixels', () => {
  const original = image(8, 8, [190, 175, 160]);
  for (let x = 0; x < 8; x++) original.set([40, 120, 200, 255], x * 4);

  const result = enhancePhotoPixels(original, 8, 8);

  assert.equal(result.backgroundRemoved, false);
  assert.notDeepEqual(result.pixels, original);
  assert.deepEqual(Array.from(result.pixels.slice(0, 3)), [40, 123, 206]);
});

test('demo image enhancement falls back locally when the service is unavailable', async () => {
  const file = { name: 'demo-product.png' };
  let localCalls = 0;
  const result = await enhancePhotoWithFallback(file,
    async () => { throw new Error('service unavailable'); },
    async input => { localCalls++; return { photo: 'data:image/webp;base64,demo', provider: 'browser-local-photo-enhancement', backgroundRemoved: false, input }; },
  );

  assert.equal(localCalls, 1);
  assert.equal(result.provider, 'browser-local-photo-enhancement');
  assert.equal(result.input, file);
  assert.equal(result.fallbackReason, 'service unavailable');
});

test('demo image enhancement leaves a successful service result unchanged', async () => {
  const serviceResult = { photo: 'data:image/webp;base64,service', provider: 'local-segmentation-original-pixels' };
  let localCalls = 0;
  const result = await enhancePhotoWithFallback({}, async () => serviceResult, async () => { localCalls++; });

  assert.equal(result, serviceResult);
  assert.equal(localCalls, 0);
});
