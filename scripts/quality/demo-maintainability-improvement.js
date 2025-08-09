import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class MaintainabilityDemo {
  constructor() {
    this.demoDir = path.join(process.cwd(), 'demo-maintainability');
  }

  /**
   * Chạy demo maintainability
   */
  async runDemo() {
    console.log('🎯 DEMO: Cải Thiện Maintainability Với ESLint\n');
    
    try {
      // Tạo thư mục demo
      this.createDemoDirectory();
      
      // Tạo các file demo
      this.createBadCodeExample();
      this.createGoodCodeExample();
      this.createESLintConfig();
      
      // Chạy ESLint trên code xấu
      this.runESLintOnBadCode();
      
      // Hiển thị so sánh
      this.showComparison();
      
      // Cleanup
      this.cleanup();
      
    } catch (error) {
      console.error('❌ Lỗi trong demo:', error.message);
    }
  }

  /**
   * Tạo thư mục demo
   */
  createDemoDirectory() {
    if (!fs.existsSync(this.demoDir)) {
      fs.mkdirSync(this.demoDir);
    }
    console.log('📁 Đã tạo thư mục demo');
  }

  /**
   * Tạo ví dụ code xấu
   */
  createBadCodeExample() {
    const badCode = `// ❌ CODE KHÓ BẢO TRÌ - Ví dụ về function phức tạp
function processUserData(userData) {
  var result = [];
  for (var i = 0; i < userData.length; i++) {
    var user = userData[i];
    if (user.active) {
      var processedUser = {};
      processedUser.name = user.firstName + ' ' + user.lastName;
      processedUser.email = user.email;
      processedUser.age = 2024 - user.birthYear;
      if (user.age > 18) {
        processedUser.canVote = true;
      } else {
        processedUser.canVote = false;
      }
      if (user.email && user.email.includes('@')) {
        processedUser.validEmail = true;
      } else {
        processedUser.validEmail = false;
      }
      if (user.phone && user.phone.length >= 10) {
        processedUser.validPhone = true;
      } else {
        processedUser.validPhone = false;
      }
      result.push(processedUser);
    }
  }
  return result;
}

// ❌ CODE KHÓ BẢO TRÌ - Ví dụ về nested conditions
function validateUser(user) {
  if (user) {
    if (user.name) {
      if (user.name.first) {
        if (user.name.first.length > 0) {
          if (user.email) {
            if (user.email.includes('@')) {
              if (user.age) {
                if (user.age > 0) {
                  if (user.age < 150) {
                    return true;
                  } else {
                    return false;
                  }
                } else {
                  return false;
                }
              } else {
                return false;
              }
            } else {
              return false;
            }
          } else {
            return false;
          }
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else {
      return false;
    }
  } else {
    return false;
  }
}

// ❌ CODE KHÓ BẢO TRÌ - Ví dụ về function dài
function calculateUserStatistics(userData) {
  var totalUsers = 0;
  var activeUsers = 0;
  var inactiveUsers = 0;
  var usersWithEmail = 0;
  var usersWithoutEmail = 0;
  var usersWithPhone = 0;
  var usersWithoutPhone = 0;
  var usersOver18 = 0;
  var usersUnder18 = 0;
  var averageAge = 0;
  var totalAge = 0;
  var validEmails = 0;
  var invalidEmails = 0;
  var validPhones = 0;
  var invalidPhones = 0;
  
  for (var i = 0; i < userData.length; i++) {
    var user = userData[i];
    totalUsers++;
    
    if (user.active) {
      activeUsers++;
    } else {
      inactiveUsers++;
    }
    
    if (user.email) {
      usersWithEmail++;
      if (user.email.includes('@') && user.email.includes('.')) {
        validEmails++;
      } else {
        invalidEmails++;
      }
    } else {
      usersWithoutEmail++;
    }
    
    if (user.phone) {
      usersWithPhone++;
      if (user.phone.length >= 10 && user.phone.length <= 15) {
        validPhones++;
      } else {
        invalidPhones++;
      }
    } else {
      usersWithoutPhone++;
    }
    
    if (user.age) {
      totalAge += user.age;
      if (user.age >= 18) {
        usersOver18++;
      } else {
        usersUnder18++;
      }
    }
  }
  
  if (totalUsers > 0) {
    averageAge = totalAge / totalUsers;
  }
  
  return {
    totalUsers: totalUsers,
    activeUsers: activeUsers,
    inactiveUsers: inactiveUsers,
    usersWithEmail: usersWithEmail,
    usersWithoutEmail: usersWithoutEmail,
    usersWithPhone: usersWithPhone,
    usersWithoutPhone: usersWithoutPhone,
    usersOver18: usersOver18,
    usersUnder18: usersUnder18,
    averageAge: averageAge,
    validEmails: validEmails,
    invalidEmails: invalidEmails,
    validPhones: validPhones,
    invalidPhones: invalidPhones
  };
}`;

    fs.writeFileSync(path.join(this.demoDir, 'bad-code.js'), badCode);
    console.log('📝 Đã tạo file bad-code.js (code khó bảo trì)');
  }

  /**
   * Tạo ví dụ code tốt
   */
  createGoodCodeExample() {
    const goodCode = `// ✅ CODE DỄ BẢO TRÌ - Tách thành các function nhỏ
const processUserData = (userData) => {
  return userData
    .filter(isActiveUser)
    .map(transformUserData);
};

const isActiveUser = (user) => user.active;

const transformUserData = (user) => ({
  name: \`\${user.firstName} \${user.lastName}\`,
  email: user.email,
  age: calculateAge(user.birthYear),
  canVote: calculateAge(user.birthYear) > 18,
  validEmail: isValidEmail(user.email),
  validPhone: isValidPhone(user.phone)
});

const calculateAge = (birthYear) => 2024 - birthYear;

const isValidEmail = (email) => email && email.includes('@');

const isValidPhone = (phone) => phone && phone.length >= 10;

// ✅ CODE DỄ BẢO TRÌ - Sử dụng early returns
const validateUser = (user) => {
  if (!user) return false;
  if (!user.name?.first?.length) return false;
  if (!isValidEmail(user.email)) return false;
  if (!user.age || user.age <= 0 || user.age >= 150) return false;
  
  return true;
};

// ✅ CODE DỄ BẢO TRÌ - Tách logic thành các function nhỏ
const calculateUserStatistics = (userData) => {
  const stats = {
    totalUsers: userData.length,
    activeUsers: countActiveUsers(userData),
    inactiveUsers: countInactiveUsers(userData),
    emailStats: calculateEmailStats(userData),
    phoneStats: calculatePhoneStats(userData),
    ageStats: calculateAgeStats(userData)
  };
  
  return {
    ...stats,
    averageAge: calculateAverageAge(userData)
  };
};

const countActiveUsers = (users) => users.filter(user => user.active).length;

const countInactiveUsers = (users) => users.filter(user => !user.active).length;

const calculateEmailStats = (users) => {
  const withEmail = users.filter(user => user.email).length;
  const validEmails = users.filter(user => isValidEmail(user.email)).length;
  
  return {
    withEmail,
    withoutEmail: users.length - withEmail,
    valid: validEmails,
    invalid: withEmail - validEmails
  };
};

const calculatePhoneStats = (users) => {
  const withPhone = users.filter(user => user.phone).length;
  const validPhones = users.filter(user => isValidPhone(user.phone)).length;
  
  return {
    withPhone,
    withoutPhone: users.length - withPhone,
    valid: validPhones,
    invalid: withPhone - validPhones
  };
};

const calculateAgeStats = (users) => {
  const usersWithAge = users.filter(user => user.age);
  const over18 = usersWithAge.filter(user => user.age >= 18).length;
  
  return {
    over18,
    under18: usersWithAge.length - over18
  };
};

const calculateAverageAge = (users) => {
  const usersWithAge = users.filter(user => user.age);
  if (usersWithAge.length === 0) return 0;
  
  const totalAge = usersWithAge.reduce((sum, user) => sum + user.age, 0);
  return totalAge / usersWithAge.length;
};`;

    fs.writeFileSync(path.join(this.demoDir, 'good-code.js'), goodCode);
    console.log('📝 Đã tạo file good-code.js (code dễ bảo trì)');
  }

  /**
   * Tạo cấu hình ESLint
   */
  createESLintConfig() {
    const eslintConfig = `export default [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    },
    rules: {
      // Maintainability rules
      'complexity': ['warn', 5],
      'max-depth': ['warn', 3],
      'max-lines': ['warn', 100],
      'max-lines-per-function': ['warn', 30],
      'max-params': ['warn', 3],
      'max-statements': ['warn', 15],
      
      // Modern JavaScript
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'warn',
      'prefer-destructuring': 'warn',
      'prefer-template': 'warn',
      
      // Code quality
      'no-unused-vars': 'warn',
      'no-else-return': 'warn',
      'no-nested-ternary': 'error',
      'object-shorthand': 'warn'
    }
  }
];`;

    fs.writeFileSync(path.join(this.demoDir, 'eslint.config.js'), eslintConfig);
    console.log('📝 Đã tạo file eslint.config.js');
  }

  /**
   * Chạy ESLint trên code xấu
   */
  runESLintOnBadCode() {
    console.log('\n🔍 Chạy ESLint trên code xấu...');
    
    try {
      const output = execSync('npx eslint bad-code.js --format stylish', {
        cwd: this.demoDir,
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      console.log('📊 Kết quả ESLint trên code xấu:');
      console.log(output);
      
    } catch (error) {
      if (error.status === 1) {
        console.log('📊 Kết quả ESLint trên code xấu:');
        console.log(error.stdout);
      } else {
        console.log('⚠️  ESLint chưa được cài đặt, bỏ qua bước này');
      }
    }
  }

  /**
   * Hiển thị so sánh
   */
  showComparison() {
    console.log('\n📊 SO SÁNH MAINTAINABILITY');
    console.log('==========================');
    
    console.log('\n❌ CODE KHÓ BẢO TRÌ:');
    console.log('   - Function quá phức tạp (complexity > 10)');
    console.log('   - Nested conditions sâu (> 4 levels)');
    console.log('   - Function quá dài (> 50 lines)');
    console.log('   - Sử dụng var thay vì const/let');
    console.log('   - String concatenation thay vì template literals');
    console.log('   - Không sử dụng destructuring');
    console.log('   - Logic phức tạp trong một function');
    
    console.log('\n✅ CODE DỄ BẢO TRÌ:');
    console.log('   - Tách thành các function nhỏ');
    console.log('   - Sử dụng early returns');
    console.log('   - Sử dụng const/let');
    console.log('   - Template literals');
    console.log('   - Destructuring');
    console.log('   - Arrow functions');
    console.log('   - Mỗi function chỉ làm một việc');
    
    console.log('\n🎯 LỢI ÍCH CỦA MAINTAINABILITY:');
    console.log('   - Dễ đọc và hiểu code');
    console.log('   - Dễ test và debug');
    console.log('   - Dễ mở rộng và thay đổi');
    console.log('   - Giảm bugs và lỗi');
    console.log('   - Tăng productivity của team');
  }

  /**
   * Cleanup demo files
   */
  cleanup() {
    try {
      if (fs.existsSync(this.demoDir)) {
        fs.rmSync(this.demoDir, { recursive: true, force: true });
        console.log('\n🧹 Đã xóa thư mục demo');
      }
    } catch (error) {
      console.log('\n⚠️  Không thể xóa thư mục demo:', error.message);
    }
  }
}

// Chạy demo
const demo = new MaintainabilityDemo();
demo.runDemo().catch(error => {
  console.error('❌ Lỗi:', error.message);
  process.exit(1);
});

export default MaintainabilityDemo;
