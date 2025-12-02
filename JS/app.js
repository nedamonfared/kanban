// ==================== بخش تنظیمات - اینجا را با دقت پر کنید ====================
// ==================== فایل کامل و صحیح: js/app.js ====================

// --- بخش ۱: تنظیمات اتصال به جیرا ---
const JIRA_DOMAIN = "https://atlassian.crouseco.com/jira"; 
const JIRA_EMAIL = "n.monfared@crouse.ir";
const API_TOKEN = "9ktoj744epmq5p880jneoo7rict4ehhsbe4c0mf8ic92fvr9e0ll"; 
const BOARD_ID = "124"; 

// --- بخش ۲: نقطه شروع برنامه ---
// این تابع زمانی اجرا می‌شود که کل صفحه HTML بارگذاری شده باشد
document.addEventListener('DOMContentLoaded', () => {
    console.log("Kanban board script starting...");
    fetchJiraData(); // فراخوانی تابع اصلی برای گرفتن داده‌ها از جیرا
});

// --- بخش ۳: تابع اصلی برای فراخوانی API جیرا ---
async function fetchJiraData() {
    // ساخت URL کامل برای درخواست API
    const apiUrl = `${JIRA_DOMAIN}/rest/agile/1.0/board/${BOARD_ID}/issue?maxResults=100`;

    // ساخت توکن احراز هویت (Basic Auth)
    // فرمت لازم: base64-encoded version of "email:api_token"
    const authToken = btoa(`${JIRA_EMAIL}:${API_TOKEN}`);

    console.log(`Sending request to Jira API: ${apiUrl}`);

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${authToken}`,
                'Accept': 'application/json'
            }
        });

        // اگر درخواست ناموفق بود (مثلا خطای 401 یا 404)
        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Successfully fetched data:", data);

        // حالا که داده‌ها را داریم، آن‌ها را در صفحه نمایش می‌دهیم
        renderBoard(data.issues);

    } catch (error) {
        console.error("Failed to connect to Jira API:", error);
        // نمایش یک پیام خطا در صفحه
        const boardContainer = document.getElementById('kanban-board');
        boardContainer.innerHTML = `<div class="error-message">
            <h2>خطا در اتصال به جیرا</h2>
            <p>لطفاً موارد زیر را بررسی کنید:</p>
            <ul>
                <li>آیا به اینترنت یا شبکه داخلی شرکت متصل هستید؟</li>
                <li>آیا توکن API شما صحیح و معتبر است؟</li>
                <li>آیا ادمین جیرا دامنه GitHub Pages شما را در CORS Whitelist ثبت کرده است؟</li>
            </ul>
            <p>جزئیات خطا در کنسول مرورگر (F12) قابل مشاهده است.</p>
        </div>`;
    }
}

// --- بخش ۴: تابع برای ساخت کارت‌ها و ستون‌ها در HTML ---
function renderBoard(issues) {
    const boardContainer = document.getElementById('kanban-board');
    boardContainer.innerHTML = ''; // اول صفحه را خالی کن

    // گروه‌بندی تسک‌ها بر اساس وضعیت (status)
    const columns = {};
    issues.forEach(issue => {
        const statusName = issue.fields.status.name;
        if (!columns[statusName]) {
            columns[statusName] = [];
        }
        columns[statusName].push(issue);
    });

    console.log("Columns grouped by status:", columns);

    // ساخت ستون‌ها و کارت‌ها در HTML
    for (const statusName in columns) {
        // ساخت ستون
        const columnEl = document.createElement('div');
        columnEl.className = 'kanban-column';
        columnEl.innerHTML = `<h2>${statusName}</h2>`;

        // ساخت محفظه کارت‌ها
        const cardsContainerEl = document.createElement('div');
        cardsContainerEl.className = 'cards-container';
        cardsContainerEl.setAttribute('data-status-id', statusName); // برای استفاده در آینده

        // ساخت هر کارت در ستون
        columns[statusName].forEach(issue => {
            const cardEl = document.createElement('div');
            cardEl.className = 'kanban-card';
            cardEl.setAttribute('data-issue-id', issue.id); // ذخیره ID تسک
            cardEl.innerHTML = `
                <div class="card-title">${issue.key}</div>
                <div class="card-summary">${issue.fields.summary}</div>
                <div class="card-footer">
                    <img src="${issue.fields.assignee ? issue.fields.assignee.avatarUrls['24x24'] : 'placeholder.png'}" alt="Assignee">
                </div>
            `;
            cardsContainerEl.appendChild(cardEl);
        });

        columnEl.appendChild(cardsContainerEl);
        boardContainer.appendChild(columnEl);
    }
    
    // بعد از اینکه تمام ستون‌ها و کارت‌ها ساخته شد، قابلیت Drag & Drop را فعال کن
    initSortable();
}


// --- بخش ۵: تابع برای فعال‌سازی Drag & Drop ---
function initSortable() {
    const containers = document.querySelectorAll('.cards-container');
    
    containers.forEach(container => {
        new Sortable(container, {
            group: 'kanban', // این باعث می‌شود بتوان کارت‌ها را بین ستون‌ها جابجا کرد
            animation: 150,
            ghostClass: 'sortable-ghost', // کلاس برای آیتم "شبح"
            dragClass: 'sortable-drag'   // کلاس برای آیتم در حال کشیده شدن
        });
    });

    console.log("SortableJS initialized on all columns.");
}
