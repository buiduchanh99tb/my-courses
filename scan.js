const fs = require('fs');
const path = require('path');

// Cấu hình
const ROOT_DIR = './'; // Thư mục gốc cần quét
const OUTPUT_FILE = 'index.json'; // Đổi từ courses.json -> index.json
const EXCLUDE_DIRS = ['node_modules', '.git', '.github', 'workflows']; // Thêm workflows

/**
 * Chuyển đổi tên folder thành tên khóa học
 * VD: "khoa-hoc-seo-all-in-one-truyen-nghe" -> "Khóa Học Seo All In One Truyền Nghề"
 */
function folderNameToCourseName(folderName) {
  return folderName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Kiểm tra xem thư mục có chứa file khóa học không
 */
function isCourseFolder(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    const hasJson = files.some(f => f.endsWith('.json'));
    const hasImage = files.some(f => f.match(/\.(png|jpg|jpeg|webp|gif)$/i));
    return hasJson && hasImage;
  } catch (e) {
    return false;
  }
}

/**
 * Quét thư mục và tạo danh sách khóa học
 */
function scanDirectories(rootPath) {
  const courses = [];
  
  try {
    const items = fs.readdirSync(rootPath, { withFileTypes: true });
    
    for (const item of items) {
      // Bỏ qua file và thư mục loại trừ
      if (!item.isDirectory() || EXCLUDE_DIRS.includes(item.name)) {
        continue;
      }
      
      const folderPath = path.join(rootPath, item.name);
      
      // Kiểm tra xem có phải folder khóa học không
      if (isCourseFolder(folderPath)) {
        const files = fs.readdirSync(folderPath);
        
        // Tìm file JSON (ưu tiên không phải package.json)
        const jsonFile = files.find(f => f.endsWith('.json') && f !== 'package.json');
        
        // Tìm file ảnh (ưu tiên .png, sau đó .jpg, .jpeg, .webp)
        const imageFile = files.find(f => f.endsWith('.png')) ||
                         files.find(f => f.endsWith('.jpg')) ||
                         files.find(f => f.endsWith('.jpeg')) ||
                         files.find(f => f.endsWith('.webp')) ||
                         files.find(f => f.match(/\.(gif)$/i));
        
        if (jsonFile && imageFile) {
          // Đọc file JSON để lấy tên khóa học (nếu có)
          let courseName = folderNameToCourseName(item.name);
          
          try {
            const jsonContent = fs.readFileSync(
              path.join(folderPath, jsonFile), 
              'utf-8'
            );
            const jsonData = JSON.parse(jsonContent);
            
            // Nếu JSON có trường name/title/courseName thì dùng
            if (jsonData.name || jsonData.title || jsonData.courseName) {
              courseName = jsonData.name || jsonData.title || jsonData.courseName;
            }
          } catch (e) {
            // Nếu JSON bị mã hóa hoặc lỗi, dùng tên folder
            console.warn(`⚠️  Không đọc được JSON trong ${item.name}, dùng tên folder`);
          }
          
          courses.push({
            name: courseName,
            file: `${item.name}/${jsonFile}`,
            thumb: `${item.name}/${imageFile}`
          });
          
          console.log(`✓ Tìm thấy: ${item.name}`);
        } else {
          console.warn(`⚠️  Folder ${item.name} thiếu ${!jsonFile ? 'file JSON' : 'file ảnh'}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Lỗi khi quét thư mục:', error.message);
  }
  
  return courses;
}

/**
 * Hàm chính
 */
function main() {
  console.log('🔍 Bắt đầu quét thư mục...\n');
  
  const courses = scanDirectories(ROOT_DIR);
  
  console.log(`\n📊 Kết quả: Tìm thấy ${courses.length} khóa học`);
  
  // Ghi ra file JSON
  fs.writeFileSync(
    OUTPUT_FILE, 
    JSON.stringify(courses, null, 2), 
    'utf-8'
  );
  
  console.log(`📝 Đã cập nhật file ${OUTPUT_FILE}\n`);
  console.log('📋 Nội dung:');
  console.log(JSON.stringify(courses, null, 2));
}

// Chạy script
main();
