import axios, { AxiosResponse } from "axios";

// Base URL for Vend API
const VEND_BASE_URL = "https://spaloyalty.vendhq.com/api/2.0";
const AUTH_TOKEN = process.env.LIGHTSPEED_TOKEN;

// Interfaces
export interface Customer {
  id?: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string; // yyyy-mm-dd
  email?: string;
  gender?: string;
  mobile?: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  // Add more fields as per Vend API response
}

export interface VendResponse<T> {
  data: T[];
  after?: string;
}

export class VendService {
  static async getCustomers(after?: string): Promise<VendResponse<Customer>> {
    let url = `${VEND_BASE_URL}/customers`;
    if (after) url += `?after=${after}`;

    const res: AxiosResponse<VendResponse<Customer>> = await axios.get(url, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    });

    return res.data;
  }

  static async getCustomerById(customerId: string): Promise<Customer> {
    const res: AxiosResponse<{ data: Customer }> = await axios.get(
      `${VEND_BASE_URL}/customers/${customerId}`,
      { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );

    return res.data.data;
  }

  static async getTreatments(after?: string): Promise<VendResponse<Product>> {
    let url = `${VEND_BASE_URL}/products`;
    if (after) url += `?after=${after}`;

    const res: AxiosResponse<VendResponse<Product>> = await axios.get(url, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    });

    return res.data;
  }

  static async createCustomer(customer: Customer): Promise<Customer> {
    try {
      const res: AxiosResponse<{ data: Customer }> = await axios.post(
        `${VEND_BASE_URL}/customers`,
        {
          first_name: customer.first_name,
          last_name: customer.last_name,
          date_of_birth: customer.date_of_birth,
          email: customer.email,
          gender: customer.gender,
          mobile: customer.mobile,
        },
        {
          headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
        }
      );

      return res.data.data;
    } catch (e: any) {
      // Throw Vend API error if available
      throw e.response?.data ?? e;
    }
  }
}