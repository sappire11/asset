const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

// 定義轉換的目錄
const avatarDir = path.join(__dirname, '../travel/avatar');
const imageDir = path.join(__dirname, '../travel/image');

// 確保輸出目錄存在
const webpAvatarDir = path.join(__dirname, '../travel/avatar-webp');
const webpImageDir = path.join(__dirname, '../travel/image-webp');
fs.ensureDirSync(webpAvatarDir);
fs.ensureDirSync(webpImageDir);

// 讀取 travel/index.json
const outputPath = path.join(__dirname, '../travel/index.json');
const output = fs.readJsonSync(outputPath);

// 最大尺寸限制
const MAX_DIMENSION = 1920;

// 轉換函數
async function convertToWebP(inputPath, outputDir, originalFilename) {
  try {
    // 建立輸出檔名 (將原副檔名替換為 .webp)
    const outputFilename = path.basename(originalFilename, path.extname(originalFilename)) + '.webp';
    const outputPath = path.join(outputDir, outputFilename);

    // 讀取圖片資訊
    const metadata = await sharp(inputPath).metadata();
    
    // 檢查尺寸並決定是否需要縮放
    let imageProcess = sharp(inputPath);
    
    if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
      // 計算縮放比例
      const scaleFactor = Math.min(
        MAX_DIMENSION / metadata.width,
        MAX_DIMENSION / metadata.height
      );
      
      // 計算新尺寸
      const newWidth = Math.round(metadata.width * scaleFactor);
      const newHeight = Math.round(metadata.height * scaleFactor);
      
      // 進行縮放
      imageProcess = imageProcess.resize(newWidth, newHeight);
      console.log(`圖片尺寸縮小: ${inputPath} (${metadata.width}x${metadata.height} -> ${newWidth}x${newHeight})`);
    }

    // 轉換為 WebP 格式
    await imageProcess
      .webp({ quality: 80 })
      .toFile(outputPath);

    console.log(`已轉換: ${inputPath} -> ${outputPath}`);
    return outputFilename;
  } catch (error) {
    console.error(`轉換出錯 ${inputPath}: ${error.message}`);
    return null;
  }
}

// 處理所有頭像
async function processAvatars() {
  const avatarFiles = await fs.readdir(avatarDir);
  
  for (const file of avatarFiles) {
    const inputPath = path.join(avatarDir, file);
    await convertToWebP(inputPath, webpAvatarDir, file);
  }
}

// 處理所有圖片
async function processImages() {
  const imageFiles = await fs.readdir(imageDir);
  
  for (const file of imageFiles) {
    const inputPath = path.join(imageDir, file);
    await convertToWebP(inputPath, webpImageDir, file);
  }
}

// 更新 JSON 檔案中的路徑
function updateJsonPaths() {
  // 更新 avatar 路徑
  for (const item of output) {
    if (item.avatar) {
      const filename = path.basename(item.avatar);
      const newFilename = path.basename(filename, path.extname(filename)) + '.webp';
      item.avatar = `travel/avatar-webp/${newFilename}`;
    }

    // 更新 image 路徑 (如果有的話)
    if (item.image && item.image !== '') {
      const filename = path.basename(item.image);
      const newFilename = path.basename(filename, path.extname(filename)) + '.webp';
      item.image = `travel/image-webp/${newFilename}`;
    }
  }

  // 寫回 JSON 檔案
  fs.writeJsonSync(outputPath, output, { spaces: 2 });
  console.log('已更新 travel/index.json 檔案中的路徑');
}

// 執行轉換並更新 JSON
async function main() {
  try {
    await processAvatars();
    await processImages();
    updateJsonPaths();
    console.log('轉換完成！');
  } catch (error) {
    console.error('處理過程發生錯誤:', error);
  }
}

main();
