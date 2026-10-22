// ==========================================
// 幼兒園生活常識 - 響應式拖曳測驗系統 (p5.js)
// ==========================================

// 題目資料定義（包含 ID、題目名稱、匹配目標、圖案類型與配色）
const QUIZ_DATA = [
  { id: 1, text: "飯前要洗手", targetLabel: "勤洗手", type: "handwash", color: "#4FC3F7" },
  { id: 2, text: "睡前要刷牙", targetLabel: "潔牙齒", type: "brush", color: "#81C784" },
  { id: 3, text: "多吃新鮮水果", targetLabel: "吃水果", type: "fruit", color: "#FF8A65" },
  { id: 4, text: "喝湯小心會燙", targetLabel: "防燙傷", type: "soup", color: "#E57373" },
  { id: 5, text: "早睡早起身體好", targetLabel: "早睡早起", type: "sun", color: "#FFD54F" },
  { id: 6, text: "友愛同學互助", targetLabel: "愛同學", type: "heart", color: "#BA68C8" }
];

// 全域變數宣告
let targets = [];       // 上方目標放置區塊陣列
let draggables = [];    // 下方可拖曳文字選項陣列
let draggedItem = null; // 當前正在拖曳的項目
let offsetX = 0;        // 拖曳時滑鼠與元件 X 軸偏移量
let offsetY = 0;        // 拖曳時滑鼠與元件 Y 軸偏移量

// 遊戲狀態控制 ("QUIZ": 測驗中, "RESULT": 結算結果)
let gameState = "QUIZ";
let score = 0;          // 得分 (0 - 100)
let confetti = [];      // 慶祝彩帶粒子陣列
let bgBubbles = [];     // 背景浮動氣泡陣列

// 按鈕區域物件位置與尺寸
let submitBtn = { x: 0, y: 0, w: 200, h: 55, visible: false };
let retryBtn = { x: 0, y: 0, w: 180, h: 50 };

// ------------------------------------------
// p5.js 初始化設定區 (setup)
// ------------------------------------------
function setup() {
  // 創建全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 設定文字對齊方式為置中
  textAlign(CENTER, CENTER);
  // 畫筆設置：無邊框模式作為預設
  noStroke();

  // 初始化背景浮動氣泡
  initBackgroundBubbles();

  // 初始化測驗題目與拖曳物件
  initQuiz();
}

// ------------------------------------------
// 當視窗尺寸改變時觸發 (windowResized)
// ------------------------------------------
function windowResized() {
  // 調整畫布大小為全螢幕
  resizeCanvas(windowWidth, windowHeight);
  // 重新計算所有 UI 元件的位置以實現響應式佈局
  repositionUI();
}

// ------------------------------------------
// p5.js 主繪製循環 (draw)
// ------------------------------------------
function draw() {
  // 每一畫面幀先以實心背景清空畫布，避免殘影痕跡
  background("#E3F2FD");

  // 繪製粉彩漸層背景覆蓋畫布
  drawPastelBackground();

  // 更新並繪製背景浮動氣泡
  updateAndDrawBubbles();

  // 繪製頂部標題列
  drawHeader();

  // 繪製上方 6 個目標區域 (GIF 動畫效果)
  for (let t of targets) {
    t.display();
  }

  // 繪製下方 6 個可拖曳文字選項（先畫未拖曳的，最後畫拖曳中的，確保被拖曳項目不會被遮擋）
  for (let d of draggables) {
    if (d !== draggedItem) {
      d.display();
    }
  }
  if (draggedItem) {
    draggedItem.display();
  }

  // 檢查是否所有選項均已完成放置，更新「交卷按鈕」顯示狀態
  checkAllPlaced();

  // 如果是在測驗狀態且選項目標已齊全，顯示交卷按鈕
  if (gameState === "QUIZ" && submitBtn.visible) {
    drawSubmitButton();
  }

  // 如果已經交卷，繪製成績結算卡片與特效
  if (gameState === "RESULT") {
    drawResultModal();

    // 高於 80 分（答對 5 題以上），觸發全螢幕彩帶動畫
    if (score >= 80) {
      updateAndDrawConfetti();
    }
  }
}

// ------------------------------------------
// 初始化背景氣泡函數
// ------------------------------------------
function initBackgroundBubbles() {
  bgBubbles = [];
  for (let i = 0; i < 20; i++) {
    bgBubbles.push({
      x: random(width),
      y: random(height),
      size: random(20, 60),
      speedY: random(0.3, 1.2),
      color: color(random(200, 255), random(200, 255), random(220, 255), 150)
    });
  }
}

// ------------------------------------------
// 初始化測驗資料結構與佈局
// ------------------------------------------
function initQuiz() {
  gameState = "QUIZ";
  score = 0;
  confetti = [];
  draggedItem = null;

  targets = [];
  draggables = [];

  // 打亂題目順序，增加每次遊玩的樂趣
  let shuffledData = shuffle([...QUIZ_DATA]);
  // 拖曳文字選項也進行隨機打亂
  let shuffledOptions = shuffle([...QUIZ_DATA]);

  // 建立目標區與拖曳區物件
  for (let i = 0; i < 6; i++) {
    targets.push(new TargetZone(i, shuffledData[i]));
    draggables.push(new DraggableItem(i, shuffledOptions[i]));
  }

  // 計算並分配所有元件座標
  repositionUI();
}

// ------------------------------------------
// 響應式 UI 座標重新計算函數
// ------------------------------------------
function repositionUI() {
  // 判斷是否為行動裝置或小螢幕（單欄或兩欄顯示，大螢幕三欄）
  let cols = width < 600 ? 2 : (width < 960 ? 3 : 6);
  let rows = ceil(6 / cols);

  // 上方目標區尺寸與間距計算
  let targetWidth = min((width - (cols + 1) * 15) / cols, 140);
  let targetHeight = targetWidth * 1.15;
  let startX = (width - (cols * targetWidth + (cols - 1) * 15)) / 2;
  let startY = height * 0.16;

  for (let i = 0; i < targets.length; i++) {
    let col = i % cols;
    let row = floor(i / cols);
    let x = startX + col * (targetWidth + 15) + targetWidth / 2;
    let y = startY + row * (targetHeight + 15) + targetHeight / 2;
    targets[i].updatePos(x, y, targetWidth, targetHeight);
  }

  // 下方可拖曳選項尺寸與間距計算
  let dragYStart = startY + rows * (targetHeight + 15) + 30;
  let dragWidth = min((width - (cols + 1) * 15) / cols, 130);
  let dragHeight = 48;
  let dragStartX = (width - (cols * dragWidth + (cols - 1) * 15)) / 2;

  for (let i = 0; i < draggables.length; i++) {
    let col = i % cols;
    let row = floor(i / cols);
    let homeX = dragStartX + col * (dragWidth + 15) + dragWidth / 2;
    let homeY = dragYStart + row * (dragHeight + 12) + dragHeight / 2;

    draggables[i].updateHome(homeX, homeY, dragWidth, dragHeight);
  }

  // 設定交卷按鈕與重試按鈕位置
  submitBtn.x = width / 2;
  submitBtn.y = height - 60;
  retryBtn.x = width / 2;
  retryBtn.y = height / 2 + 100;
}

// ------------------------------------------
// 繪製粉彩夢幻背景
// ------------------------------------------
function drawPastelBackground() {
  push();
  rectMode(CORNER);
  noStroke();
  let step = 10;
  for (let y = 0; y < height; y += step) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(color("#E3F2FD"), color("#FFF3E0"), inter);
    fill(c);
    rect(0, y, width, step);
  }
  pop();
}

// ------------------------------------------
// 更新並繪製浮動背景氣泡
// ------------------------------------------
function updateAndDrawBubbles() {
  push();
  noStroke();
  for (let b of bgBubbles) {
    b.y -= b.speedY;
    if (b.y < -b.size) {
      b.y = height + b.size;
      b.x = random(width);
    }
    fill(b.color);
    ellipse(b.x, b.y, b.size);
  }
  pop();
}

// ------------------------------------------
// 繪製遊戲標題區
// ------------------------------------------
function drawHeader() {
  push();
  // 標題外框背景區塊
  fill(255, 255, 255, 220);
  rectMode(CENTER);
  rect(width / 2, height * 0.07, min(width * 0.9, 600), 50, 25);

  // 主標題文字
  fill("#37474F");
  textSize(min(width * 0.045, 24));
  textStyle(BOLD);
  text("🌟 幼兒園生活常識大挑戰 🌟", width / 2, height * 0.07);

  // 提示副標題
  fill("#546E7A");
  textSize(min(width * 0.03, 14));
  textStyle(NORMAL);
  text("請將下方的常識文字拖曳配對至正確的動畫圖卡中！", width / 2, height * 0.12);
  pop();
}

// ------------------------------------------
// 檢查是否所有題目都已選填
// ------------------------------------------
function checkAllPlaced() {
  let count = 0;
  for (let d of draggables) {
    if (d.isSnapped) count++;
  }
  // 當 6 個項目都被拖入目標區，開啟交卷按鈕
  submitBtn.visible = (count === 6);
}

// ------------------------------------------
// 繪製交卷按鈕
// ------------------------------------------
function drawSubmitButton() {
  push();
  rectMode(CENTER);
  
  // 按鈕呼吸縮放效果
  let scaleEffect = sin(frameCount * 0.08) * 3;
  
  // 按鈕陰影
  fill(0, 0, 0, 30);
  rect(submitBtn.x, submitBtn.y + 4, submitBtn.w + scaleEffect, submitBtn.h, 30);

  // 按鈕主體漸層色
  fill("#4CAF50");
  rect(submitBtn.x, submitBtn.y, submitBtn.w + scaleEffect, submitBtn.h, 30);

  // 按鈕文字
  fill(255);
  textSize(20);
  textStyle(BOLD);
  text("📝 交卷看成績", submitBtn.x, submitBtn.y);
  pop();
}

// ------------------------------------------
// 計算成績與發送結算
// ------------------------------------------
function calculateScore() {
  let correctCount = 0;
  for (let t of targets) {
    if (t.occupant && t.occupant.data.id === t.data.id) {
      correctCount++;
    }
  }
  // 每題分值為 (100/6) 分，換算成整數
  score = round((correctCount / 6) * 100);
  gameState = "RESULT";

  // 若成績 >= 80 分，生成彩帶粒子
  if (score >= 80) {
    createConfetti();
  }
}

// ------------------------------------------
// 繪製成績結算卡片 Modal
// ------------------------------------------
function drawResultModal() {
  push();
  // 半透明背景遮罩
  fill(0, 0, 0, 150);
  rectMode(CORNER);
  rect(0, 0, width, height);

  rectMode(CENTER);
  let modalW = min(width * 0.85, 420);
  let modalH = 340;

  // 卡片白色背景與圓角
  fill(255);
  stroke("#FFD54F");
  strokeWeight(6);
  rect(width / 2, height / 2, modalW, modalH, 30);
  noStroke();

  // 卡片評語與圖示
  let emoji = score >= 80 ? "🎉" : (score >= 60 ? "👍" : "💪");
  let titleText = score >= 80 ? "太棒了！生活小達人！" : (score >= 60 ? "做得好！繼續加油！" : "再試一次會更好喔！");

  textSize(40);
  text(emoji, width / 2, height / 2 - 100);

  fill("#37474F");
  textSize(22);
  textStyle(BOLD);
  text(titleText, width / 2, height / 2 - 50);

  // 顯示得分
  fill("#E91E63");
  textSize(36);
  text(`得分：${score} 分`, width / 2, height / 2 + 10);

  // 重試按鈕繪製
  fill("#2196F3");
  rect(retryBtn.x, retryBtn.y, retryBtn.w, retryBtn.h, 25);

  fill(255);
  textSize(18);
  text("🔄 重新挑戰", retryBtn.x, retryBtn.y);
  pop();
}

// ==========================================
// 類別：目標放置區域 (TargetZone)
// 包含 Procedural p5.js 動畫（模擬 GIF 動畫效果）
// ==========================================
class TargetZone {
  constructor(index, data) {
    this.index = index;
    this.data = data;
    this.x = 0;
    this.y = 0;
    this.w = 100;
    this.h = 100;
    this.occupant = null; // 目前吸附於此處的拖曳元件
  }

  // 更新座標尺寸
  updatePos(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    if (this.occupant) {
      this.occupant.x = x;
      this.occupant.y = y + h * 0.28;
    }
  }

  // 繪製目標區域與其對應的動畫 GIF 圖案
  display() {
    push();
    rectMode(CENTER);

    // 外框背景卡片
    fill(255, 255, 255, 230);
    stroke(this.data.color);
    strokeWeight(3);
    rect(this.x, this.y, this.w, this.h, 20);

    // 繪製模擬 GIF 動畫圖示 (根據 type 繪製不同動態效果)
    this.drawAnimatedIcon(this.x, this.y - this.h * 0.15, this.data.type);

    // 標籤提示文字（例如：勤洗手、潔牙齒）
    noStroke();
    fill("#455A64");
    textSize(min(this.w * 0.15, 14));
    textStyle(BOLD);
    text(this.data.targetLabel, this.x, this.y + this.h * 0.35);

    // 結算時顯示對錯標示
    if (gameState === "RESULT" && this.occupant) {
      let isCorrect = this.occupant.data.id === this.data.id;
      textSize(28);
      text(isCorrect ? "⭕" : "❌", this.x + this.w * 0.35, this.y - this.h * 0.35);
    }
    pop();
  }

  // 模擬 GIF 動畫之繪製邏輯
  drawAnimatedIcon(cx, cy, type) {
    push();
    translate(cx, cy);

    if (type === "handwash") {
      // 動畫 1: 洗手水滴與水波 (伸縮脈動)
      let dropY = sin(frameCount * 0.1) * 5;
      fill("#29B6F6");
      noStroke();
      ellipse(0, dropY, 20, 26);
      triangle(-10, dropY, 10, dropY, 0, dropY - 18);
      // 手掌輪廓
      fill("#FFCC80");
      rect(0, 10, 22, 14, 5);
    } else if (type === "brush") {
      // 動畫 2: 旋轉擺動的牙刷與泡沫
      let angle = sin(frameCount * 0.12) * 0.3;
      rotate(angle);
      fill("#E0E0E0");
      rect(0, 0, 8, 30, 4);
      fill("#00E676");
      rect(0, -12, 12, 10, 2);
      // 動態泡泡
      fill(255, 255, 255, 200);
      ellipse(sin(frameCount * 0.1) * 10, -18, 6, 6);
    } else if (type === "fruit") {
      // 動畫 3: 彈跳的水果 (蘋果/橘子)
      let bounceY = abs(sin(frameCount * 0.08)) * -8;
      translate(0, bounceY);
      fill("#FF5252");
      ellipse(0, 0, 28, 26);
      fill("#4CAF50");
      ellipse(2, -14, 8, 4); // 葉子
    } else if (type === "soup") {
      // 動畫 4: 冒熱氣的湯碗
      fill("#FF9800");
      arc(0, 5, 32, 24, 0, PI, CHORD); // 碗
      // 動態上升蒸氣
      stroke(200);
      strokeWeight(2);
      noFill();
      for (let i = -1; i <= 1; i++) {
        let smokeY = (frameCount * 1.5 + i * 10) % 20;
        let waveX = sin(frameCount * 0.1 + i) * 3;
        stroke(200, 200, 200, map(smokeY, 0, 20, 255, 0));
        line(i * 8 + waveX, -5 - smokeY, i * 8 + waveX, -10 - smokeY);
      }
    } else if (type === "sun") {
      // 動畫 5: 轉動光芒的太陽
      fill("#FFD54F");
      ellipse(0, 0, 24, 24);
      stroke("#FFA000");
      strokeWeight(2.5);
      for (let a = 0; a < TWO_PI; a += PI / 4) {
        let rotA = a + frameCount * 0.02;
        line(cos(rotA) * 15, sin(rotA) * 15, cos(rotA) * 20, sin(rotA) * 20);
      }
    } else if (type === "heart") {
      // 動畫 6: 縮放愛心
      let scaleFactor = 1 + sin(frameCount * 0.1) * 0.15;
      scale(scaleFactor);
      fill("#EC407A");
      noStroke();
      beginShape();
      vertex(0, 5);
      bezierVertex(-12, -10, -20, 5, 0, 18);
      bezierVertex(20, 5, 12, -10, 0, 5);
      endShape(CLOSE);
    }
    pop();
  }
}

// ==========================================
// 類別：可拖曳文字選項 (DraggableItem)
// ==========================================
class DraggableItem {
  constructor(index, data) {
    this.index = index;
    this.data = data;
    this.x = 0;
    this.y = 0;
    this.homeX = 0;
    this.homeY = 0;
    this.w = 120;
    this.h = 45;
    this.isDragging = false;
    this.isSnapped = false;
    this.target = null;
  }

  // 更新初始歸屬座標與尺寸
  updateHome(x, y, w, h) {
    this.homeX = x;
    this.homeY = y;
    this.w = w;
    this.h = h;
    // 若未被吸附，重置回初始位置
    if (!this.isSnapped && !this.isDragging) {
      this.x = x;
      this.y = y;
    } else if (this.isSnapped && this.target) {
      this.x = this.target.x;
      this.y = this.target.y + this.target.h * 0.28;
    }
  }

  // 繪製拖曳文字卡片
  display() {
    push();
    rectMode(CENTER);

    // 拖曳時顯示卡片陰影
    if (this.isDragging) {
      fill(0, 0, 0, 30);
      rect(this.x + 4, this.y + 6, this.w, this.h, 15);
    }

    // 卡片本體顏色
    fill(this.isDragging ? "#FFF9C4" : "#FFFFFF");
    stroke(this.isDragging ? "#FFB300" : "#90CAF9");
    strokeWeight(2);
    rect(this.x, this.y, this.w, this.h, 15);

    // 文字樣式
    noStroke();
    fill("#37474F");
    textSize(min(this.w * 0.13, 15));
    textStyle(BOLD);
    text(this.data.text, this.x, this.y);
    pop();
  }

  // 點擊判定 (Point in Rect)
  isMouseOver() {
    return (
      mouseX > this.x - this.w / 2 &&
      mouseX < this.x + this.w / 2 &&
      mouseY > this.y - this.h / 2 &&
      mouseY < this.y + this.h / 2
    );
  }
}

// ==========================================
// 滑鼠與觸控事件處理區 (Mouse & Touch Events)
// ==========================================

function mousePressed() {
  if (gameState === "RESULT") {
    // 檢查點擊「重新挑戰」按鈕
    let d = dist(mouseX, mouseY, retryBtn.x, retryBtn.y);
    if (d < retryBtn.w / 2) {
      initQuiz();
    }
    return;
  }

  // 檢查點擊「交卷看成績」按鈕
  if (submitBtn.visible) {
    if (
      mouseX > submitBtn.x - submitBtn.w / 2 &&
      mouseX < submitBtn.x + submitBtn.w / 2 &&
      mouseY > submitBtn.y - submitBtn.h / 2 &&
      mouseY < submitBtn.y + submitBtn.h / 2
    ) {
      calculateScore();
      return;
    }
  }

  // 處理拖曳選項點擊
  for (let i = draggables.length - 1; i >= 0; i--) {
    let item = draggables[i];
    if (item.isMouseOver()) {
      draggedItem = item;
      item.isDragging = true;

      // 若原先已吸附在某目標上，將其釋放
      if (item.isSnapped && item.target) {
        item.target.occupant = null;
        item.target = null;
        item.isSnapped = false;
      }

      offsetX = item.x - mouseX;
      offsetY = item.y - mouseY;
      break;
    }
  }
}

function mouseDragged() {
  // 動態更新當前拖曳物件座標
  if (draggedItem) {
    draggedItem.x = mouseX + offsetX;
    draggedItem.y = mouseY + offsetY;
  }
}

function mouseReleased() {
  if (draggedItem) {
    let snapped = false;

    // 檢查是否拖曳至任何目標區域附近 (距離判定 / 磁吸機制)
    for (let t of targets) {
      let d = dist(draggedItem.x, draggedItem.y, t.x, t.y);

      // 若放開位置靠近目標且該目標未被佔用
      if (d < t.w * 0.7) {
        // 如果該目標已有其他佔用者，將原佔用者彈回原位
        if (t.occupant) {
          t.occupant.isSnapped = false;
          t.occupant.target = null;
          t.occupant.x = t.occupant.homeX;
          t.occupant.y = t.occupant.homeY;
        }

        // 吸附至目標區域
        draggedItem.x = t.x;
        draggedItem.y = t.y + t.h * 0.28;
        draggedItem.isSnapped = true;
        draggedItem.target = t;
        t.occupant = draggedItem;

        snapped = true;
        break;
      }
    }

    // 若未成功吸附，則自動返回下方初始位置
    if (!snapped) {
      draggedItem.x = draggedItem.homeX;
      draggedItem.y = draggedItem.homeY;
      draggedItem.isSnapped = false;
      draggedItem.target = null;
    }

    draggedItem.isDragging = false;
    draggedItem = null;
  }
}

// ------------------------------------------
// 全螢幕慶祝彩帶 (Confetti Effect)
// ------------------------------------------
function createConfetti() {
  confetti = [];
  let colors = ["#FF4081", "#EEFF41", "#00E676", "#00B0FF", "#AA00FF", "#FF9100"];
  for (let i = 0; i < 120; i++) {
    confetti.push({
      x: random(width),
      y: random(-height, 0),
      size: random(6, 12),
      color: random(colors),
      speedY: random(3, 8),
      speedX: random(-2, 2),
      rotation: random(TWO_PI),
      rotSpeed: random(-0.1, 0.1)
    });
  }
}

function updateAndDrawConfetti() {
  push();
  for (let p of confetti) {
    p.y += p.speedY;
    p.x += p.speedX;
    p.rotation += p.rotSpeed;

    // 超出畫布底部時重複循環落下
    if (p.y > height) {
      p.y = random(-50, -10);
      p.x = random(width);
    }

    push();
    translate(p.x, p.y);
    rotate(p.rotation);
    fill(p.color);
    noStroke();
    rect(0, 0, p.size, p.size * 1.5);
    pop();
  }
  pop();
}