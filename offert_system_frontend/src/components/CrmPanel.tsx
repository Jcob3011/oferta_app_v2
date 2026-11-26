import {useEffect, useState} from "react";
import type {Company, Seller, Client} from "../types/offer.ts";
import {
    fetchClients,
    fetchSellers,
    fetchCompanies,
    createCompany,
    createSeller,
    createClient
} from "../api/offersApi.ts";

export function CrmPanel() {
    //Lista z bazy
    const [client, setClient] = useState<Client[]>([]);
    const [seller, setSellers] = useState<Seller[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [message, setMessage] = useState("");

    //Pole formularza 1 / Seller
    const [sellerName, setSellerName] = useState('');
    const [sellerNip, setSellerNip] = useState('');
    const [sellerAddress, setSellerAddress] = useState('');
    // Pola formularza 2: Firma Klienta (Company)
    const [compName, setCompName] = useState('');
    const [compNip, setCompNip] = useState('');
    const [compAddress, setCompAddress] = useState('');
    // Pola formularza 3: Osoba Kontaktowa (Client)
    const [clientCompanyId, setClientCompanyId] = useState<number>(0);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');


    const loadAllCrmData = async () => {
        const [sData, comData, cliData] = await Promise.all([
            fetchSellers(),
            fetchCompanies(),
            fetchClients(),
        ]);
        setSellers(sData);
        setCompanies(comData);
        setClient(cliData);
        if (comData.length > 0 && clientCompanyId === 0) {
            setClientCompanyId(comData[0].id);
        }
    };

    useEffect(() => {
        Promise.all([fetchSellers(), fetchCompanies(), fetchClients()]).then(
            ([sData, comData, cliData]) => {
                setSellers(sData);
                setCompanies(comData);
                setClient(cliData);
                if (comData.length > 0) setClientCompanyId(comData[0].id);
            }
        );
    }, []);

    const handleAddSeller = async (e: React.FormEvent) => {
        e.preventDefault();
        await createSeller({
            name: sellerName,
            nip: sellerNip,
            address: sellerAddress,
        });
        setSellerName('');
        setSellerNip('');
        setSellerAddress('');
        setMessage('Dodano nową fimrę Wystawce!');
        loadAllCrmData();
    }

    const handleAddCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        await createCompany({name: compName, nip: compNip, address: compAddress});
        setCompName('');
        setCompNip('');
        setCompAddress('');
        setMessage('Dodano nową Firmę Kontrahenta!');
        loadAllCrmData();
    };

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        await createClient({
            company: clientCompanyId,
            first_name: firstName,
            last_name: lastName,
            email: email,
        })
        setFirstName('');
        setLastName('');
        setEmail('');
        setMessage('Dodano nowego Klienta!')
        loadAllCrmData();
    };


    return (
        <div>
            {message && (
                <div className="card" style={{background: '#ecfdf5', color: '#065f46', padding: '12px 20px'}}>
                    <strong>Sukces:</strong> {message}
                </div>
            )}
            <div className="grid-3">
                {/* 1. WYSTAWCY */}
                <form onSubmit={handleAddSeller}>
                    <h3>1. Nasza Spółka (Wystawca)</h3>
                    <div style={{marginBottom: '10px'}}>
                        <label>Nazwa Spółki</label>
                        <input value={sellerName} onChange={(e) => setSellerName(e.target.value)} required/>
                    </div>
                    <div style={{marginBottom: '10px'}}>
                        <label>NIP</label>
                        <input value={sellerNip} onChange={(e) => setSellerNip(e.target.value)} required/>
                    </div>
                    <div style={{marginBottom: '14px'}}>
                        <label>Adres</label>
                        <input value={sellerAddress} onChange={(e) => setSellerAddress(e.target.value)} required/>
                    </div>
                    <button type="submit">+ Dodaj Wystawcę</button>
                </form>
                {/* 2. FIRMY KONTRAHENTÓW */}
                <form onSubmit={handleAddCompany}>
                    <h3>2. Firma Kontrahenta</h3>
                    <div style={{marginBottom: '10px'}}>
                        <label>Nazwa Firmy Klienta</label>
                        <input value={compName} onChange={(e) => setCompName(e.target.value)} required/>
                    </div>
                    <div style={{marginBottom: '10px'}}>
                        <label>NIP</label>
                        <input value={compNip} onChange={(e) => setCompNip(e.target.value)} required/>
                    </div>
                    <div style={{marginBottom: '14px'}}>
                        <label>Adres</label>
                        <input value={compAddress} onChange={(e) => setCompAddress(e.target.value)} required/>
                    </div>
                    <button type="submit">+ Dodaj Firmę</button>
                </form>
                {/* 3. OSOBY KONTAKTOWE (KLIENCI) */}
                <form onSubmit={handleAddClient}>
                    <h3>3. Osoba Kontaktowa (Klient)</h3>
                    <div style={{marginBottom: '10px'}}>
                        <label>Firma</label>
                        <select value={clientCompanyId} onChange={(e) => setClientCompanyId(Number(e.target.value))}>
                            <option value={0}>-- Wybierz firmę --</option>
                            {companies.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{marginBottom: '10px'}}>
                        <label>Imię i Nazwisko</label>
                        <div style={{display: 'flex', gap: '8px'}}>
                            <input placeholder="Imię" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                                   required/>
                            <input placeholder="Nazwisko" value={lastName} onChange={(e) => setLastName(e.target.value)}
                                   required/>
                        </div>
                    </div>
                    <div style={{marginBottom: '14px'}}>
                        <label>Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required/>
                    </div>
                    <button type="submit">+ Dodaj Klienta</button>
                </form>
            </div>
        </div>
    );
}
