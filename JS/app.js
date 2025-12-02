// ==================== بخش تنظیمات - اینجا را با دقت پر کنید ====================
// فایل: js/app.js

// ==================== بخش تنظیمات - مقادیر نهایی شما ====================

// ۱. آدرس جیرا
// آدرس دقیق سرور جیرای شما
const JIRA_DOMAIN = "https://atlassian.crouseco.com/jira"; 

// ۲. ایمیل شما
// ایمیلی که با آن در جیرا لاگین می‌کنید
const JIRA_EMAIL = "n.monfared@crouse.ir";

// ۳. توکن API شما
// توکنی که از پروفایل جیرای خود ساخته‌اید و اینجا جایگزین می‌کنید
const API_TOKEN = "lp9v5mk91582vd8n7m3iekr5j5hgeuva4ua00cu3pcicmrvpiehjkic"; 

// ۴. آی‌دی برد (Board ID)
// این عدد از URL مرورگر شما استخراج شد. کاملاً درست است.
const BOARD_ID = "124"; 

// ============================================================================


// ... بقیه کد بدون تغییر باقی می‌ماند ...
===============


// این تابع اصلی است که همه کارها را شروع می‌کند
async function fetchAndRenderBoard() {
    const boardContainer = document.getElementById('kanban-board');
    const loadingIndicator = document.getElementById('loading');

    // ساختن هدر احراز هویت با استفاده از ایمیل و توکن
    const encodedAuth = btoa(`${JIRA_EMAIL}:${API_TOKEN}`);
    const authHeader = { 'Authorization': `Basic ${encodedAuth}`, 'Accept': 'application/json' };

    // آدرس API برای گرفتن تمام تسک‌های یک برد خاص
    const apiUrl = `${JIRA_DOMAIN}/rest/agile/1.0/board/${BOARD_ID}/issue?maxResults=100`;

    try {
        // ارسال درخواست به جیرا
        console.log("Sending request to Jira API...");
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: authHeader
        });

        // اگر پاسخ موفقیت‌آمیز نبود (مثلا خطای 401 یا 404)
        if (!response.ok) {
            throw new Error(`Jira API request failed: ${response.status} ${response.statusText}`);
        }

        // تبدیل پاسخ به فرمت JSON
        const data = await response.json();
        console.log("Successfully fetched data:", data);

        // مخفی کردن پیام لودینگ
        loadingIndicator.style.display = 'none';
        
        // ارسال داده‌ها به تابع renderBoard برای نمایش در صفحه
        renderBoard(data.issues);

    } catch (error) {
        // در صورت بروز هرگونه خطا، آن را در کنسول و صفحه نمایش بده
        console.error("Error connecting to Jira:", error);
        loadingIndicator.textContent = `Error: Could not connect to Jira. Check console (F12) for details. (Most likely a CORS or Auth error)`;
        loadingIndicator.style.color = 'red';
    }
}

// این تابع داده‌ها را می‌گیرد و ساختار HTML بورد را می‌سازد
function renderBoard(issues) {
    const boardContainer = document.getElementById('kanban-board');
    boardContainer.innerHTML = ''; // پاک کردن محتوای قبلی (پیام لودینگ)

    // دسته‌بندی تسک‌ها بر اساس وضعیت (Status) آنها
    const columns = issues.reduce((acc, issue) => {
        const statusName = issue.fields.status.name;
        if (!acc[statusName]) {
            acc[statusName] = []; // اگر ستون برای این وضعیت وجود نداشت، بساز
        }
        acc[statusName].push(issue); // تسک را به ستون مربوطه اضافه کن
        return acc;
    }, {});

    // ساختن HTML برای هر ستون و کارت‌های داخل آن
    for (const columnName in columns) {
        const columnDiv = document.createElement('div');
        columnDiv.className = 'kanban-column';
        
        const columnTitle = document.createElement('h2');
        columnTitle.textContent = columnName;
        
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'cards-container';
        
        columns[columnName].forEach(issue => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'kanban-card';
            cardDiv.dataset.issueKey = issue.key; // ذخیره کردن کلید تسک برای آینده
            
            // ساختن محتوای کارت
            cardDiv.innerHTML = `
                <div class="card-header">${issue.key}</div>
                <div class="card-body">${issue.fields.summary}</div>
            `;
            cardsContainer.appendChild(cardDiv);
        });

        columnDiv.appendChild(columnTitle);
        columnDiv.appendChild(cardsContainer);
        boardContainer.appendChild(columnDiv);
    }
}

// بعد از اینکه کل ساختار HTML صفحه لود شد، تابع اصلی را اجرا کن
document.addEventListener('DOMContentLoaded', fetchAndRenderBoard);
