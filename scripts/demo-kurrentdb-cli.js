#!/usr/bin/env node

/**
 * CLI Demo Event Sourcing với KurrentDB (User Use Case)
 * - Tạo user, update user, xóa user
 * - Xem event log
 * - Replay event để tái tạo trạng thái
 * - Xem trạng thái hiện tại
 */

// Load environment variables
require('dotenv').config();

const readline = require('readline');
const EventBus = require('../services/shared/eventBus/eventBus');

// In-memory event store
const eventStore = [];

// User state (rebuild from events)
let userState = null;

// Event bus instance
let eventBus = null;

// Initialize EventBus connection
async function initEventBus() {
  try {
    console.log('🔧 Redis config:', {
      url: process.env.REDIS_URL,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
    });
    
    eventBus = new EventBus({
      serviceName: 'demo-cli'
    });
    
    // Wait for connection
    await new Promise((resolve, reject) => {
      if (eventBus.isConnected) {
        resolve();
        return;
      }
      
      eventBus.on('connected', resolve);
      eventBus.on('error', reject);
      
      // Timeout after 10 seconds
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });
    
    // Subscribe to all auth events
    await eventBus.subscribe('auth:*', (event) => {
      console.log(`\n🔥 Event nhận được: ${event.type}`, event.data);
      // Add to local store for demo purposes
      eventStore.push({
        id: event.id,
        type: event.type,
        data: event.data,
        timestamp: event.timestamp,
        source: event.source
      });
    });
    
    console.log('✅ Demo CLI đã kết nối với EventBus');
  } catch (error) {
    console.error('❌ Lỗi kết nối EventBus:', error.message);
  }
}

function printMenu() {
  console.log('\n========= DEMO EVENT SOURCING CLI =========');
  console.log('1. Tạo user mới');
  console.log('2. Update user');
  console.log('3. Xóa user');
  console.log('4. Xem event log');
  console.log('5. Replay event (tái tạo trạng thái)');
  console.log('6. Xem trạng thái hiện tại');
  console.log('7. Load events từ Event Store');
  console.log('8. Xem auth events');
  console.log('0. Thoát');
  console.log('===========================================\n');
}

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer));
  });
}

function appendEvent(type, data) {
  const event = {
    id: eventStore.length + 1,
    type,
    data,
    timestamp: new Date().toISOString(),
  };
  eventStore.push(event);
  console.log(`\n✅ Đã ghi event: ${type}`);
}

function replayEvents() {
  userState = null;
  for (const event of eventStore) {
    switch (event.type) {
      case 'UserCreated':
        userState = { ...event.data };
        break;
      case 'UserUpdated':
        if (userState) Object.assign(userState, event.data);
        break;
      case 'UserDeleted':
        userState = null;
        break;
    }
  }
}

function printUserState() {
  if (!userState) {
    console.log('\n⚠️  Không có user nào trong trạng thái hiện tại.');
  } else {
    console.log('\n👤 Trạng thái user hiện tại:');
    console.log(JSON.stringify(userState, null, 2));
  }
}

function printEventLog() {
  if (eventStore.length === 0) {
    console.log('\n⚠️  Chưa có event nào trong local store.');
    
    // Try to fetch from EventBus Event Store
    if (eventBus && eventBus.isConnected) {
      console.log('\n🔍 Đang kiểm tra Event Store...');
      eventBus.getAllEvents().then(events => {
        if (events && events.length > 0) {
          console.log('\n📜 Events từ Event Store:');
          events.forEach((e, i) => {
            console.log(`${i + 1}. [${e.type}] ${JSON.stringify(e.data)} @ ${e.timestamp} (Source: ${e.source})`);
          });
        } else {
          console.log('⚠️  Không có event nào trong Event Store.');
        }
      }).catch(error => {
        console.error('❌ Lỗi khi đọc Event Store:', error.message);
      });
    }
    return;
  }
  
  console.log('\n📜 Event Log (Local + Real-time):');
  eventStore.forEach((e, i) => {
    const source = e.source ? ` (Source: ${e.source})` : '';
    console.log(`${i + 1}. [${e.type}] ${JSON.stringify(e.data)} @ ${e.timestamp}${source}`);
  });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  console.log('🚀 Khởi động Demo Event Sourcing CLI...');
  
  // Initialize EventBus connection
  await initEventBus();
  
  while (true) {
    printMenu();
    const choice = await ask('Chọn thao tác: ');
    switch (choice.trim()) {
      case '1': {
        const id = await ask('Nhập userId: ');
        const name = await ask('Nhập tên: ');
        const email = await ask('Nhập email: ');
        appendEvent('UserCreated', { id, name, email });
        break;
      }
      case '2': {
        if (!userState) {
          console.log('⚠️  Chưa có user để update.');
          break;
        }
        const name = await ask('Nhập tên mới (bỏ qua nếu không đổi): ');
        const email = await ask('Nhập email mới (bỏ qua nếu không đổi): ');
        const update = {};
        if (name) update.name = name;
        if (email) update.email = email;
        if (Object.keys(update).length === 0) {
          console.log('⚠️  Không có thay đổi.');
        } else {
          appendEvent('UserUpdated', update);
        }
        break;
      }
      case '3': {
        if (!userState) {
          console.log('⚠️  Không có user để xóa.');
          break;
        }
        appendEvent('UserDeleted', { id: userState.id });
        break;
      }
      case '4':
        printEventLog();
        break;
      case '5':
        replayEvents();
        console.log('\n🔄 Đã replay toàn bộ event.');
        break;
      case '6':
        replayEvents();
        printUserState();
        break;
      case '7': {
        console.log('\n🔍 Loading events từ Event Store...');
        try {
          const events = await eventBus.getAllEvents();
          if (events && events.length > 0) {
            console.log(`\n📜 Tìm thấy ${events.length} events trong Event Store:`);
            events.forEach((e, i) => {
              console.log(`${i + 1}. [${e.type}] ${JSON.stringify(e.data)} @ ${e.timestamp} (Source: ${e.source})`);
            });
          } else {
            console.log('⚠️  Không có event nào trong Event Store.');
          }
        } catch (error) {
          console.error('❌ Lỗi khi load events:', error.message);
        }
        break;
      }
      case '8': {
        console.log('\n🔍 Loading auth events từ Event Store...');
        try {
          const authEvents = await eventBus.getEventsByType('auth:login') || [];
          const logoutEvents = await eventBus.getEventsByType('auth:logout') || [];
          const allAuthEvents = [...authEvents, ...logoutEvents].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          
          if (allAuthEvents.length > 0) {
            console.log(`\n🔐 Tìm thấy ${allAuthEvents.length} auth events:`);
            allAuthEvents.forEach((e, i) => {
              console.log(`${i + 1}. [${e.type}] User: ${e.data.email} @ ${e.timestamp} (Source: ${e.source})`);
            });
          } else {
            console.log('⚠️  Không có auth event nào.');
          }
        } catch (error) {
          console.error('❌ Lỗi khi load auth events:', error.message);
        }
        break;
      }
      case '0':
        rl.close();
        if (eventBus) {
          await eventBus.disconnect();
        }
        console.log('👋 Kết thúc demo.');
        return;
      default:
        console.log('⚠️  Lựa chọn không hợp lệ.');
    }
  }
}

main(); 