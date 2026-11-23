import {useEffect, useState} from "react";
import type {Seller, Client} from "../types/offer.ts";
import {fetchSellers, fetchClients, createOffer} from "../api/offersApi.ts";

interface OfferFromProps{
    onOfferCreated: () => void;
}


export function OfferForm({onOfferCreated}: OfferFromProps){
    //Lista pobrana z Diango
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [clients, setClients] = useState<Client[]>([]);

    //Stan pól formularza
    const [sellerId, setSellerId] = useState<number>(0);
    const [clientId, setClientId] = useState<number>(0);
    const [description, setDescription] = useState('');
    const [validityDays, setValidityDays] = useState(14);
    const [paymentDeadlinDays] = useState(7);
    const [paymentMethod, setPaymentMethod] = useState('transfer');
    const [formError, setFormError] = useState('');

    //Na starcie automat pobnieramy wystawców i klientów z Django
    useEffect(() => {
        fetchSellers().then((data)=> {
            setSellers(data);
            if(data.length > 0) setSellerId(data[0].id);
        });
        fetchClients().then((data)=> {
            setClients(data);
            if(data.length > 0) setClientId(data[0].id);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if(!sellerId || !clientId){
            setFormError('Wybierz wystawcę oraz klienta (dodaj ich najpierw w panelu /admin, jeśli listy są puste)!');
            return;
        }

        try{
            await createOffer({
                seller: sellerId,
                client: clientId,
                description,
                validity_days: validityDays,
                payment_deadline_days: paymentDeadlinDays,
                payment_method: paymentMethod,
            });
            setDescription('');
            onOfferCreated();
        }catch {
            setFormError('Błąd podczas tworzenia oferty.');
        }
    };
    return (
        <form
            onSubmit={handleSubmit}
            style={{
                border: '1px solid #ccc',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '25px',
                backgroundColor: '#f9fafb',
            }}
        >
            <h3 style={{ marginTop: 0 }}>+ Nowa Oferta</h3>
            {formError && <p style={{ color: 'red' }}>{formError}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                    <label>Wystawca (Nasza Spółka): </label>
                    <select value={sellerId} onChange={(e) => setSellerId(Number(e.target.value))} style={{ width: '100%' }}>
                        <option value={0}>-- Wybierz wystawcę --</option>
                        {sellers.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name} (NIP: {s.nip})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Klient: </label>
                    <select value={clientId} onChange={(e) => setClientId(Number(e.target.value))} style={{ width: '100%' }}>
                        <option value={0}>-- Wybierz klienta --</option>
                        {clients.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.first_name} {c.last_name} ({c.email})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Ważność oferty (dni): </label>
                    <input
                        type="number"
                        value={validityDays}
                        onChange={(e) => setValidityDays(Number(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>
                <div>
                    <label>Metoda płatności: </label>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '100%' }}>
                        <option value="transfer">Przelew tradycyjny</option>
                        <option value="split">Przelew (Split Payment)</option>
                        <option value="cash">Gotówka</option>
                        <option value="card">Karta płatnicza</option>
                    </select>
                </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
                <label>Opis zakresu prac (SOW):</label>
                <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Wpisz wstęp lub zakres prac oferty..."
                    style={{ width: '100%' }}
                />
            </div>
            <button type="submit">Utwórz Ofertę</button>
        </form>
    );
}