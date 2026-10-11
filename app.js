/**
 * קובץ: app.js
 * תפקיד: מנהל האפליקציה בצד הלקוח (Controller).
 */

const app = document.getElementById('app'); // אלמנט השורש להזרקת התוכן
let currentNoteId = null; // שמירת מזהה הפתק הנוכחי לעריכה

/**
 * אובייקט עזר לביצוע קריאות רשת
 * ריכוז ה-Promises וה-XHR כאן מבטיח שהלקוח שולט בתקשורת
 */
const ClientAPI = {
    request(method, url, data = {}) {
        return new Promise((resolve, reject) => {
            const xhr = new FXMLHttpRequest(); // יצירת מופע של בקשת HTTP
            xhr.onreadystatechange = () => { // טיפול בשינויי מצב הבקשה
                if (xhr.readyState === 4) { // מצב 4 - הבקשה הסתיימה
                    if (xhr.status >= 200 && xhr.status < 300) { // בדיקת הצלחה (2xx)
                        resolve(JSON.parse(xhr.responseText || '{}')); // החזרת הנתונים כאובייקט
                    } else {
                        reject(xhr.status); // דחייה במקרה של שגיאת שרת
                    }
                }
            };
            xhr.ontimeout = () => reject('timeout'); // טיפול במקרה של פקיעת זמן
            xhr.open(method, url); // פתיחת ערוץ התקשורת
            
            // שליפת המשתמש מהסשן המקומי וצירופו לבקשה (תמיכה בשרת Stateless)
            const currentUser = sessionStorage.getItem('currentUser');
            xhr.send({ ...data, currentUser }); // שליחת גוף הבקשה עם פרטי המשתמש
        });
    }
};

// --- ניהול תצוגה ---

function showTemplate(id) {
    const tpl = document.getElementById(id); // מציאת תבנית ה-HTML
    if (!tpl) return;
    app.innerHTML = ''; // ניקוי המסך לפני טעינה חדשה
    app.appendChild(document.importNode(tpl.content, true)); // שכפול תוכן התבנית ל-DOM
    bindEvents(id); // הצמדת אירועים לאלמנטים החדשים
}

// חיווי טעינה למשתמש בזמן המתנה לתגובת הרשת
function showLoader() {
    if (!document.getElementById('loader')) { // מניעת כפילות של הלואודר
        const div = document.createElement('div');
        div.id = 'loader';
        div.innerHTML = '<div class="loader-box">טוען…</div>';
        document.body.appendChild(div); // הוספה לסוף המסמך
    }
}

function hideLoader() {
    const el = document.getElementById('loader');
    if (el) el.remove(); // הסרת הלואודר מהמסך
}

// --- ניהול אירועים ---

function bindEvents(templateId) {
    switch (templateId) {
        case 'loginTemplate':
            // ניווט להרשמה
            document.getElementById('to-register').addEventListener('click', () => Router.go('registerTemplate'));
            document.getElementById('login-submit').addEventListener('click', () => {
                const username = document.getElementById('login-username').value;
                const password = document.getElementById('login-password').value;
                if (!username || !password) return alert('נא להזין פרטים');
                
                showLoader();
                // שליחת בקשת התחברות לשרת
                ClientAPI.request('POST', '/auth/login', { username, password })
                    .then(result => {
                        hideLoader();
                        if (result.success) {
                            // שמירת המשתמש בסשן הנוכחי
                            sessionStorage.setItem('currentUser', result.username);
                            Router.go('personalAreaTemplate'); // מעבר לדף הבית
                        } else {
                            alert('שם משתמש או סיסמה שגויים');
                        }
                    }).catch(() => { hideLoader(); alert('שגיאת תקשורת או פסק זמן'); });
            });
            break;

        case 'registerTemplate':
            // חזרה להתחברות
            document.getElementById('to-login').addEventListener('click', () => Router.go('loginTemplate'));
            document.getElementById('register-submit').addEventListener('click', () => {
                // איסוף נתוני הרשמה
                const data = {
                    username: document.getElementById('reg-username').value,
                    password: document.getElementById('reg-password').value,
                    phone: document.getElementById('reg-phone').value,
                    email: document.getElementById('reg-email').value
                };
                showLoader();
                ClientAPI.request('POST', '/auth/register', data) // שליחה לשרת
                    .then(() => {
                        hideLoader();
                        alert('נרשמת בהצלחה!');
                        Router.go('loginTemplate'); // הפניה להתחברות
                    }).catch(() => { hideLoader(); alert('הרשמה נכשלה'); });
            });
            break;

        case 'personalAreaTemplate':
            const user = sessionStorage.getItem('currentUser');
            document.getElementById('user-name').textContent = user; // הצגת שם המשתמש בכותרת
            
            // טעינת פרטי המשתמש מהשרת
            ClientAPI.request('POST', '/auth/details').then(details => {
                if (details) {
                    document.getElementById('user-phone').textContent = details.phone || '';
                    document.getElementById('user-email').textContent = details.email || '';
                }
            }).catch(err => console.error("שגיאה בטעינת פרטים", err));

            // האזנה לשינויי חיפוש ומיון
            document.getElementById('search').addEventListener('input', loadNotes);
            document.getElementById('sort').addEventListener('change', loadNotes);

            // יצירת פתק חדש
            document.getElementById('new-note').addEventListener('click', () => {
                const title = document.getElementById('new-note-title').value.trim();
                const color = document.getElementById('new-note-color').value;
                if (!title) return alert('הכנס כותרת');
                
                showLoader();
                ClientAPI.request('POST', '/notes/create', { title, color })
                    .then(() => { hideLoader(); loadNotes(); }) // רענון הרשימה
                    .catch(() => { hideLoader(); alert('שגיאה ביצירת פתק'); });
            });
            loadNotes(); // טעינה ראשונית של הפתקים
            break;

        case 'noteViewTemplate':
            // שליפת ה-ID של הפתק שנבחר
            if (window.nextRouteNoteId) {
                currentNoteId = window.nextRouteNoteId;
                window.nextRouteNoteId = null;
            }
            document.getElementById('back-to-list').addEventListener('click', () => Router.go('personalAreaTemplate'));

            showLoader();
            // משיכת תוכן הפתק הספציפי
            ClientAPI.request('GET', `/notes/${currentNoteId}`)
                .then(note => {
                    hideLoader();
                    // מילוי השדות בערכים הקיימים
                    document.getElementById('note-title-edit').value = note.title || '';
                    document.getElementById('note-content-edit').value = note.content || '';
                    document.getElementById('note-color-edit').value = note.color || '#ffffff';
                    const dateEl = document.getElementById('note-date');
                    if (dateEl) dateEl.textContent = note.updated || '';
                })
                .catch(() => { hideLoader(); alert('שגיאה בטעינת הפתק'); Router.go('personalAreaTemplate'); });

            // שמירת שינויים בפתק
            document.getElementById('update-note').addEventListener('click', () => {
                const data = {
                    title: document.getElementById('note-title-edit').value.trim(),
                    content: document.getElementById('note-content-edit').value,
                    color: document.getElementById('note-color-edit').value
                };
                if (!data.title) return alert('כותרת חובה');
                
                showLoader();
                // עדכון בשרת (שימוש במתודת PUT)
                ClientAPI.request('PUT', `/notes/${currentNoteId}`, data)
                    .then(() => { 
                        hideLoader(); 
                        Router.go('personalAreaTemplate'); 
                    })
                    .catch(() => { hideLoader(); alert('שגיאה בעדכון'); });
            });

            // מחיקת פתק קיים
            document.getElementById('delete-note').addEventListener('click', () => {
                if (confirm('למחוק פתק זה?')) {
                    showLoader();
                    ClientAPI.request('DELETE', `/notes/${currentNoteId}`)
                        .then(() => { hideLoader(); Router.go('personalAreaTemplate'); })
                        .catch(() => { hideLoader(); alert('שגיאה במחיקה'); });
                }
            });
            break;
    }
}

function loadNotes() {
    // קבלת כל הפתקים מהשרת
    ClientAPI.request('GET', '/notes/list')
        .then(notes => {
            const container = document.getElementById('notes-list');
            if (!container) return;
            container.innerHTML = ''; // איפוס התצוגה לפני בנייה מחדש
            
            const search = document.getElementById('search')?.value.toLowerCase() || '';
            const sortVal = document.getElementById('sort')?.value || 'date';
            
            // סינון לפי טקסט חיפוש (Case-insensitive)
            let filtered = notes.filter(n => n.title.toLowerCase().includes(search));

            // מיון לפי תאריך או לפי שם (אלפבית)
            filtered.sort((a, b) => {
                if (sortVal === 'date') return new Date(b.updated) - new Date(a.updated);
                return a[sortVal].localeCompare(b[sortVal]);
            });

            // בנייה דינמית של רשימת ה-DOM
            filtered.forEach(n => {
                const div = document.createElement('div');
                div.className = 'note-item';
                div.style.borderRight = `8px solid ${n.color}`; // סימון צבע הפתק
                div.innerHTML = `<div class="info"><h3>${n.title}</h3><p>${n.updated}</p></div>`;
                div.onclick = () => Router.go('noteViewTemplate', { id: n.id }); // לחיצה פותחת את הפתק
                container.appendChild(div);
            });
        })
        .catch(() => console.error('שגיאה בטעינת רשימה'));
}

// --- אתחול המערכת ---

window.showTemplate = showTemplate; // חשיפה לראוטר
document.addEventListener('DOMContentLoaded', () => {
    Router.init(); // הפעלת הראוטר
    const user = sessionStorage.getItem('currentUser');
    if (user) {
        Router.handleLocation(); // טעינת הדף הנוכחי אם מחובר
    } else {
        Router.go('loginTemplate'); // הפניה להתחברות כברירת מחדל
    }
});