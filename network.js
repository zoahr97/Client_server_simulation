/*
  קובץ: network.js
  תפקיד: הדמיית שכבת הרשת (The Network Layer).
  אחראי על העברת בקשות מהלקוח (FAJAX) לשרתים המתאימים, תוך הוספת
  עיכובים אקראיים ואיבוד הודעות (Packet Loss) כדי לדמות תנאי רשת אמיתיים.
*/

class Network {
    /**
     * קובע האם להפיל את ההודעה (Simulated Packet Loss).
     * מייצר הסתברות משתנה בין 10% ל-50% לכל בקשה.
     * @returns {boolean} אמת אם ההודעה צריכה "ללכת לאיבוד".
     */
    static _shouldDrop() {
        // הגרלת אחוז הנפילה (p יהיה בין 0.1 ל-0.5)
        const p = 0.1 + Math.random() * 0.4;
        // אם המספר האקראי קטן מההסתברות - ההודעה נופלת
        return Math.random() < p;
    }

    /**
     * מחשב זמן השהיה אקראי (Latency).
     * @returns {number} זמן במילי-שניות בין 1000 (שנייה) ל-3000 (3 שניות).
     */
    static _randomDelay() {
        return 1000 + Math.floor(Math.random() * 2000);
    }

    /**
     * הפונקציה המרכזית לשליחת בקשה דרך הרשת.
     * @param {FXMLHttpRequest} xhr - אובייקט ה-FAJAX שיצר את הבקשה.
     * @param {object} requestData - נתוני הבקשה (URL, מתודה, גוף ההודעה).
     */
    static sendRequest(xhr, requestData) {
        const { url, method, body } = requestData;

        // שלב 1: הדמיית "נפילת רשת"
        // אם ההגרלה קבעה שההודעה נפלה, הפונקציה פשוט עוצרת כאן.
        // הלקוח (FAJAX) יחכה עד שהטיימר שלו (Timeout) יסתיים.
        if (Network._shouldDrop()) { 
            console.warn(`Network: Message to ${url} was dropped (Simulated Loss).`);
            return; 
        }

        // הגדרת פעולת ה"מסירה" (Delivery) שתתבצע לאחר ההשהיה
        const deliver = () => {
            // הפיכת גוף ההודעה מ-JSON חזרה לאובייקט JS עבור השרת
            const parsedBody = (body && typeof body === 'string') ? JSON.parse(body) : body;

            // שלב 2: ניתוב (Routing) - זיהוי השרת המתאים לפי כתובת ה-URL
            
            // אם הכתובת מתחילה ב-auth, נפנה לשרת האימות
            if (window.AuthServer && url.startsWith('/auth')) {
                AuthServer.handleRequest(xhr, url, parsedBody, method);
                return;
            }

            // אם הכתובת מתחילה ב-notes, נפנה לשרת הפתקים
            if (window.NotesServer && url.startsWith('/notes')) {
                NotesServer.handleRequest(xhr, url, parsedBody, method);
                return;
            }
            
            console.error(`Network: No server found for URL: ${url}`);
        };

        // שלב 3: הפעלת העיכוב האקראי
        const delay = Network._randomDelay();
        console.log(`Network: Delaying request to ${url} by ${delay}ms`);
        setTimeout(deliver, delay);
    }
}

// הפיכת המחלקה לגלובלית לשימוש על ידי ה-FAJAX
window.Network = Network;