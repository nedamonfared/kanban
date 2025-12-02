//const API_TOKEN = "9ktoj744epmq5p880jneoo7rict4ehhsbe4c0mf8ic92fvr9e0ll"; //
document.addEventListener('DOMContentLoaded', () => {
    
    // --- تنظیمات اصلی ---
    // لطفاً فقط توکن خود را در این قسمت جایگذاری کنید
    
    const JIRA_DOMAIN = "https://atlassian.crouseco.com/jira";
    const USER_EMAIL = "n.monfared@crouse.ir";
    const API_TOKEN = "9ktoj744epmq5p880jneoo7rict4ehhsbe4c0mf8ic92fvr9e0ll"; 
    const BOARD_ID = "124";
    
    // !!!!!!!!!!!! هشدار امنیتی !!!!!!!!!!!!
    // توکن API جدید خود را در اینجا قرار دهید. این توکن مانند رمز عبور شماست.
    // آن را با هیچکس به اشتراک نگذارید و در کدهای عمومی آپلود نکنید.
    const kanbanBoard = document.getElementById('kanban-board');
    const messageContainer = document.getElementById('message-container');

    // تابع برای نمایش پیام (لودینگ یا خطا)
    function showMessage(type, title, details = []) {
        let detailsHtml = '';
        if (details.length > 0) {
            detailsHtml = '<ul>' + details.map(d => `<li>${d}</li>`).join('') + '</ul>';
        }
        messageContainer.innerHTML = `
            <div class="${type}-message">
                <strong>${title}</strong>
                ${detailsHtml}
            </div>
        `;
    }

    // تابع اصلی برای دریافت و نمایش تسک‌ها
    async function fetchAndRenderBoard() {
        showMessage('loading', 'در حال بارگذاری تسک‌ها از جیرا...');
        
        // ساخت هدر Authorization برای ارسال به API جیرا
        const headers = new Headers();
        headers.append("Authorization", "Basic " + btoa(USER_EMAIL + ":" + API_TOKEN));
        headers.append("Accept", "application/json");

        // URL نهایی برای دریافت issue های بورد
        const apiUrl = `${JIRA_DOMAIN}/rest/agile/1.0/board/${BOARD_ID}/issue?maxResults=100`;

        try {
            const response = await fetch(apiUrl, { method: 'GET', headers: headers });

            if (!response.ok) {
                // مدیریت خطاهای HTTP
                const errorData = await response.json().catch(() => null);
                const errorMessages = errorData ? errorData.errorMessages : ['پاسخی از سرور دریافت نشد.'];
                throw new Error(`خطای ${response.status}: ${errorMessages.join(', ')}`);
            }

            const data = await response.json();
            messageContainer.innerHTML = ''; // پاک کردن پیام لودینگ
            renderBoard(data.issues);

        } catch (error) {
            console.error('خطا در ارتباط با API جیرا:', error);
            showMessage('error', 'مشکلی در دریافت اطلاعات پیش آمد!', [
                `متن خطا: ${error.message}`,
                'لطفاً موارد زیر را بررسی کنید:',
                '۱. آیا توکن API شما صحیح و معتبر است؟',
                '۲. آیا آدرس دامنه جیرا و شناسه بورد (Board ID) درست است؟',
                '۳. آیا به اینترنت یا شبکه داخلی شرکت متصل هستید؟'
            ]);
        }
    }

    // تابع برای ساخت ستون‌ها و کارت‌ها در صفحه
    function renderBoard(issues) {
        kanbanBoard.innerHTML = ''; // پاک کردن محتوای قبلی بورد
        const columns = {};

        // گروه‌بندی تسک‌ها بر اساس وضعیت (status)
        issues.forEach(issue => {
            const statusName = issue.fields.status.name;
            if (!columns[statusName]) {
                columns[statusName] = [];
            }
            columns[statusName].push(issue);
        });

        // ایجاد ستون‌ها در HTML
        for (const columnName in columns) {
            const columnEl = document.createElement('div');
            columnEl.className = 'kanban-column';
            columnEl.innerHTML = `<h2>${columnName} (${columns[columnName].length})</h2>`;
            
            const cardsContainer = document.createElement('div');
            cardsContainer.className = 'cards-container';
            cardsContainer.dataset.columnName = columnName; // برای شناسایی ستون
            
            // ایجاد کارت‌ها برای هر تسک در ستون
            columns[columnName].forEach(issue => {
                const card = createTaskCard(issue);
                cardsContainer.appendChild(card);
            });
            
            columnEl.appendChild(cardsContainer);
            kanbanBoard.appendChild(columnEl);
        }

        // فعال‌سازی قابلیت درگ-اند-دراپ برای تمام ستون‌ها
        enableDragAndDrop();
    }

    // تابع برای ساخت یک کارت تسک
    function createTaskCard(issue) {
        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.dataset.issueId = issue.id;

        const assigneeAvatar = issue.fields.assignee ? issue.fields.assignee.avatarUrls['48x48'] : '';

        card.innerHTML = `
            <div class="card-title">${issue.key}</div>
            <div class="card-summary">${issue.fields.summary}</div>
            ${assigneeAvatar ? `<div class="card-footer"><img src="${assigneeAvatar}" alt="Assignee"></div>` : ''}
        `;
        return card;
    }
    
    // تابع برای فعال‌سازی درگ-اند-دراپ با SortableJS
    function enableDragAndDrop() {
        const cardContainers = document.querySelectorAll('.cards-container');
        cardContainers.forEach(container => {
            new Sortable(container, {
                group: 'kanban', // نام گروه مشترک برای امکان جابجایی بین ستون‌ها
                animation: 150,
                ghostClass: 'sortable-ghost',
                dragClass: 'sortable-drag',
            });
        });
    }

    // اجرای برنامه
    fetchAndRenderBoard();
});
