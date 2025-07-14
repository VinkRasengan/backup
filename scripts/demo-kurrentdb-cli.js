#!/usr/bin/env node

/**
 * CLI Demo Event Sourcing với KurrentDB (User Use Case)
 * - Tạo user, update user, xóa user
 * - Xem event log
 * - Replay event để tái tạo trạng thái
 * - Xem trạng thái hiện tại
 */

const readline = require('readline');

// In-memory event store
const eventStore = [];

// User state (rebuild from events)
let userState = null;

function printMenu() {
  console.log('\n========= DEMO EVENT SOURCING CLI =========');
  console.log('1. Tạo user mới');
  console.log('2. Update user');
  console.log('3. Xóa user');
  console.log('4. Xem event log');
  console.log('5. Replay event (tái tạo trạng thái)');
  console.log('6. Xem trạng thái hiện tại');
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
    console.log('\n⚠️  Chưa có event nào.');
    return;
  }
  console.log('\n📜 Event Log:');
  eventStore.forEach((e, i) => {
    console.log(`${i + 1}. [${e.type}] ${JSON.stringify(e.data)} @ ${e.timestamp}`);
  });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
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
      case '0':
        rl.close();
        console.log('👋 Kết thúc demo.');
        return;
      default:
        console.log('⚠️  Lựa chọn không hợp lệ.');
    }
  }
}

main(); 