// Simple delay script for Windows compatibility
const delay = process.argv[2] || 20;
console.log(`⏳ Waiting ${delay} seconds for services to start...`);

setTimeout(() => {
  console.log('✅ Starting client...');
  process.exit(0);
}, delay * 1000);
