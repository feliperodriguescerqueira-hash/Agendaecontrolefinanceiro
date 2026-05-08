import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes?: string;
}

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  service: string;
  date: string;
  time: string;
  price: number;
  status: 'agendado' | 'concluido' | 'cancelado';
  notes?: string;
}

export interface Finance {
  id: string;
  type: 'receita' | 'despesa';
  description: string;
  value: number;
  date: string;
  category: string;
}

interface AppState {
  clients: Client[];
  services: Service[];
  appointments: Appointment[];
  finances: Finance[];
  addClient: (client: Client) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addService: (service: Service) => void;
  updateService: (id: string, service: Partial<Service>) => void;
  deleteService: (id: string) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  addFinance: (finance: Finance) => void;
  updateFinance: (id: string, finance: Partial<Finance>) => void;
  deleteFinance: (id: string) => void;
}

const initialServices: Service[] = [
  { id: '1', name: 'Corte Feminino', duration: 60, price: 80, category: 'Cabelo' },
  { id: '2', name: 'Corte Masculino', duration: 30, price: 40, category: 'Cabelo' },
  { id: '3', name: 'Coloração', duration: 120, price: 200, category: 'Cabelo' },
  { id: '4', name: 'Manicure', duration: 45, price: 35, category: 'Unhas' },
  { id: '5', name: 'Pedicure', duration: 60, price: 45, category: 'Unhas' },
  { id: '6', name: 'Design de Sobrancelhas', duration: 30, price: 30, category: 'Estética' },
  { id: '7', name: 'Limpeza de Pele', duration: 90, price: 150, category: 'Estética' },
  { id: '8', name: 'Massagem Relaxante', duration: 60, price: 120, category: 'Estética' },
];

export const useAppData = create<AppState>()(
  persist(
    (set) => ({
      clients: [],
      services: initialServices,
      appointments: [],
      finances: [],
      addClient: (client) =>
        set((state) => ({ clients: [...state.clients, client] })),
      updateClient: (id, updatedClient) =>
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, ...updatedClient } : c
          ),
        })),
      deleteClient: (id) =>
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
        })),
      addService: (service) =>
        set((state) => ({ services: [...state.services, service] })),
      updateService: (id, updatedService) =>
        set((state) => ({
          services: state.services.map((s) =>
            s.id === id ? { ...s, ...updatedService } : s
          ),
        })),
      deleteService: (id) =>
        set((state) => ({
          services: state.services.filter((s) => s.id !== id),
        })),
      addAppointment: (appointment) =>
        set((state) => ({ appointments: [...state.appointments, appointment] })),
      updateAppointment: (id, updatedAppointment) =>
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === id ? { ...a, ...updatedAppointment } : a
          ),
        })),
      deleteAppointment: (id) =>
        set((state) => ({
          appointments: state.appointments.filter((a) => a.id !== id),
        })),
      addFinance: (finance) =>
        set((state) => ({ finances: [...state.finances, finance] })),
      updateFinance: (id, updatedFinance) =>
        set((state) => ({
          finances: state.finances.map((f) =>
            f.id === id ? { ...f, ...updatedFinance } : f
          ),
        })),
      deleteFinance: (id) =>
        set((state) => ({
          finances: state.finances.filter((f) => f.id !== id),
        })),
    }),
    {
      name: 'salon-storage',
    }
  )
);
