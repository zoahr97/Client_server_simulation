/*
  קובץ: db-api.js
  תפקיד: שכבת הגישה לנתונים (Data Access Layer).
  הקובץ משמש כממשק בין השרתים לבין ה-localStorage של הדפדפן,
  ומבצע את ההמרה בין אובייקטים של JS למחרוזות JSON וחזרה.
*/

const DB = {
    // --- ניהול משתמשים ---

    /**
     * שליפת כל המשתמשים מהזיכרון
     */
    getUsers() {
        // localStorage שומר רק טקסט, לכן JSON.parse הופך אותו חזרה למערך אובייקטים.
        // אם אין נתונים (null), נחזיר מערך ריק '[]'.
        return JSON.parse(localStorage.getItem('users') || '[]');
    },

    /**
     * שמירת משתמש חדש במערכת
     */
    saveUser(user) {
        const users = this.getUsers(); // קודם כל שולפים את הרשימה הקיימת
        users.push(user); // מוסיפים את המשתמש החדש למערך
        // JSON.stringify הופך את המערך לטקסט כדי שיהיה ניתן לשמור אותו ב-localStorage
        localStorage.setItem('users', JSON.stringify(users));
    },

    /**
     * בדיקת קיום משתמש (עבור תהליך ה-Login)
     */
    findUser(username, password) {
        // מחפש במערך המשתמשים אובייקט שתואם גם לשם וגם לסיסמה
        return this.getUsers().find(u => u.username === username && u.password === password);
    },

    // --- ניהול פתקים ---

    /**
     * שליפת כל הפתקים הקיימים בזיכרון
     */
    getNotes() {
        // בדומה למשתמשים, הופך את הטקסט מהזיכרון למערך של פתקים
        return JSON.parse(localStorage.getItem('notes') || '[]');
    },

    /**
     * הוספת פתק חדש
     */
    saveNote(note) {
        const notes = this.getNotes(); // שולף את כל הפתקים
        notes.push(note); // מוסיף את הפתק החדש
        localStorage.setItem('notes', JSON.stringify(notes)); // שומר חזרה כטקסט
    },

    /**
     * מחיקת פתק לפי מזהה ייחודי (ID)
     */
    deleteNote(id) {
        let notes = this.getNotes();
        // filter יוצר מערך חדש שכולל את כל הפתקים *חוץ* מהפתק עם ה-ID שביקשנו למחוק
        notes = notes.filter(n => n.id !== id);
        localStorage.setItem('notes', JSON.stringify(notes)); // דורס את הרשימה הישנה בחדשה
    },

    /**
     * עדכון תוכן של פתק קיים
     */
    updateNote(updated) {
        let notes = this.getNotes();
        // map עובר על כל הפתקים: אם מצאנו את הפתק עם ה-ID המתאים, נחליף אותו בחדש.
        // אם לא - נשאיר את הפתק הישן (n) כפי שהוא.
        notes = notes.map(n => (n.id === updated.id ? updated : n));
        localStorage.setItem('notes', JSON.stringify(notes));
    }
};
// חשיפת האובייקט לחלון הגלובלי (window) כדי שהשרתים יוכלו לגשת אליו
window.DB = DB;