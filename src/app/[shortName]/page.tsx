import MenuApp from "../components/MenuApp";

interface BusinessResponse {
    hataMesaj: string | null;
    basarili: boolean;
    isletmeler: {
        id: number;
        isletmeAdi: string;
        kisaAdi: string;
        logo: string | null;
    }[];
}

async function getBusinessData(shortName: string): Promise<{ id: number; name: string; logo: string | null } | null> {
    try {
        const res = await fetch(`http://api.qrmenu.e-prometrik.com/isletmeler/${shortName}`, {
            cache: 'no-store'
        });

        if (!res.ok) return null;

        const data: BusinessResponse = await res.json();

        if (data.basarili && data.isletmeler && data.isletmeler.length > 0) {
            // API'den gelen işletme ismini birincil kaynak olarak kullan (eski haline döndürüldü)
            // Eğer API'den gelen isim boşsa, URL'deki kısa adı (shortName) kullan
            const apiName = data.isletmeler[0].isletmeAdi;
            const fallbackName = shortName.toLocaleUpperCase('tr-TR');
            const finalName = (apiName && apiName.trim().length > 0) ? apiName : fallbackName;

            return {
                id: data.isletmeler[0].id,
                name: finalName,
                logo: data.isletmeler[0].logo
            };
        }

        return null;
    } catch (error) {
        console.error("İşletme verisi çekme hatası:", error);
        return null;
    }
}

async function getProducts(businessId: number) {
    try {
        const res = await fetch("https://api.qrmenu.e-prometrik.com/urunler/getir", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "IsletmeId": businessId }),
            cache: 'no-store'
        });

        if (!res.ok) {
            console.error("Ürünleri getirme başarısız:", res.statusText);
            return { urunler: [] };
        }

        return res.json();
    } catch (e) {
        console.error("Ürün çekme hatası:", e);
        return { urunler: [] };
    }
}

interface PageProps {
    params: Promise<{
        shortName: string;
    }>;
}

export default async function Page({ params }: PageProps) {
    const { shortName } = await params;

    const business = await getBusinessData(shortName);

    if (!business) {
        return (
            <div className="container mt-5 text-center">
                <h3>İşletme bulunamadı</h3>
                <p>"{shortName}" adında bir işletme kayıtlı değil.</p>
            </div>
        );
    }

    const data = await getProducts(business.id);

    return (
        <MenuApp
            initialProducts={data.urunler || []}
            businessName={business.name}
            businessLogo={business.logo || undefined}
        />
    );
}
