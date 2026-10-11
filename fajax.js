/*
  קובץ: fajax.js
  תפקיד: הדמיית מנגנון ה-AJAX (Asynchronous JavaScript and XML).
  הקוד מאפשר שליחה וקבלה של נתונים בין הלקוח לשרת בצורה אסינכרונית,
  כך שחווית המשתמש לא נקטעת בזמן ההמתנה לתשובה מהשרת.
*/

/**
 * אובייקט לניהול ומעקב אחרי בקשות.
 * מטרתו העיקרית: מניעת "מצבי תחרות" (Race Conditions).
 * אם נשלחו כמה בקשות לאותה כתובת, נרצה להתייחס רק לתשובה של הבקשה האחרונה שיצאה.
 */

/*
counter (המונה): נותן מספר סידורי (1, 2, 3...) לכל בקשה שיוצאת.
lastSeen (הזיכרון): שומר את המספר של הבקשה הכי "חדשה" שכבר חזרה מהשרת. */
const RequestTracker = {
    counter: 0,     // מונה רץ המעניק מספר סידורי ייחודי לכל בקשה (ID)
    lastSeen: {}    // מפה השומרת עבור כל URL את ה-ID של התגובה המעודכנת ביותר שהתקבלה
}

/**
 * מחלקת FXMLHttpRequest (Fake XMLHttpRequest).
 * מחקה את האובייקט המובנה בדפדפן לצורך ביצוע פניות לרשת המדומה.
 */
class FXMLHttpRequest {
    constructor() {
        this.readyState = 0;            // מצב הבקשה (0: טרם נשלחה, 1: פתוחה, 4: הסתיימה)
        this.method = "";               // סוג הפעולה (GET, POST, PUT, DELETE)
        this.url = "";                  // כתובת היעד (Endpoint)
        this._reqId = 0;                // מזהה פנימי לבקשה הספציפית הזו
        this.onreadystatechange = null; // פונקציית callback שתופעל בכל שינוי מצב
        this.status = 0;                // קוד סטטוס מהשרת (למשל: 200 להצלחה)
        this.responseText = "";         // התוכן הטקסטואלי שחזר מהשרת
        this.timeout = 10000;            // זמן המתנה מקסימלי 10 שניות) ברירת מחדל
        this.ontimeout = null;          // פונקציה שתופעל במקרה של חריגה מזמן המתנה
        this._timer = null;             // משתנה המחזיק את הטיימר הפעיל
    }

    /**
     * פונקציה פנימית לעדכון מצב הבקשה והפעלת המאזין (Callback).
     */
    _updateState() {
        if (this.onreadystatechange) {
            this.onreadystatechange();
        }
    }

    /**
     * פתיחת בקשה חדשה.
     * @param {string} method - סוג הבקשה.
     * @param {string} url - כתובת היעד.
     */
    open(method, url) {
        this.method = method;
        this.url = url;
        this.readyState = 1; // מצב: OPENED
        this._updateState();
    }

    /**
     * שליחת הבקשה דרך רשת התקשורת המדומה.
     * @param {object} body - המידע שנשלח (אופציונלי).
     */
    send(body = null) {
        // יצירת מזהה ייחודי לבקשה הנוכחית בעזרת המונה הגלובלי
        this._reqId = ++RequestTracker.counter;

        // הפעלת מנגנון Timeout: אם השרת לא עונה תוך זמן מוגדר, הבקשה תיכשל
        if (this._timer) clearTimeout(this._timer);
        this._timer = setTimeout(() => this._handleTimeout(), this.timeout);

        // הכנת הנתונים למשלוח: הפיכת האובייקט למחרוזת JSON כפי שנדרש בתקשורת רשת
        const requestData = {
            method: this.method,
            url: this.url,
            body: body ? JSON.stringify(body) : null
        };
        
        // העברת הבקשה לשכבת ה-Network האחראית על ההשהיה ואיבוד הנתונים
        Network.sendRequest(this, requestData);
    }

    
    /**
     * טיפול בתשובה שחוזרת מהשרת דרך הרשת.
     * @param {number} status - קוד הסטטוס מהשרת.
     * @param {string} data - המידע שחזר.
     */
    handleResponse(status, data) {
        // בדיקת תקינות סדר התגובות:
        // אם ה-ID של הבקשה הנוכחית קטן מה-ID האחרון שקיבלנו עבור הכתובת הזו, נתעלם ממנה.
        const last = RequestTracker.lastSeen[this.url] || 0;
        if (this._reqId < last) { 
            console.warn(`Response for ${this.url} discarded due to race condition.`);
            return; 
        }

        // עדכון שהבקשה הזו היא המעודכנת ביותר שטופלה עבור כתובת זו
        RequestTracker.lastSeen[this.url] = this._reqId;

        // ביטול הטיימר מכיוון שהתשובה התקבלה בהצלחה
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
        
        // עדכון נתוני האובייקט במידע שחזר
        this.status = status;
        this.responseText = data;
        this.readyState = 4; // מצב: DONE
        this._updateState();
    }

    /**
     * טיפול במקרה של פקיעת זמן ההמתנה (Timeout).
     * קורה כאשר הרשת "משמיטה" הודעה או כשהשרת איטי מדי.
     */
    _handleTimeout() {
        this.readyState = 4; // נחשב כסיום בקשה (אך עם שגיאה)
        this.status = 0;    // סטטוס 0 מייצג שגיאת תקשורת/פסק זמן
        if (this.ontimeout) this.ontimeout();
        this._updateState();
    }
}