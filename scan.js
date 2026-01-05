const fs = require('fs');
const path = require('path');

// Cấu hình
const ROOT_DIR = './'; // Thư mục gốc cần quét
const OUTPUT_FILE = 'courses.json'; // File JSON output
const EXCLUDE_DIRS = ['node_modules', '.git', '.github']; // Các thư mục bỏ qua

/**
 * Chuyển đổi tên folder thành tên khóa học
 * VD: "khoa-hoc-seo-all-in-one" -> "Khóa Học Seo All In One"
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
  const files = fs.readdirSync(dirPath);
  const hasJson = files.some(f => f.endsWith('.json'));
  const hasImage = files.some(f => f.match(/\.(png|jpg|jpeg|webp)$/i));
  return hasJson && hasImage;
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
        
        // Tìm file JSON
        const jsonFile = files.find(f => f.endsWith('.json'));
        
        // Tìm file ảnh (ưu tiên .png)
        const imageFile = files.find(f => f.match(/\.(png|jpg|jpeg|webp)$/i));
        
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
            courseName = jsonData.name || jsonData.title || jsonData.courseName || courseName;
          } catch (e) {
            console.warn(`Không đọc được JSON trong ${item.name}, dùng tên folder`);
          }
          
          courses.push({
            name: courseName,
            file: `${item.name}/${jsonFile}`,
            thumb: `${item.name}/${imageFile}`
          });
        }
      }
      
      // Quét đệ quy các thư mục con (nếu cần)
      // Bỏ comment dòng dưới nếu muốn quét sâu hơn
      // courses.push(...scanDirectories(folderPath));
    }
  } catch (error) {
    console.error('Lỗi khi quét thư mục:', error.message);
  }
  
  return courses;
}

/**
 * Hàm chính
 */
function main() {
  console.log('🔍 Bắt đầu quét thư mục...');
  
  const courses = scanDirectories(ROOT_DIR);
  
  console.log(`✅ Tìm thấy ${courses.length} khóa học`);
  
  // Ghi ra file JSON
  fs.writeFileSync(
    OUTPUT_FILE, 
    JSON.stringify(courses, null, 2), 
    'utf-8'
  );
  
  console.log(`📝 Đã tạo file ${OUTPUT_FILE}`);
  console.log('\n📋 Nội dung:');
  console.log(JSON.stringify(courses, null, 2));
}

// Chạy script
main();
