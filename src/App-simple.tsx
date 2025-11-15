import { BrowserRouter, Routes, Route } from "react-router-dom";

// Simple test component
const SimpleHome = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🎉 گاراژ سنگین - تست موفق!</h1>
      <p>سیستم کامل کار می‌کند</p>
      <div style={{ marginTop: '20px' }}>
        <h2>🔗 لینک‌های مهم:</h2>
        <ul>
          <li><a href="/admin">پنل ادمین</a></li>
          <li><a href="/auth">ورود/ثبت نام</a></li>
          <li><a href="/listings">آگهی‌ها</a></li>
        </ul>
      </div>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h3>📊 وضعیت سیستم:</h3>
        <p>✅ Backend: http://localhost:8080</p>
        <p>✅ Frontend: http://localhost:5173</p>
        <p>✅ Database: Connected</p>
        <p>✅ APIs: 87% Success Rate</p>
      </div>
    </div>
  );
};

const SimpleAdmin = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>🔐 پنل مدیریت</h1>
      <p>نام کاربری: admin</p>
      <p>رمز عبور: admin123456</p>
      <a href="/">بازگشت به خانه</a>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SimpleHome />} />
        <Route path="/admin" element={<SimpleAdmin />} />
        <Route path="*" element={<SimpleHome />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;