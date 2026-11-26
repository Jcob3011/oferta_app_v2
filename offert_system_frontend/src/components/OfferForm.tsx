import { useEffect, useState } from "react";
import type { Seller, Client } from "../types/offer.ts";
import { fetchSellers, fetchClients, createOffer, createOfferItem, fetchNbpRate } from "../api/offersApi.ts";

interface OfferFromProps {
    onOfferCreated: () => void;
}

interface DraftItem {
    description: string;
    quantity: number;
    price_per_unit: string;
    currency: 'PLN' | 'EUR' | 'USD';
}

export function OfferForm({ onOfferCreated }: OfferFromProps) {
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [clients, setClients] = useState<Client[]>([]);

    const [sellerId, setSellerId] = useState<number>(0);
    const [clientId, setClientId] = useState<number>(0);
    const [description, setDescription] = useState('');
    const [validityDays, setValidityDays] = useState(14);
    const [paymentDeadlinDays] = useState(7);
    const [paymentMethod, setPaymentMethod] = useState('transfer');
    const [formError, setFormError] = useState('');

    const [items, setItems] = useState<DraftItem[]>([
        { description: '', quantity: 1, price_per_unit: '', currency: 'PLN' },
    ]);

    const [nbpRates, setNbpRates] = useState<{ EUR: number; USD: number }>({
        EUR: 4.30,
        USD: 4.05,
    });

    useEffect(() => {
        fetchSellers().then((data) => {
            setSellers(data);
            if (data.length > 0) setSellerId(data[0].id);
        });
        fetchClients().then((data) => {
            setClients(data);
            if (data.length > 0) setClientId(data[0].id);
        });
        Promise.all([fetchNbpRate('eur'), fetchNbpRate('usd')])
            .then(([eur, usd]) => setNbpRates({ EUR: eur, USD: usd }))
            .catch(() => console.warn('Brak połączenia z NBP – użyto kursów domyślnych'));
    }, []);

    const addItemRow = () => {
        setItems([...items, { description: '', quantity: 1, price_per_unit: '', currency: 'PLN' }]);
    };

    const removeItemRow = (index: number) => {
        if (items.length <= 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItemRow = (
        index: number,
        field: keyof DraftItem,
        value: string | number
    ) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        setItems(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!sellerId || !clientId) {
            setFormError('Wybierz wystawcę oraz klienta (dodaj ich najpierw w zakładce Baza CRM, jeśli listy są puste)!');
            return;
        };

        try {
            const newOffer = await createOffer({
                seller: sellerId,
                client: clientId,
                description,
                validity_days: validityDays,
                payment_deadline_days: paymentDeadlinDays,
                payment_method: paymentMethod,
            });

            for (const item of items) {
                if (item.description.trim()) {
                    const rate = item.currency === 'PLN' ? 1 : nbpRates[item.currency];
                    const convertedPricePln = (Number(item.price_per_unit) * rate).toFixed(2);

                    await createOfferItem({
                        offer: newOffer.id,
                        description:
                            item.currency === 'PLN'
                                ? item.description
                                : `${item.description} (${item.price_per_unit} ${item.currency} wg NBP: ${rate.toFixed(4)})`,
                        quantity: item.quantity,
                        price_per_unit: convertedPricePln,
                    });
                }
            }

            setDescription('');
            setItems([{ description: '', quantity: 1, price_per_unit: '', currency: 'PLN' }]);
            onOfferCreated();
        } catch {
            setFormError('Błąd podczas tworzenia oferty.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3>+ Nowa Oferta Handlowa</h3>
            {formError && <p style={{ color: '#dc2626', fontWeight: 500 }}>{formError}</p>}

            <div className="grid-2" style={{ marginBottom: '20px' }}>
                <div>
                    <label>Wystawca (Nasza Spółka):</label>
                    <select value={sellerId} onChange={(e) => setSellerId(Number(e.target.value))}>
                        <option value={0}>-- Wybierz wystawcę --</option>
                        {sellers.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name} (NIP: {s.nip})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>Klient:</label>
                    <select value={clientId} onChange={(e) => setClientId(Number(e.target.value))}>
                        <option value={0}>-- Wybierz klienta --</option>
                        {clients.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.first_name} {c.last_name} ({c.email})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>Ważność oferty (dni):</label>
                    <input
                        type="number"
                        value={validityDays}
                        onChange={(e) => setValidityDays(Number(e.target.value))}
                    />
                </div>

                <div>
                    <label>Metoda płatności:</label>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                        <option value="transfer">Przelew tradycyjny</option>
                        <option value="split">Przelew (Split Payment)</option>
                        <option value="cash">Gotówka</option>
                        <option value="card">Karta płatnicza</option>
                    </select>
                </div>
            </div>

            <h4>Pozycje kosztorysu (Produkty / Usługi)</h4>
            {items.map((item, index) => (
                <div
                    key={index}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 0.7fr 1fr 1fr auto',
                        gap: '12px',
                        alignItems: 'end',
                        marginBottom: '12px',
                    }}
                >
                    <div>
                        <label>Lp. {index + 1} – Nazwa usługi / produktu</label>
                        <input
                            value={item.description}
                            onChange={(e) => updateItemRow(index, 'description', e.target.value)}
                            placeholder="np. FGSwitch / Wdrożenie"
                            required
                        />
                    </div>
                    <div>
                        <label>Ilość</label>
                        <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItemRow(index, 'quantity', Number(e.target.value))}
                            required
                        />
                    </div>
                    <div>
                        <label>Cena jedn. Netto</label>
                        <input
                            type="number"
                            step="0.01"
                            value={item.price_per_unit}
                            onChange={(e) => updateItemRow(index, 'price_per_unit', e.target.value)}
                            placeholder="0.00"
                            required
                        />
                    </div>
                    <div>
                        <label>Waluta (Kurs NBP)</label>
                        <select
                            value={item.currency}
                            onChange={(e) => updateItemRow(index, 'currency', e.target.value)}
                        >
                            <option value="PLN">PLN (1.00)</option>
                            <option value="EUR">EUR ({nbpRates.EUR.toFixed(4)})</option>
                            <option value="USD">USD ({nbpRates.USD.toFixed(4)})</option>
                        </select>
                    </div>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => removeItemRow(index)}
                        disabled={items.length <= 1}
                        title="Usuń pozycję"
                    >
                        ✕
                    </button>
                </div>
            ))}

            <div style={{ marginBottom: '20px' }}>
                <button type="button" className="btn-secondary" onClick={addItemRow}>
                    + Dodaj kolejną pozycję
                </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
                <label>Dodatkowe uwagi do oferty (opcjonalnie):</label>
                <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Wpisz dodatkowe uwagi, warunki gwarancji lub komentarz dla klienta..."
                />
            </div>

            <button type="submit">Utwórz Ofertę</button>
        </form>
    );
}
