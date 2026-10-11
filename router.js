/**
 * אובייקט ה-Router: אחראי על ניהול הניווט באפליקציה (SPA).
 * גרסה מעודכנת: עובדת עם Hash (#) כדי למנוע שגיאות טעינה מהשרת.
 */
const Router = {
    
    /**
     * אתחול הראוטר: מאזין לשינויים ב-Hash של הכתובת.
     * אירוע 'hashchange' קורה בכל פעם שהכתובת אחרי ה-# משתנה.
     */
    init() {
        window.addEventListener('hashchange', () => {
            Router.handleLocation(); // ניתוח מחדש של הכתובת בכל שינוי
        });
        
        // האזנה גם ל-popstate עבור תמיכה רחבה יותר בדפדפנים
        window.addEventListener('popstate', () => {
            Router.handleLocation();
        });
    },

    /**
     * פונקציית ניווט יזומה.
     * @param {string} templateId - ה-ID של התבנית להצגה.
     * @param {object} data - מידע נוסף (למשל ID של פתק).
     */
    go(templateId, data) {
        let path = '';
        switch (templateId) {
            case 'loginTemplate':
                path = 'login';
                break;
            case 'registerTemplate':
                path = 'register';
                break;
            case 'noteViewTemplate':
                if (data && data.id) path = `notes/${data.id}`;
                break;
            case 'personalAreaTemplate':
            default:
                path = ''; 
        }

        // שימוש ב-Hash בלבד כדי למנוע מהדפדפן לבקש דפים לא קיימים מהשרת
        location.hash = path ? `#${path}` : '#';

        // הזרקת התבנית למסך
        if (window.showTemplate) window.showTemplate(templateId);
    },

    /**
     * ניתוח הכתובת הנוכחית וקביעת התבנית להצגה.
     */
    handleLocation() {
        // שליפת הנתיב מתוך ה-Hash (מתעלם מהתו #)
        let route = location.hash.startsWith('#') ? location.hash.slice(1) : '';
        
        // ניקוי תווים מיותרים בתחילת הנתיב
        if (route.startsWith('/')) route = route.slice(1);

        if (route === 'login') {
            if (window.showTemplate) window.showTemplate('loginTemplate');
            return;
        }
        if (route === 'register') {
            if (window.showTemplate) window.showTemplate('registerTemplate');
            return;
        }

        // טיפול בנתיב דינמי לפתקים (למשל notes/5)
        if (route.startsWith('notes/')) {
            const parts = route.split('/');
            const id = Number(parts[1]); 
            if (!isNaN(id)) {
                window.nextRouteNoteId = id; 
                if (window.showTemplate) window.showTemplate('noteViewTemplate');
                return;
            }
        }

        // דף ברירת מחדל
        if (window.showTemplate) window.showTemplate('personalAreaTemplate');
    }
};

window.Router = Router;