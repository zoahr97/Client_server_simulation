const NotesServer = {
    handleRequest(xhr, url, body, method) {
        // חילוץ המשתמש מה-body - השרת Stateless ולכן חייב לקבל זהות בכל בקשה
        const user = body?.currentUser;
        
        // הגנה בסיסית: אם אין יוזר בבקשה, השרת מחזיר שגיאת 401
        if (!user) {
            xhr.handleResponse(401, JSON.stringify({ error: 'לא מורשה - יש להתחבר' }));
            return;
        }

        // קבלת רשימת פתקים - סינון בשרת כדי להחזיר רק מה ששייך למשתמש המחובר
        if (url === '/notes/list' && method === 'GET') {
            const mine = DB.getNotes().filter(n => n.user === user);
            xhr.handleResponse(200, JSON.stringify(mine));
            return;
        }

        // יצירת פתק חדש ושמירה שלו ב-DB עם שיוך למשתמש (Ownership)
        if (url === '/notes/create' && method === 'POST') {
            const note = { 
                id: Date.now(), 
                title: body.title, 
                color: body.color, 
                user: user, 
                updated: new Date().toLocaleString(), 
                content: '' 
            };
            DB.saveNote(note); // קריאה ל-API של שכבת הנתונים
            xhr.handleResponse(200, JSON.stringify(note));
            return;
        }

        // טיפול בבקשות לפי ID ספציפי (שימוש ב-Regex לחילוץ המזהה מהכתובת)
        const match = url.match(/^\/notes\/(\d+)/);
        if (match) {
            const noteId = Number(match[1]);
            const all = DB.getNotes();
            
            // בדיקת אבטחה: מוודאים שהפתק קיים וגם שייך למשתמש שמבקש אותו
            const found = all.find(n => n.id === noteId && n.user === user);

            // שליפת פתק בודד
            if (method === 'GET') {
                if (found) xhr.handleResponse(200, JSON.stringify(found));
                else xhr.handleResponse(404, JSON.stringify({ error: 'פתק לא נמצא' }));
            } 
            // עדכון פתק קיים (החלפת הנתונים הישנים בחדשים שהגיעו מהלקוח)
            else if (method === 'PUT') {
                const updated = { ...found, ...body, updated: new Date().toLocaleString() };
                DB.updateNote(updated);
                xhr.handleResponse(200, JSON.stringify({ success: true, note: updated }));
            } 
            // מחיקת פתק מהמערכת
            else if (method === 'DELETE') {
                DB.deleteNote(noteId);
                xhr.handleResponse(200, JSON.stringify({ success: true }));
            }
            return;
        }
        
        // תשובת ברירת מחדל אם הנתיב לא תואם לאף לוגיקה
        xhr.handleResponse(404, JSON.stringify({ error: 'נתיב לא נמצא' }));
    }
};

// חשיפה גלובלית לצורך הניתוב ב-Network
window.NotesServer = NotesServer;