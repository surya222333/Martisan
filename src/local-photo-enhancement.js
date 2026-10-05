const clamp = value => Math.max(0, Math.min(255, Math.round(value)));

/**
 * Improve exposure gently and replace only a confidently uniform background
 * connected to the photo edges. The caller keeps the untouched source image.
 */
export function enhancePhotoPixels(sourcePixels, width, height) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || sourcePixels.length !== width * height * 4) {
    throw new Error('Invalid photo pixel data');
  }

  const pixels = new Uint8ClampedArray(sourcePixels);
  const stride = Math.max(1, Math.floor((width + height) / 240));
  const samples = [];
  for (let x = 0; x < width; x += stride) {
    samples.push((x * 4), (((height - 1) * width + x) * 4));
  }
  for (let y = stride; y < height - 1; y += stride) {
    samples.push((y * width) * 4, (y * width + width - 1) * 4);
  }

  let red = 0, green = 0, blue = 0;
  for (const offset of samples) {
    red += pixels[offset]; green += pixels[offset + 1]; blue += pixels[offset + 2];
  }
  const count = Math.max(samples.length, 1);
  const background = [red / count, green / count, blue / count];
  let edgeVariation = 0;
  for (const offset of samples) {
    const dr = pixels[offset] - background[0], dg = pixels[offset + 1] - background[1], db = pixels[offset + 2] - background[2];
    edgeVariation += Math.sqrt(dr * dr + dg * dg + db * db);
  }
  edgeVariation /= count;

  const total = width * height;
  const mask = new Uint8Array(total);
  let backgroundRemoved = false;
  // Busy or uneven edges are not safe to segment. Leave them intact and only
  // apply the small exposure correction below.
  if (edgeVariation < 34 && total > 4) {
    const threshold = Math.max(24, Math.min(48, 18 + edgeVariation * 1.5));
    const queue = new Int32Array(total);
    let head = 0, tail = 0;
    const addIfBackground = index => {
      if (index < 0 || index >= total || mask[index]) return;
      const offset = index * 4;
      const dr = pixels[offset] - background[0], dg = pixels[offset + 1] - background[1], db = pixels[offset + 2] - background[2];
      if (Math.sqrt(dr * dr + dg * dg + db * db) > threshold) return;
      mask[index] = 1;
      queue[tail++] = index;
    };
    for (let x = 0; x < width; x++) { addIfBackground(x); addIfBackground((height - 1) * width + x); }
    for (let y = 1; y < height - 1; y++) { addIfBackground(y * width); addIfBackground(y * width + width - 1); }
    while (head < tail) {
      const index = queue[head++], x = index % width;
      if (x > 0) addIfBackground(index - 1);
      if (x + 1 < width) addIfBackground(index + 1);
      if (index >= width) addIfBackground(index - width);
      if (index + width < total) addIfBackground(index + width);
    }
    const ratio = tail / total;
    if (ratio >= 0.03 && ratio <= 0.92) backgroundRemoved = true;
    else mask.fill(0);
  }

  for (let index = 0; index < total; index++) {
    const offset = index * 4;
    if (mask[index]) {
      pixels[offset] = 255; pixels[offset + 1] = 255; pixels[offset + 2] = 255;
      continue;
    }
    pixels[offset] = clamp((pixels[offset] - 128) * 1.035 + 131);
    pixels[offset + 1] = clamp((pixels[offset + 1] - 128) * 1.035 + 131);
    pixels[offset + 2] = clamp((pixels[offset + 2] - 128) * 1.035 + 131);
  }

  return { pixels, backgroundRemoved };
}

const offlineMessages = {
  'en-IN': ['Offline photo cleanup is ready. Compare it with the original before choosing.', 'Lighting was improved offline. The background was kept because it could not be separated safely.'],
  'ta-IN': ['இணையமின்றி படப் பின்னணி சீரமைக்கப்பட்டது. தேர்வு செய்வதற்கு முன் அசலுடன் ஒப்பிடவும்.', 'இணையமின்றி வெளிச்சம் மேம்படுத்தப்பட்டது. பாதுகாப்பாகப் பிரிக்க முடியாததால் பின்னணி மாற்றப்படவில்லை.'],
  'hi-IN': ['ऑफ़लाइन फ़ोटो सफ़ाई तैयार है। चुनने से पहले मूल फ़ोटो से तुलना करें।', 'ऑफ़लाइन रोशनी बेहतर की गई। पृष्ठभूमि सुरक्षित रूप से अलग न हो पाने के कारण वैसी ही रखी गई।'],
  'ml-IN': ['ഓഫ്‌ലൈനായി ചിത്രത്തിന്റെ പശ്ചാത്തലം ക്രമീകരിച്ചു. തിരഞ്ഞെടുക്കുന്നതിന് മുമ്പ് യഥാർത്ഥ ചിത്രവുമായി താരതമ്യം ചെയ്യുക.', 'ഓഫ്‌ലൈനായി പ്രകാശം മെച്ചപ്പെടുത്തി. സുരക്ഷിതമായി വേർതിരിക്കാനാകാത്തതിനാൽ പശ്ചാത്തലം അതേപടി നിലനിർത്തി.'],
};

export function enhancePhotoInBrowser(file, language = 'en-IN') {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        const scale = Math.min(1, 2048 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('This browser cannot enhance the photo locally.');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const result = enhancePhotoPixels(imageData.data, canvas.width, canvas.height);
        imageData.data.set(result.pixels);
        context.putImageData(imageData, 0, 0);
        const messages = offlineMessages[language] || offlineMessages['en-IN'];
        resolve({ photo: canvas.toDataURL('image/webp', 0.96), provider: 'browser-local-photo-enhancement', backgroundRemoved: result.backgroundRemoved, message: messages[result.backgroundRemoved ? 0 : 1] });
      } catch (error) { reject(error); }
      finally { URL.revokeObjectURL(url); }
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read this photo for local enhancement.')); };
    image.src = url;
  });
}

export async function enhancePhotoWithFallback(file, remoteEnhancer, localEnhancer = enhancePhotoInBrowser) {
  try {
    return await remoteEnhancer(file);
  } catch (error) {
    const localResult = await localEnhancer(file);
    return { ...localResult, fallbackReason: error?.message || 'The photo service is unavailable.' };
  }
}
