// Test Caption Generation API
const API_URL = 'https://ainos-ywu0.onrender.com/api/social-caption';

async function testCaptionGeneration() {
  console.log('=== Testing Caption Generation ===\n');

  // Test 1: Text-only caption (fastest)
  console.log(' Test 1: Text-only caption generation...');
  const startTime1 = Date.now();
  try {
    const res1 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'AI technology trends 2026',
        tone: 'Professional',
        language: 'english',
        platforms: ['instagram', 'linkedin'],
      }),
    });

    const time1 = Date.now() - startTime1;
    if (res1.ok) {
      const data1 = await res1.json();
      console.log(`✅ Text-only: ${time1}ms (${(time1 / 1000).toFixed(1)}s)`);
      console.log(`   Platforms: ${data1.platforms?.length || 0}`);
      console.log(`   Sample caption: ${data1.platforms?.[0]?.caption?.substring(0, 80)}...`);
    } else {
      const err = await res1.text();
      console.log(`❌ Text-only failed: ${res1.status} - ${err.substring(0, 100)}`);
    }
  } catch (e) {
    console.log(`❌ Text-only error: ${e.message}`);
  }

  // Test 2: Simulated image caption (using a tiny base64 image)
  console.log('\n🖼️  Test 2: Image caption generation...');
  const startTime2 = Date.now();
  try {
    // Tiny 1x1 pixel JPEG as base64 (for testing)
    const tinyImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';
    
    const res2 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Fashion photography',
        imageBase64: tinyImage,
        tone: 'Engaging',
        language: 'english',
        platforms: ['instagram'],
      }),
    });

    const time2 = Date.now() - startTime2;
    if (res2.ok) {
      const data2 = await res2.json();
      console.log(`✅ Image caption: ${time2}ms (${(time2 / 1000).toFixed(1)}s)`);
      console.log(`   Vision analysis: ${data2.imageAnalysis || 'N/A'}`);
      console.log(`   Caption: ${data2.platforms?.[0]?.caption?.substring(0, 80)}...`);
    } else {
      const err = await res2.text();
      console.log(`❌ Image caption failed: ${res2.status} - ${err.substring(0, 100)}`);
    }
  } catch (e) {
    console.log(`❌ Image caption error: ${e.message}`);
  }

  // Test 3: Simulated video caption (multiple frames)
  console.log('\n🎬 Test 3: Video caption generation (3 frames)...');
  const startTime3 = Date.now();
  try {
    const tinyImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';
    
    const res3 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Cooking tutorial',
        imageBase64: [tinyImage, tinyImage, tinyImage], // 3 frames
        tone: 'Casual',
        language: 'english',
        platforms: ['tiktok', 'youtube'],
      }),
    });

    const time3 = Date.now() - startTime3;
    if (res3.ok) {
      const data3 = await res3.json();
      console.log(`✅ Video caption: ${time3}ms (${(time3 / 1000).toFixed(1)}s)`);
      console.log(`   Vision analysis: ${data3.imageAnalysis || 'N/A'}`);
      console.log(`   Platforms: ${data3.platforms?.length || 0}`);
    } else {
      const err = await res3.text();
      console.log(`❌ Video caption failed: ${res3.status} - ${err.substring(0, 100)}`);
    }
  } catch (e) {
    console.log(` Video caption error: ${e.message}`);
  }

  console.log('\n=== Test Complete ===');
  console.log('✅ = Working |  = Failed');
  console.log('\nNote: Using tiny test image. Real images/videos will give better captions.');
}

testCaptionGeneration().catch(console.error);
