import sharp from 'sharp';
import fs from 'fs';

class ImageProcessor {
  static async generateImageHash(imageBuffer) {
    try {
      const resized = await sharp(imageBuffer)
        .resize(8, 8)
        .grayscale()
        .raw()
        .toBuffer();
      
      const pixels = new Uint8Array(resized);
      const avg = pixels.reduce((a, b) => a + b, 0) / pixels.length;
      
      let hash = '';
      for (let i = 0; i < pixels.length; i++) {
        hash += pixels[i] > avg ? '1' : '0';
      }
      
      return hash;
    } catch (error) {
      console.error('Error generating image hash:', error);
      return null;
    }
  }

  static async extractImageFeatures(imageBuffer) {
    try {
      const { data, info } = await sharp(imageBuffer)
        .resize(64, 64)
        .raw()
        .toBuffer({ resolveWithObject: true });

      const features = [];
      const pixels = new Uint8Array(data);
      
      for (let i = 0; i < pixels.length; i += 3) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        features.push((r + g + b) / 3);
      }

      return features.slice(0, 100);
    } catch (error) {
      console.error('Error extracting image features:', error);
      return [];
    }
  }

static calculateSimilarity(features1, features2) {
    if (!features1?.length || !features2?.length || features1.length !== features2.length) {
      return 0;
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < features1.length; i++) {
      dotProduct += features1[i] * features2[i];
      magnitude1 += features1[i] * features1[i];
      magnitude2 += features2[i] * features2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    const similarity = magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;
    
    // Apply threshold - only return similarity if it's above a minimum
    return similarity > 0.6 ? similarity : 0; // 0.6 = 60% similarity threshold
  }

 // Compare two image hashes with threshold (Hamming distance)
  static compareHashes(hash1, hash2) {
    if (!hash1 || !hash2 || hash1.length !== hash2.length) {
      return 1; // Maximum distance
    }

    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) {
        distance++;
      }
    }

    const normalizedDistance = distance / hash1.length;
    
    // Only consider it a match if distance is small (images are similar)
    return normalizedDistance < 0.25 ? normalizedDistance : 1; // 25% maximum difference
  }

  // New method to check if images are actually similar
  static areImagesSimilar(features1, features2, hash1, hash2, threshold = 0.7) {
    const featureSimilarity = this.calculateSimilarity(features1, features2);
    const hashSimilarity = 1 - this.compareHashes(hash1, hash2);
    
    const combinedScore = (featureSimilarity * 0.6) + (hashSimilarity * 0.4);
    return combinedScore >= threshold;
  }


}

export default ImageProcessor;
