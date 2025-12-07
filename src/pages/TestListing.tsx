import { useParams } from 'react-router-dom';

export default function TestListing() {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>تست صفحه جزئیات</h1>
      <p>ID آگهی: {id || 'نامشخص'}</p>
      <p>این صفحه برای تست routing است</p>
    </div>
  );
}
