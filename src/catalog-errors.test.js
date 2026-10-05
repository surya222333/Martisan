import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogErrorMessage } from './catalog-errors.js';

const copy = {
  aiLimitReached: 'AI account limit',
  aiUnavailable: 'Local AI service unavailable',
  analysisFailed: 'Analysis did not finish',
};

test('catalog credit balance errors explain the account-side blocker', () => {
  assert.equal(catalogErrorMessage('The OpenAI API credit balance is exhausted. Add API credits, then retry.', copy), copy.aiLimitReached);
});

test('catalog usage and provider quota errors are categorized as limits', () => {
  assert.equal(catalogErrorMessage('OpenAI API request failed (HTTP 429).', copy), copy.aiLimitReached);
  assert.equal(catalogErrorMessage('insufficient_quota', copy), copy.aiLimitReached);
});

test('local backend outages explain how to recover', () => {
  assert.equal(catalogErrorMessage('Martisan AI service is not reachable.', copy), copy.aiUnavailable);
});

test('unknown sanitized API details remain visible', () => {
  assert.equal(catalogErrorMessage('AI returned an invalid catalog', copy), 'AI returned an invalid catalog');
  assert.equal(catalogErrorMessage('', copy), copy.analysisFailed);
});
