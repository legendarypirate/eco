// app/utils/qpay.ts
interface QPayInvoiceRequest {
  invoice_code: string;
  sender_invoice_no: string;
  invoice_receiver_code: string;
  invoice_description: string;
  amount: number;
  callback_url: string;
}

interface QPayInvoiceResponse {
  invoice_id: string;
  qr_text: string;
  qr_image: string;
  urls: {
    name: string;
    description: string;
    link: string;
    logo: string;
  }[];
}

interface QPayCheckResponse {
  paid: boolean;
  status: string;
  error?: any;
}

interface QPayAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export class QPayService {
  private baseURL = 'https://merchant.qpay.mn/v2';
  private token: string | null = null;
  private tokenExpiry: number | null = null;
  
  async getToken(): Promise<string> {
    // Check if token is still valid (with 5 minute buffer)
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry - 300000) {
      return this.token;
    }
    
    const username = process.env.NEXT_PUBLIC_QPAY_USERNAME || process.env.QPAY_USERNAME;
    const password = process.env.NEXT_PUBLIC_QPAY_PASSWORD || process.env.QPAY_PASSWORD;
    
    if (!username || !password) {
      throw new Error('QPay username or password not configured');
    }
    
    const authString = Buffer.from(`${username}:${password}`).toString('base64');
    
    const response = await fetch(`${this.baseURL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`QPay authentication failed: ${response.status} ${errorText}`);
    }
    
    const data: QPayAuthResponse = await response.json();
    this.token = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000); // Convert seconds to milliseconds
    
    return this.token;
  }
  
  async createInvoice(request: QPayInvoiceRequest): Promise<QPayInvoiceResponse> {
    try {
      const token = await this.getToken();
      
      const response = await fetch(`${this.baseURL}/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`QPay invoice creation failed: ${response.status} ${errorText}`);
      }
      
      const data: QPayInvoiceResponse = await response.json();
      
      // Add fallback QR generation if QR image is not provided
      if (!data.qr_image && data.qr_text) {
        data.qr_image = this.generateQRCode(data.qr_text);
      }
      
      return data;
    } catch (error) {
      console.error('QPay invoice creation error:', error);
      throw error;
    }
  }
  
  async checkInvoice(invoiceId: string): Promise<QPayCheckResponse> {
    try {
      const token = await this.getToken();
      
      const response = await fetch(`${this.baseURL}/payment/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          invoice_id: invoiceId
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`QPay check failed: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      return {
        paid: data.paid_amount >= data.invoice_amount,
        status: data.invoice_status,
        error: data.error
      };
    } catch (error) {
      console.error('QPay check error:', error);
      throw error;
    }
  }
  
  async getInvoice(invoiceId: string): Promise<any> {
    try {
      const token = await this.getToken();
      
      const response = await fetch(`${this.baseURL}/invoice/${invoiceId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`QPay get invoice failed: ${response.status} ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('QPay get invoice error:', error);
      throw error;
    }
  }
  
  async cancelInvoice(invoiceId: string): Promise<boolean> {
    try {
      const token = await this.getToken();
      
      const response = await fetch(`${this.baseURL}/invoice/${invoiceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('QPay cancel invoice error:', error);
      throw error;
    }
  }
  
  generateQRCode(qrText: string): string {
    // In a real implementation, you would use a QR code library
    // For now, we'll return a placeholder or use a QR code API
    // You can use `qrcode` library or a service like QR Code Generator
    
    // Using QR Code Generator API (free tier)
    const encodedText = encodeURIComponent(qrText);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedText}`;
    
    // Alternative using qrcode library (would need to install):
    // import QRCode from 'qrcode';
    // return await QRCode.toDataURL(qrText);
  }
  
  // Utility method to get payment URL for specific app
  getPaymentUrl(invoiceId: string, appName: string = 'qpay'): string {
    const appUrls: Record<string, string> = {
      qpay: `qpay://payment?invoice_id=${invoiceId}`,
      khanbank: `khanbank://payment?invoice_id=${invoiceId}`,
      golomt: `golomtbank://payment?invoice_id=${invoiceId}`,
      tdb: `tdbmobile://payment?invoice_id=${invoiceId}`,
      socialpay: `socialpay://payment?invoice_id=${invoiceId}`
    };
    
    return appUrls[appName.toLowerCase()] || `qpay://payment?invoice_id=${invoiceId}`;
  }
  
  // Format amount for display
  formatAmount(amount: number): string {
    return amount.toLocaleString('mn-MN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }) + '₮';
  }
  
  // Generate payment links for different mobile apps
  getPaymentLinks(invoiceId: string, amount: number, description: string) {
    const amountString = this.formatAmount(amount);
    
    return [
      {
        name: 'QPay',
        description: `QPay апп-аар ${amountString} төлөх`,
        link: this.getPaymentUrl(invoiceId, 'qpay'),
        logo: 'https://www.qpay.mn/images/logo.png'
      },
      {
        name: 'Хаан банк',
        description: `Хаан банкны апп-аар төлөх`,
        link: this.getPaymentUrl(invoiceId, 'khanbank'),
        logo: 'https://www.khanbank.com/favicon.ico'
      },
      {
        name: 'Голомт банк',
        description: `Голомт банкны апп-аар төлөх`,
        link: this.getPaymentUrl(invoiceId, 'golomt'),
        logo: 'https://www.golomtbank.com/favicon.ico'
      },
      {
        name: 'SocialPay',
        description: `SocialPay апп-аар төлөх`,
        link: this.getPaymentUrl(invoiceId, 'socialpay'),
        logo: 'https://socialpay.mn/favicon.ico'
      }
    ];
  }
}

// Singleton instance
export const qpayService = new QPayService();