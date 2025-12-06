document.addEventListener('DOMContentLoaded', () => {
    // --- تنظیمات اصلی ---
    // آدرس دامنه جیرا و توکن API خود را اینجا قرار دهید
    const JIRA_DOMAIN = 'https://atlassian.crouseco.com/jira';
    const API_TOKEN = '9ktoj744epmq5p880jneoo7rict4ehhsbe4c0mf8ic92fvr9e0ll'; // توکن شما

    // --- ستون‌های کانبان ---
    // نام ستون‌ها باید با مقداری که در کوئری SQL برای statusName برمی‌گردد، مطابقت داشته باشد
    // شما می‌توانید ستون‌های بیشتری بر اساس وضعیت‌های موجود در پروژه‌تان اضافه کنید
    const COLUMNS = {
        'To Do': [],
        'In Progress': [],
        'In Review': [], // مثال: یک ستون جدید
        'Done': []
    };

    const messageContainer = document.getElementById('message-container');
    const kanbanBoard = document.getElementById('kanban-board');

    // تابع برای نمایش پیام
    function showMessage(text, type = 'error') {
        messageContainer.innerHTML = `<div class="${type}-message">${text}</div>`;
        kanbanBoard.innerHTML = ''; // بورد را پاک کن
    }

    // تابع اصلی برای دریافت اطلاعات از API سفارشی شما
    async function fetchAndRenderBoard() {
        showMessage('در حال بارگذاری تسک‌ها از API سفارشی...', 'loading');

        // --- تغییر کلیدی ۱: ساخت هدر با Bearer Token ---
        // ScriptRunner از Bearer Token استفاده می‌کند، نه Basic Auth
        const headers = new Headers();
        headers.append('Authorization', 'Bearer ' + API_TOKEN);
        headers.append('Content-Type', 'application/json');

        // --- تغییر کلیدی ۲: آدرس API سفارشی شما ---
        // دیگر نیازی به Board ID نیست، مستقیم به اندپوینتی که ساختید متصل می‌شویم
        const apiUrl = `${JIRA_DOMAIN}/rest/scriptrunner/latest/custom/getDataAnalizeIssues`;

        try {
            const response = await fetch(apiUrl, { method: 'GET', headers: headers });

            if (!response.ok) {
                // خطاهای رایج برای API سفارشی
                if (response.status === 401) {
                    throw new Error('خطای احراز هویت (401). آیا توکن API صحیح و معتبر است؟');
                } else if (response.status === 403) {
                     throw new Error('خطای دسترسی (403). آیا کاربری که توکن به او تعلق دارد، دسترسی به اجرای اسکریپت را دارد؟');
                } else {
                    const errorText = await response.text(); // دریافت متن خطا از ScriptRunner
                    throw new Error(`خطای سرور: ${response.status}. پیام: ${errorText}`);
                }
            }

            // --- تغییر کلیدی ۳: پردازش پاسخ جدید ---
            // API شما مستقیماً یک آرایه از تسک‌ها را برمی‌گرداند (نه یک آبجکت شامل issues)
            const issues = await response.json();

            if (!issues || issues.length === 0) {
                showMessage('هیچ تسکی از API دریافت نشد.', 'info');
                return;
            }

            // دسته‌بندی تسک‌ها بر اساس فیلد statusName از API شما
            issues.forEach(issue => {
                // نام فیلد statusName دقیقاً همان چیزی است که در کوئری SQL تعریف کردید
                const status = issue.statusName; 
                if (COLUMNS.hasOwnProperty(status)) {
                    COLUMNS[status].push(issue);
                } else {
                    // اگر وضعیتی وجود داشت که در COLUMNS تعریف نشده، آن را نادیده می‌گیریم یا لاگ می‌زنیم
                    console.warn(`وضعیت "${status}" در لیست ستون‌ها تعریف نشده است.`);
                }
            });

            renderBoard();

        } catch (error) {
            console.error('خطا در ارتباط با API سفارشی جیرا:', error);
            const errorMessage = `
                <strong>مشکلی در دریافت اطلاعات از ScriptRunner API پیش آمد!</strong><br>
                خطای اصلی: ${error.message}<br>
                لطفاً موارد زیر را بررسی کنید:
                <ul>
                    <li>آیا توکن API صحیح و فعال است؟</li>
                    <li>آیا آدرس API سفارشی (` + apiUrl + `) صحیح است؟</li>
                    <li>آیا مشکلی در اجرای اسکریپت Groovy در سمت سرور وجود دارد (می‌توانید لاگ‌های جیرا را بررسی کنید)؟</li>
                </ul>
            `;
            showMessage(errorMessage, 'error');
        }
    }

    // تابع برای ساخت HTML بورد با داده‌های جدید
    function renderBoard() {
        kanbanBoard.innerHTML = '';
        messageContainer.innerHTML = '';

        for (const columnName in COLUMNS) {
            const columnEl = document.createElement('div');
            columnEl.className = 'kanban-column';

            const titleEl = document.createElement('h3');
            titleEl.textContent = columnName;
            columnEl.appendChild(titleEl);

            const cardsContainer = document.createElement('div');
            cardsContainer.className = 'cards-container';
            cardsContainer.id = `column-${columnName.replace(/\s+/g, '-')}`;

            // --- تغییر کلیدی ۴: استفاده از نام فیلدهای جدید در ساخت کارت ---
            COLUMNS[columnName].forEach(issue => {
                const card = document.createElement('div');
                card.className = 'kanban-card';
                card.dataset.issueId = issue.issueId; // از issueId که در SQL تعریف کردید استفاده می‌کنیم

                // از issueSummary، issueKey و assignee که در خروجی API شما هستند استفاده می‌کنیم
                card.innerHTML = `
                    <div class="card-title">${issue.issueSummary}</div>
                    <div class="card-meta">
                        <span>${issue.issueKey}</span>
                        ${issue.assignee ? `<span class="assignee">${issue.assignee}</span>` : '<span class="unassigned">Unassigned</span>'}
                    </div>
                `;
                cardsContainer.appendChild(card);
            });

            columnEl.appendChild(cardsContainer);
            kanbanBoard.appendChild(columnEl);

            // فعال‌سازی SortableJS برای Drag and Drop
            new Sortable(cardsContainer, {
                group: 'kanban',
                animation: 150
            });
        }
    }

    // شروع عملیات
    if (!API_TOKEN || API_TOKEN === 'YOUR_API_TOKEN_HERE') {
        showMessage('توکن API در فایل app.js وارد نشده است!', 'error');
    } else {
        fetchAndRenderBoard();
    }
});
