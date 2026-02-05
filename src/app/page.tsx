export default function Home() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 className="h3 mb-3 fw-bold">QR Menü</h1>
      <p>Lütfen görüntülemek istediğiniz işletmenin kısa adını adrese ekleyiniz.</p>
      <a href="/ilknur" className="btn btn-primary theme-bg text-white border-0">Örnek Menü Görüntüle (/ilknur)</a>
    </div>
  );
}
