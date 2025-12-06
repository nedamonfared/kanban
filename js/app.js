document.addEventListener('DOMContentLoaded', () => {
    // URL مستقیم به API شما در ScriptRunner
    const apiUrl = 'https://atlassian.crouseco.com/rest/scriptrunner/latest/custom/getDataAnalizeIssues';

    // انتخاب ستون‌ها از DOM
    const columns = document.querySelectorAll('.kanban-column');

    // تابع برای دریافت داده‌ها از API
    const fetchData = async () => {
        console.log('در حال تلاش برای دریافت داده از:', apiUrl);
        try {
            // فراخوانی API با استفاده از fetch
            const response = await fetch(apiUrl);

            // بررسی اینکه آیا پاسخ شبکه موفقیت آمیز است
            if (!response.ok) {
                // اگر سرور خطایی برگرداند (مثلا 401, 403, 500)
                console.error('خطا در پاسخ شبکه:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('جزئیات خطا:', errorText);
                alert(`خطا در ارتباط با سرور: ${response.status}. لطفاً کنسول (F12) را بررسی کنید.`);
                return;
            }

            // تبدیل پاسخ به فرمت JSON
            const issues = await response.json();
            console.log('داده‌ها با موفقیت دریافت شد:', issues);

            // پردازش و نمایش تسک‌ها
            displayIssues(issues);

        } catch (error) {
            // این خطا معمولا به دلیل مشکلات شبکه یا CORS رخ می‌دهد
            console.error('یک خطای اساسی در هنگام فراخوانی API رخ داد:', error);
            alert('فراخوانی API با شکست مواجه شد. به احتمال زیاد به دلیل خطای CORS است. لطفاً کنسول (F12) را برای جزئیات بیشتر بررسی کنید.');
        }
    };

    // تابع برای ساخت و نمایش کارت‌های تسک
    const displayIssues = (issues) => {
        // ابتدا تمام کارت‌های موجود را پاک می‌کنیم
        columns.forEach(column => {
            const cardContainer = column.querySelector('.card-container');
            cardContainer.innerHTML = '';
        });

        // به ازای هر تسک دریافت شده، یک کارت ایجاد می‌کنیم
        issues.forEach(issue => {
            // پیدا کردن ستون مناسب بر اساس نام وضعیت تسک
            const targetColumn = document.querySelector(`[data-status="${issue.statusName}"]`);
            
            if (targetColumn) {
                const cardContainer = targetColumn.querySelector('.card-container');
                const card = document.createElement('div');
                card.className = 'kanban-card';
                card.draggable = true;
                
                // محتوای کارت با استفاده از داده‌های API
                card.innerHTML = `
                    <div class="card-header">${issue.issueKey}</div>
                    <div class="card-body">${issue.issueSummary}</div>
                    <div class="card-footer">
                        <span>Assignee: ${issue.assignee || 'Unassigned'}</span>
                    </div>
                `;
                
                cardContainer.appendChild(card);
            }
        });
    };

    // اجرای تابع برای دریافت داده‌ها هنگام بارگذاری صفحه
    fetchData();
});
