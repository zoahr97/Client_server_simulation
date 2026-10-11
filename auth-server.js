/**
 * אובייקט השרת שאחראי על כל נושא האימות והמשתמשים
 */
const AuthServer = {
    
    // פונקציה פנימית של השרת לשליפת אובייקט משתמש מלא מה-DB לפי שם משתמש
    getCurrentUserDetails(username) {
        if (!username) return null;
        // גישה ישירה לשכבת הנתונים (DB API) לצורך חיפוש במערך המשתמשים
        return DB.getUsers().find(u => u.username === username) || null;
    },

    /**
     * פונקציית הניתוב המרכזית של שרת האימות. 
     * מקבלת את הבקשה מה-Network ומחליטה איך לטפל בה.
     */
    handleRequest(xhr, url, body, method) {
        
        // טיפול בתהליך התחברות (Login)
        if (url === '/auth/login') {
            // בדיקה האם קיים משתמש עם שם וסיסמה תואמים במסד הנתונים
            const user = DB.findUser(body.username, body.password);
            const ok = !!user;
            
            /** * השרת מחזיר תשובה בלבד. 
             * הוא Stateless ולכן לא שומר sessionStorage (זה תפקיד הלקוח בלבד).
             */
            xhr.handleResponse(200, JSON.stringify({ 
                success: ok, 
                username: ok ? body.username : null 
            }));
            return;
        }

        // טיפול בתהליך הרשמה (Register)
        if (url === '/auth/register') {
            // שמירת אובייקט המשתמש החדש כפי שהתקבל מגוף הבקשה
            DB.saveUser(body);
            // שליחת אישור שהפעולה בוצעה בהצלחה
            xhr.handleResponse(200, JSON.stringify({ success: true }));
            return;
        }

        /**
         * שליפת פרטי פרופיל (טלפון, אימייל).
         * השרת מזהה את המשתמש לפי שדה currentUser שנשלח ב-body מהלקוח.
         */
        if (url === '/auth/details') {
            const details = this.getCurrentUserDetails(body.currentUser); 
            // החזרת פרטי המשתמש שנמצאו (או null אם לא נמצא)
            xhr.handleResponse(200, JSON.stringify(details));
            return;
        }

        // במידה והתקבל נתיב שאינו מוגדר בשרת זה
        xhr.handleResponse(404, JSON.stringify({ error: 'נתיב לא נמצא' }));
    }
};

// חשיפת האובייקט לחלון הגלובלי לצורך הניתוב בשכבת ה-Network
window.AuthServer = AuthServer;