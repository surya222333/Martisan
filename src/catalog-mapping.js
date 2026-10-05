const categories = new Set(['Pottery', 'Textiles', 'Home Decor', 'Woodwork', 'Jewellery', 'Other']);

export function mapCatalogResult(result) {
  if (!result || typeof result !== 'object'
    || !String(result.productName || '').trim()
    || !String(result.productNameHindi || '').trim()
    || !String(result.descriptionEnglish || '').trim()
    || !String(result.descriptionHindi || '').trim()) {
    throw new Error('The AI returned an incomplete product catalog. Please try again.');
  }
  const strings = value => Array.isArray(value) ? value.filter(item => typeof item === 'string' && item.trim()) : [];
  return {
    name: result.productName.trim(),
    product_name_hi: String(result.productNameHindi || '').trim(),
    category: categories.has(result.category) ? result.category : 'Other',
    description_en: result.descriptionEnglish.trim(),
    description_hi: result.descriptionHindi.trim(),
    features_en: strings(result.featuresEnglish),
    features_hi: strings(result.featuresHindi),
    material: String(result.material || '').trim(),
    color: String(result.color || '').trim(),
    size: String(result.size || '').trim(),
    making_method: String(result.makingMethod || '').trim(),
    production_time: String(result.productionTime || '').trim(),
    style: String(result.style || '').trim(),
    suggested_uses: String(result.suggestedUses || '').trim(),
    craft_information: String(result.craftInformation || '').trim(),
    keywords: strings(result.keywords),
    visual_analysis: result.visualAnalysis && typeof result.visualAnalysis === 'object' ? result.visualAnalysis : null,
  };
}

export function mergeCatalogDraft(draft, next, previousGenerated = {}, replaceDescriptions = false) {
  const canFill = (field, current) => !String(current || '').trim()
    || current === previousGenerated[field]
    || (field === 'category' && current === 'Pottery' && !previousGenerated.category);
  const canFillList = (field, current, force = false) => force
    || !current?.length
    || JSON.stringify(current) === JSON.stringify(previousGenerated[field] || []);
  return {
    ...draft,
    name: canFill('name', draft.name) ? (next.name || draft.name) : draft.name,
    product_name_hi: canFill('product_name_hi', draft.product_name_hi) ? (next.product_name_hi || draft.product_name_hi) : draft.product_name_hi,
    category: canFill('category', draft.category) ? next.category : draft.category,
    description_en: replaceDescriptions || canFill('description_en', draft.description_en) ? (next.description_en || draft.description_en) : draft.description_en,
    description_hi: replaceDescriptions || canFill('description_hi', draft.description_hi) ? (next.description_hi || draft.description_hi) : draft.description_hi,
    features_en: canFillList('features_en', draft.features_en, replaceDescriptions) ? next.features_en : draft.features_en,
    features_hi: canFillList('features_hi', draft.features_hi, replaceDescriptions) ? next.features_hi : draft.features_hi,
    material: canFill('material', draft.material) ? (next.material || draft.material) : draft.material,
    color: canFill('color', draft.color) ? (next.color || draft.color) : draft.color,
    size: canFill('size', draft.size) ? (next.size || draft.size) : draft.size,
    making_method: canFill('making_method', draft.making_method) ? (next.making_method || draft.making_method) : draft.making_method,
    production_time: canFill('production_time', draft.production_time) ? (next.production_time || draft.production_time) : draft.production_time,
    style: canFill('style', draft.style) ? (next.style || draft.style) : draft.style,
    suggested_uses: canFill('suggested_uses', draft.suggested_uses) ? (next.suggested_uses || draft.suggested_uses) : draft.suggested_uses,
    craft_information: canFill('craft_information', draft.craft_information) ? (next.craft_information || draft.craft_information) : draft.craft_information,
    keywords: canFillList('keywords', draft.keywords) ? next.keywords : draft.keywords,
    visual_analysis: next.visual_analysis || draft.visual_analysis || null,
  };
}
