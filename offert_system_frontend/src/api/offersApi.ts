import type {Offer, Seller, Client, Company, OfferItem} from "../types/offer.ts";
import {apiClient} from "./client.ts";

export const loginUser = async (username: string, password: string): Promise<void> => {
    const response = await apiClient.post('token/', {username, password});
    localStorage.setItem('access_token', response.data.access);
};

//BAZA CRM ( Tworzenie i pobieranie )

export const fetchOffers = async (): Promise<Offer[]> => {
    const response = await apiClient.get<Offer[]>('offers/');
    return response.data;
}

export const fetchSellers = async (): Promise<Seller[]> => {
    const response = await apiClient.get<Seller[]>('sellers/')
    return response.data;
}

export const fetchClients = async (): Promise<Client[]> => {
    const response = await apiClient.get<Client[]>('clients/')
    return response.data;
}

export const createOffer = async (newOfferData: {
    seller: number,
    client: number,
    description: string,
    validity_days: number,
    payment_method: string,
    payment_deadline_days: number,
}): Promise<Offer> => {
    const response = await apiClient.post<Offer>('offers/', newOfferData);
    return response.data;
};


export const fetchCompanies = async (): Promise<Company[]> => {
    const response = await apiClient.get<Company[]>('companies/')
    return response.data;
};

export const createCompany = async (data: {
    name: string;
    nip: string;
    address: string;
}): Promise<Company> => {
    const response = await apiClient.post<Company>('companies/', data);
    return response.data;
};


export const createClient = async (data: {
    company: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    position?: string;
}): Promise<Client> => {
    const response = await apiClient.post<Client>('clients/', data);
    return response.data;
};

export const createSeller = async(data: {
    name: string;
    nip: string;
    address: string;
    email?: string;
    phone?: string;
    bank_account?: string;
}): Promise<Seller> => {
    const response = await apiClient.post <Seller>('sellers/', data);
    return response.data;
}

// Pozycje Kosztorysu i statusy

export const createOfferItem = async (data: {
    offer: number;
    description: string;
    quantity: number;
    price_per_unit: string;
}):Promise<OfferItem[]> => {
    const response = await apiClient.post<OfferItem[]>('offer-item/', data);
    return response.data;
}

export const changeOfferStatus = async (
    offerId: number,
    action: 'submit' | 'consult' | 'approve' | 'reject' | 'return_to_draft',
    rejectionReason?: string
):Promise<void> => {
    await apiClient.post(`offers/${offerId}/${action}/`, {
        rejection_reason : rejectionReason
    });
};