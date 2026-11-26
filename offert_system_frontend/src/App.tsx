import {useState, useEffect} from "react";
import type {Offer} from "./types/offer.ts";
import {fetchOffers, loginUser, changeOfferStatus} from "./api/offersApi.ts";
import {OfferForm} from "./components/OfferForm.tsx";
import {CrmPanel} from "./components/CrmPanel.tsx";

type NavSection = "dashboard" | "offers" | "create" | "crm" | "account";

function App() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [currentUser, setCurrentUser] = useState(
        localStorage.getItem("logged_user") || "itadmin"
    );
    const [offers, setOffers] = useState<Offer[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(
        Boolean(localStorage.getItem("access_token"))
    );
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<NavSection>("dashboard");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await loginUser(username, password);
            localStorage.setItem("logged_user", username);
            setCurrentUser(username);
            setIsLoggedIn(true);
            const data = await fetchOffers();
            setOffers(data);
        } catch {
            setError("Błędny login lub hasło!");
        }
    };

    const handleLoadOffers = async () => {
        setError("");
        try {
            const data = await fetchOffers();
            setOffers(data);
        } catch {
            setError("Sesja wygasła lub brak połączenia z API. Zaloguj się ponownie.");
        }
    };

    const handleStatusAction = async (
        offerId: number,
        action: 'submit' | 'consult' | 'approve' | 'reject' | 'return_to_draft'
    ) => {
        setError("");
        try {
            if (action === "reject") {
                const reason = window.prompt("Podaj powód odrzecenia oferty :");
                if (!reason) return;
                await changeOfferStatus(offerId, action, reason)
            } else {
                await changeOfferStatus(offerId, action);
            }
            await handleLoadOffers();
        } catch {
            setError
            ("Nie udało się zmienić statusu oferty (sprawdź uprawnienia).")
        }
    }


    useEffect(() => {
        if (!isLoggedIn) return;
        fetchOffers()
            .then((data) => setOffers(data))
            .catch(() =>
                setError("Sesja wygasła lub brak połączenia z API. Zaloguj się ponownie.")
            );
    }, [isLoggedIn]);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("logged_user");
        setIsLoggedIn(false);
        setOffers([]);
        setPassword("");
    };

    // ========================================================================
    // 1. EKRAN LOGOWANIA (WYŚRODKOWANY, PIONOWY, GRADIENT + GLOSS/GLASS)
    // ========================================================================
    if (!isLoggedIn) {
        return (
            <div className="login-screen">
                <div className="login-glass-card">
                    <div className="login-brand-badge">B2B</div>
                    <h1 className="login-title">System Ofertowy</h1>
                    <p className="login-subtitle">
                        Zaloguj się do panelu zarządzania ofertami i bazą CRM
                    </p>

                    {error && <div className="alert-error">{error}</div>}

                    <form onSubmit={handleLogin} className="login-form-stack">
                        <div>
                            <label>Nazwa użytkownika</label>
                            <input
                                type="text"
                                placeholder="Wpisz swój login (np. itadmin)"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label>Hasło</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="login-submit-btn">
                            Zaloguj się do portalu →
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Wyliczenia do kafelków Dashboardu:
    const totalNetValue = offers
        .reduce((acc, o) => acc + Number(o.total_price || 0), 0)
        .toFixed(2);
    const pendingCount = offers.filter((o) => o.status === "pending").length;
    const approvedCount = offers.filter((o) => o.status === "approved").length;

    const sectionTitles: Record<NavSection, string> = {
        dashboard: "📊 Dashboard – Przegląd Systemu",
        offers: "📋 Lista Wszystkich Ofert",
        create: "➕ Kreator Nowej Oferty",
        crm: "🏢 Baza CRM – Firmy, Klienci i Wystawcy",
        account: "⚙️ Ustawienia Konta i Profilu",
    };

    // ========================================================================
    // 2. LAYOUT PORTALU PO ZALOGOWANIU (SIDEBAR PO LEWEJ + TOPBAR + CONTENT)
    // ========================================================================
    return (
        <div className="app-shell">
            {/* LEWE MENU BOCZNE (SIDEBAR) */}
            <aside className="sidebar">
                <div>
                    <div className="sidebar-brand">
                        <div className="sidebar-brand-icon">B2B</div>
                        <div>
                            <span className="sidebar-brand-text">OfferSystem</span>
                            <span className="sidebar-brand-sub">Workspace v2.0</span>
                        </div>
                    </div>

                    <div className="sidebar-menu-label">Menu Główne</div>
                    <nav className="sidebar-nav">
                        <button
                            className={`sidebar-link ${activeTab === "dashboard" ? "active" : ""}`}
                            onClick={() => setActiveTab("dashboard")}
                        >
                            <span>📊</span> Dashboard
                        </button>
                        <button
                            className={`sidebar-link ${activeTab === "offers" ? "active" : ""}`}
                            onClick={() => setActiveTab("offers")}
                        >
                            <span>📋</span> Lista Ofert ({offers.length})
                        </button>
                        <button
                            className={`sidebar-link ${activeTab === "create" ? "active" : ""}`}
                            onClick={() => setActiveTab("create")}
                        >
                            <span>➕</span> Nowa Oferta
                        </button>
                        <button
                            className={`sidebar-link ${activeTab === "crm" ? "active" : ""}`}
                            onClick={() => setActiveTab("crm")}
                        >
                            <span>🏢</span> Baza CRM
                        </button>

                        <div className="sidebar-menu-label" style={{marginTop: "20px"}}>
                            Konto i System
                        </div>
                        <button
                            className={`sidebar-link ${activeTab === "account" ? "active" : ""}`}
                            onClick={() => setActiveTab("account")}
                        >
                            <span>⚙️</span> Ustawienia Konta
                        </button>
                    </nav>
                </div>

                {/* STOPKA MENU NA DOLE: KARTA USERA + WYLOGUJ */}
                <div className="sidebar-footer">
                    <div className="sidebar-user-card">
                        <div className="user-avatar">
                            {currentUser.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="user-meta">
                            <div className="user-name">{currentUser}</div>
                            <div className="user-role">Zalogowany (JWT)</div>
                        </div>
                    </div>
                    <button className="sidebar-logout-btn" onClick={handleLogout}>
                        ⎋ Wyloguj z systemu
                    </button>
                </div>
            </aside>

            {/* PRAWA STRONA: GÓRNY PASEK (TOPBAR) + TREŚĆ */}
            <div className="main-area">
                <header className="topbar">
                    <h2 className="topbar-title">{sectionTitles[activeTab]}</h2>

                    <div className="topbar-actions">
                        <button className="btn-secondary" onClick={handleLoadOffers}>
                            ↻ Odśwież dane
                        </button>

                        <div
                            className="account-pill"
                            onClick={() => setActiveTab("account")}
                            title="Przejdź do ustawień konta"
                        >
                            <div
                                className="user-avatar"
                                style={{width: "28px", height: "28px", fontSize: "0.75rem"}}
                            >
                                {currentUser.slice(0, 2).toUpperCase()}
                            </div>
                            <span>{currentUser}</span>
                            <span style={{color: "#94a3b8"}}>⚙️</span>
                        </div>

                        <button className="btn-secondary" onClick={handleLogout}>
                            Wyloguj
                        </button>
                    </div>
                </header>

                <main className="content-container">
                    {error && (
                        <div
                            className="card"
                            style={{
                                background: "#fef2f2",
                                color: "#991b1b",
                                borderColor: "#fecaca",
                                padding: "14px 20px",
                            }}
                        >
                            <strong>Uwaga:</strong> {error}
                        </div>
                    )}

                    {/* WIDOK 1: DASHBOARD */}
                    {activeTab === "dashboard" && (
                        <>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <span className="stat-label">Wszystkie Oferty</span>
                                    <span className="stat-value">{offers.length}</span>
                                    <span className="stat-sub">W bazie PostgreSQL</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-label">Oczekujące na CEO</span>
                                    <span className="stat-value" style={{color: "#d97706"}}>
                    {pendingCount}
                  </span>
                                    <span className="stat-sub">Wymagają decyzji</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-label">Zatwierdzone</span>
                                    <span className="stat-value" style={{color: "#059669"}}>
                    {approvedCount}
                  </span>
                                    <span className="stat-sub">Gotowe do pobrania PDF</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-label">Łączna Wartość Netto</span>
                                    <span className="stat-value" style={{color: "#2563eb"}}>
                    {totalNetValue} PLN
                  </span>
                                    <span className="stat-sub">Suma wszystkich ofert</span>
                                </div>
                            </div>

                            <div className="card"
                                 style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                                <div>
                                    <h3 style={{marginBottom: "4px"}}>Szybkie Akcje</h3>
                                    <p style={{margin: 0, color: "#64748b", fontSize: "0.9rem"}}>
                                        Utwórz nową ofertę handlową lub dodaj nowego kontrahenta do bazy CRM.
                                    </p>
                                </div>
                                <div style={{display: "flex", gap: "10px"}}>
                                    <button onClick={() => setActiveTab("create")}>+ Nowa Oferta</button>
                                    <button className="btn-secondary" onClick={() => setActiveTab("crm")}>
                                        🏢 Zarządzaj Bazą CRM
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* WIDOK 2: KREATOR NOWEJ OFERTY */}
                    {activeTab === "create" && (
                        <OfferForm
                            onOfferCreated={() => {
                                handleLoadOffers();
                                setActiveTab("offers");
                            }}
                        />
                    )}

                    {/* WIDOK 3: BAZA CRM */}
                    {activeTab === "crm" && <CrmPanel/>}

                    {/* WIDOK 4: USTAWIENIA KONTA (PLACEHOLDER) */}
                    {activeTab === "account" && (
                        <div className="card">
                            <h3>Profil Użytkownika ({currentUser})</h3>
                            <p style={{color: "#64748b", marginBottom: "20px"}}>
                                Tutaj wkrótce podepniemy edycję Twojego Imienia, Nazwiska oraz Numeru Telefonu
                                (`UserProfile`), które drukują się w stopce PDF oferty.
                            </p>
                            <div className="grid-2">
                                <div>
                                    <label>Login systemowy</label>
                                    <input value={currentUser} disabled/>
                                </div>
                                <div>
                                    <label>Rola w systemie</label>
                                    <input value="Administrator / Handlowiec" disabled/>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TABELA OFERT (Widoczna na Dashboardzie oraz w zakładce Lista Ofert) */}
                    {(activeTab === "dashboard" || activeTab === "offers") && (
                        <table>
                            <thead>
                            <tr>
                                <th>Numer Oferty</th>
                                <th>Klient / Firma</th>
                                <th>Wystawca</th>
                                <th>Pozycje kosztorysu</th>
                                <th>Status</th>
                                <th>Netto</th>
                                <th>VAT 23%</th>
                                <th>Brutto</th>
                                <th>Akcje</th>
                            </tr>
                            </thead>
                            <tbody>
                            {offers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{textAlign: "center", padding: "32px", color: "#64748b"}}>
                                        Brak ofert w bazie. Kliknij <strong>+ Nowa Oferta</strong> w menu po lewej!
                                    </td>
                                </tr>
                            ) : (
                                offers.map((offer) => (
                                    <tr key={offer.id}>
                                        <td>
                                            <strong>{offer.offer_number}</strong>
                                            <div style={{fontSize: "0.75rem", color: "#64748b"}}>
                                                Ważna do: {offer.valid_until_date}
                                            </div>
                                        </td>
                                        <td>{offer.client_name || `ID: ${offer.client}`}</td>
                                        <td>{offer.seller_name || `ID: ${offer.seller}`}</td>
                                        <td>
                                            {offer.items && offer.items.length > 0 ? (
                                                <div>
                                                    <span
                                                        className="badge"
                                                        style={{
                                                            background: "#eff6ff",
                                                            color: "#1d4ed8",
                                                            marginBottom: "4px",
                                                        }}
                                                    >
                                                        📦 {offer.items.length} poz.
                                                    </span>
                                                    <ul style={{margin: 0, paddingLeft: "16px", fontSize: "0.83rem", color: "#334155"}}>
                                                        {offer.items.slice(0, 2).map((item) => (
                                                            <li key={item.id}>
                                                                {item.description} ({item.quantity} szt. × {item.price_per_unit} zł)
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    {offer.items.length > 2 && (
                                                        <div style={{fontSize: "0.78rem", color: "#2563eb", fontWeight: 600, marginTop: "2px"}}>
                                                            + jeszcze {offer.items.length - 2} poz. w kosztorysie
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{color: "#94a3b8", fontSize: "0.82rem"}}>
                                                    Brak pozycji ({offer.description || "brak uwag"})
                                                </span>
                                            )}
                                        </td>
                                        <td>
                        <span className={`badge badge-${offer.status}`}>
                          {offer.status}
                        </span>
                                        </td>
                                        <td>{offer.total_price} PLN</td>
                                        <td>{offer.total_vat} PLN</td>
                                        <td>
                                            <strong>{offer.total_gross} PLN</strong>
                                        </td>
                                            <td>
                                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                                    {offer.status === "draft" && (
                                                        <>
                                                            <button
                                                                className="btn-sm"
                                                                onClick={() => handleStatusAction(offer.id, "submit")}
                                                            >
                                                                Wyślij do CEO
                                                            </button>
                                                            <button
                                                                className="btn-sm btn-secondary"
                                                                onClick={() => handleStatusAction(offer.id, "consult")}
                                                            >
                                                                Konsultacja IT
                                                            </button>
                                                        </>
                                                    )}
                                                    {offer.status === "pending" && (
                                                        <>
                                                            <button
                                                                className="btn-sm btn-success"
                                                                onClick={() => handleStatusAction(offer.id, "approve")}
                                                            >
                                                                ✔ Zatwierdź
                                                            </button>
                                                            <button
                                                                className="btn-sm btn-danger"
                                                                onClick={() => handleStatusAction(offer.id, "reject")}
                                                            >
                                                                ✕ Odrzuć
                                                            </button>
                                                        </>
                                                    )}
                                                    {(offer.status === "rejected" || offer.status === "consultation") && (
                                                        <button
                                                            className="btn-sm btn-warning"
                                                            onClick={() => handleStatusAction(offer.id, "return_to_draft")}
                                                        >
                                                            ↩ Do edycji
                                                        </button>
                                                    )}
                                                </div>

                                        </td>

                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    )}
                </main>
            </div>
        </div>
    );
}

export default App;
