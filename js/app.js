//const API_TOKEN = "9ktoj744epmq5p880jneoo7rict4ehhsbe4c0mf8ic92fvr9e0ll"; //
document.addEventListener('DOMContentLoaded', () => {
    // --- تنظیمات اصلی ---
    // لطفاً این مقادیر را با اطلاعات واقعی خود جایگزین کنید
    const JIRA_DOMAIN = 'https://atlassian.crouseco.com/jira';
    const JIRA_EMAIL = 'n.monfared@crouse.ir';
    const API_TOKEN = '9ktoj744epmq5p880jneoo7rict4ehhsbe4c0mf8ic92fvr9e0ll'; // !!! مهم: توکن API خود را اینجا قرار دهید
    const BOARD_ID = '124'; // شناسه بورد شما

    // --- ستون‌های کانبان ---
    // نام ستون‌ها باید دقیقاً با نام وضعیت‌ها در جیرا مطابقت داشته باشد
    const COLUMNS = {
        'To Do': [],
        'In Progress': [],
        'Done': []
        // در صورت نیاز ستون‌های بیشتری اضافه کنید
        // 'نام ستون در جیرا': []
    };

    const messageContainer = document.getElementById('message-container');
    const kanbanBoard = document.getElementById('kanban-board');

    // تابع برای نمایش پیام
    function showMessage(text, type = 'error') {
        messageContainer.innerHTML = `<div class="${type}-message">${text}</div>`;
        kanbanBoard.innerHTML = ''; // بورد را پاک کن
    }

    // تابع اصلی برای دریافت اطلاعات و ساخت بورد
    async function fetchAndRenderBoard() {
        showMessage('در حال بارگذاری تسک‌ها از جیرا...', 'loading');

        // ساخت هدر Authorization برای Basic Auth
        const headers = new Headers();
        headers.append('Authorization', 'Basic ' + btoa(JIRA_EMAIL + ':' + API_TOKEN));
        headers.append('Content-Type', 'application/json');
        headers.append('Accept', 'application/json');

        // URL جدید و ساده‌تر برای دریافت تمام تسک‌های یک بورد Kanban
        const apiUrl = `${JIRA_DOMAIN}/rest/agile/1.0/board/${BOARD_ID}/issue?maxResults=100`;

        try {
            const response = await fetch(apiUrl, { method: 'GET', headers: headers });

            if (!response.ok) {
                // اگر پاسخ موفقیت‌آمیز نبود، خطا را بر اساس کد وضعیت نمایش بده
                if (response.status === 401) {
                    throw new Error('خطای احراز هویت (401). آیا ایمیل و توکن API صحیح هستند؟');
                } else if (response.status === 404) {
                    throw new Error('بورد پیدا نشد (404). آیا شناسه بورد (Board ID) صحیح است؟');
                } else {
                    throw new Error(`خطای سرور: ${response.status} ${response.statusText}`);
                }
            }

            const data = await response.json();
            const issues = data.issues;

            if (!issues || issues.length === 0) {
                showMessage('هیچ تسکی روی این بورد یافت نشد.', 'info');
                return;
            }

            // دسته‌بندی تسک‌ها در ستون‌های تعریف شده
            issues.forEach(issue => {
                const status = issue.fields.status.name;
                if (COLUMNS.hasOwnProperty(status)) {
                    COLUMNS[status].push(issue);
                }
            });

            renderBoard();

        } catch (error) {
            console.error('خطا در ارتباط با API جیرا:', error);
            const errorMessage = `
                <strong>مشکلی در دریافت اطلاعات پیش آمد!</strong><br>
                خطای اصلی: ${error.message}<br>
                لطفاً موارد زیر را بررسی کنید:
                <ul>
                    <li>آیا توکن API شما صحیح و معتبر است؟</li>
                    <li>آیا آدرس دامنه جیرا و شناسه بورد (Board ID) درست است؟</li>
                    <li>آیا Whitelist در جیرا برای آدرس <strong>https://nedamonfared.github.io</strong> به درستی تنظیم شده است؟ (مهم‌ترین دلیل خطای Failed to fetch)</li>
                </ul>
            `;
            showMessage(errorMessage, 'error');
        }
    }

    // تابع برای ساخت HTML بورد
    function renderBoard() {
        kanbanBoard.innerHTML = ''; // پاک کردن محتوای قبلی
        messageContainer.innerHTML = ''; // پاک کردن پیام‌ها

        for (const columnName in COLUMNS) {
            const columnEl = document.createElement('div');
            columnEl.className = 'kanban-column';

            const titleEl = document.createElement('h3');
            titleEl.textContent = columnName;
            columnEl.appendChild(titleEl);

            const cardsContainer = document.createElement('div');
            cardsContainer.className = 'cards-container';
            cardsContainer.id = `column-${columnName.replace(/\s+/g, '-')}`; // ساخت ID منحصر به فرد

            COLUMNS[columnName].forEach(issue => {
                const card = document.createElement('div');
                card.className = 'kanban-card';
                card.dataset.issueId = issue.id;
                card.innerHTML = `
                    <div class="card-title">${issue.fields.summary}</div>
                    <div class="card-meta">
                        <span>${issue.key}</span>
                        ${issue.fields.assignee ? `<span class="assignee">${issue.fields.assignee.displayName}</span>` : ''}
                    </div>
                `;
                cardsContainer.appendChild(card);
            });

            columnEl.appendChild(cardsContainer);
            kanbanBoard.appendChild(columnEl);

            // فعال‌سازی SortableJS برای هر ستون
            new Sortable(cardsContainer, {
                group: 'kanban', // اجازه جابجایی کارت‌ها بین ستون‌ها
                animation: 150
            });
        }
    }

    // شروع عملیات
    if (API_TOKEN === 'YOUR_API_TOKEN_HERE') {
        showMessage('توکن API در فایل app.js وارد نشده است! لطفاً فایل را ویرایش کرده و توکن خود را جایگذاری کنید.', 'error');
    } else {
        fetchAndRenderBoard();
    }
});
