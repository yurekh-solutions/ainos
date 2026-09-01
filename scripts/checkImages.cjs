const urls = [
  'https://images.pexels.com/photos/3762875/pexels-photo-3762875.jpeg',
  'https://images.pexels.com/photos/4041391/pexels-photo-4041391.jpeg',
  'https://images.pexels.com/photos/3762871/pexels-photo-3762871.jpeg',
  'https://images.pexels.com/photos/1502219/pexels-photo-1502219.jpeg',
];
(async () => {
  for (const u of urls) {
    try {
      const r = await fetch(u, { method: 'HEAD' });
      const len = r.headers.get('content-length') || '?';
      console.log(`${r.status} ${len}b ${u}`);
    } catch (e) {
      console.log(`FAIL ${u} (${e.message})`);
    }
  }
})();
