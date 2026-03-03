export interface User {
  id: number;
  username: string;
  role: 'admin' | 'economia' | 'operador' | 'transporte' | 'consultor';
}

export interface Deposit {
  id: number;
  name: string;
  responsible: string;
  location?: string;
}

export interface FuelType {
  id: number;
  name: string;
  price_ecosistema?: number;
  price_externo?: number;
}

export interface Driver {
  id: number;
  full_name: string;
  fleet: string;
}

export interface Vehicle {
  id: number;
  model: string;
  brand: string;
  fuel_type_id: number;
  fuel_type_name?: string;
  ic: string;
  tank_capacity: number;
  plate: string;
}

export interface Client {
  id: number;
  name: string;
  type: 'Ecosistema' | 'Externo';
}

export interface Movement {
  id: number;
  type: 'entry' | 'consumption' | 'sale' | 'loan' | 'adjustment_in' | 'adjustment_out';
  status: 'draft' | 'processed';
  date: string;
  deposit_id: number;
  deposit_name?: string;
  fuel_type_id: number;
  fuel_type_name?: string;
  quantity: number;
  um: string;
  price: number;
  provider?: string;
  vehicle_id?: number;
  plate?: string;
  driver_id?: number;
  driver_name?: string;
  activity?: string;
  op_number?: string;
  client_id?: number;
  client_name?: string;
  receiver_name?: string;
  observations?: string;
}

export interface FuelRequest {
  id: number;
  date: string;
  requester_id: number;
  fuel_type_id: number;
  fuel_type_name?: string;
  quantity: number;
  status: 'pending' | 'approved' | 'rejected';
}
