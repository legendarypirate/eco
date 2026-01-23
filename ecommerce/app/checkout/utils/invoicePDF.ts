import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Convert number to Mongolian words
function numberToMongolianWords(num: number): string {
  if (num === 0) return 'тэг төгрөг';
  
  const ones = ['', 'нэг', 'хоёр', 'гурав', 'дөрөв', 'тав', 'зургаа', 'долоо', 'найм', 'ес'];
  const attributiveOnes = ['', 'нэг', 'хоёр', 'гурван', 'дөрвөн', 'таван', 'зургаан', 'долоон', 'найман', 'есөн'];
  const tensWords = ['', 'арав', 'хорин', 'гучин', 'дөчин', 'тавин', 'жаран', 'далан', 'наян', 'ерэн'];
  const scales = ['', 'мянга', 'сая', 'тэрбум', 'их наяд'];
  
  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);
  
  if (integerPart === 0) {
    return 'тэг төгрөг';
  }
  
  const parts: string[] = [];
  let chunkIndex = 0;
  let remaining = integerPart;
  
  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk > 0) {
      const chunkWords: string[] = [];
      
      const hundred = Math.floor(chunk / 100);
      const remainder = chunk % 100;
      
      if (hundred > 0) {
        chunkWords.push(attributiveOnes[hundred] + ' зуун');
      }
      
      if (remainder > 0) {
        if (remainder < 10) {
          chunkWords.push(attributiveOnes[remainder]);
        } else if (remainder === 10) {
          chunkWords.push(tensWords[1]);
        } else if (remainder < 20) {
          chunkWords.push('арван ' + attributiveOnes[remainder - 10]);
        } else {
          const tens = Math.floor(remainder / 10);
          const units = remainder % 10;
          chunkWords.push(tensWords[tens] + (units > 0 ? ' ' + attributiveOnes[units] : ''));
        }
      }
      
      const scale = chunkIndex > 0 && scales[chunkIndex] ? ' ' + scales[chunkIndex] : '';
      parts.unshift(chunkWords.join(' ') + scale);
    }
    remaining = Math.floor(remaining / 1000);
    chunkIndex++;
  }
  
  return parts.join(' ') + ' төгрөг';
}

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number; // Unit price without VAT
  total: number; // Line total without VAT
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  issuerName: string;
  issuerRegister: string;
  issuerEmail: string;
  issuerPhone: string;
  issuerAddress: string;
  issuerBankName: string;
  issuerBankAccount: string;
  issuerBankIban: string;
  issuerBankAccountHolder?: string;
  items: InvoiceItem[];
  subtotal: number; // Without VAT
  tax: number; // VAT amount
  total: number; // With VAT
  notes?: string;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<void> {
  // Create a temporary div to render the invoice HTML
  const invoiceDiv = document.createElement('div');
  invoiceDiv.style.position = 'absolute';
  invoiceDiv.style.left = '-9999px';
  invoiceDiv.style.width = '21cm';
  invoiceDiv.style.padding = '0.8cm';
  invoiceDiv.style.fontFamily = 'DejaVu Sans, sans-serif';
  invoiceDiv.style.fontSize = '10pt';
  invoiceDiv.style.lineHeight = '1.3';
  invoiceDiv.style.color = '#000';
  invoiceDiv.style.background = 'white';
  
  const totalInWords = numberToMongolianWords(data.total);
  
  invoiceDiv.innerHTML = `
    <div style="max-width: 21cm; margin: 0 auto; padding: 0.8cm; background: white;">
      <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
        <h1 style="font-size: 18pt; font-weight: bold; margin: 0; color: #2c3e50;">НЭХЭМЖЛЭЛ</h1>
        <div style="font-size: 10pt; color: #7f8c8d; margin: 5px 0;">
          Дугаар: ${data.invoiceNumber} | Огноо: ${data.invoiceDate}
        </div>
      </div>
      
      <div style="display: table; width: 100%; margin-bottom: 20px;">
        <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px; display: table-cell; width: 50%; vertical-align: top; padding-right: 10px;">
          <div style="font-size: 11pt; font-weight: bold; margin-bottom: 8px; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 3px;">Нэхэмжлэгч</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: bold; min-width: 120px;">Байгууллагын нэр:</span>
            <span>${data.issuerName || 'Сонгоогүй'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: bold; min-width: 120px;">Хаяг:</span>
            <span>${data.issuerAddress || '-'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: bold; min-width: 120px;">Утас:</span>
            <span>${data.issuerPhone || '-'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: bold; min-width: 120px;">Имэйл:</span>
            <span>${data.issuerEmail || '-'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: bold; min-width: 120px;">Банкны данс:</span>
            <span>${data.issuerBankName || '-'} ${data.issuerBankAccount ? '- ' + data.issuerBankAccount : ''} ${data.issuerBankIban ? '(' + data.issuerBankIban + ')' : ''}</span>
          </div>
          ${data.issuerBankAccountHolder ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: bold; min-width: 120px;">Дансны эзэмшигч:</span>
            <span>${data.issuerBankAccountHolder}</span>
          </div>
          ` : ''}
        </div>
        
        <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px; display: table-cell; width: 50%; vertical-align: top; padding-right: 0; padding-left: 15px;">
          <div style="font-size: 11pt; font-weight: bold; margin-bottom: 8px; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 3px;">Төлөгч</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: bold; min-width: 120px;">Байгууллагын нэр:</span>
            <span>${data.customerName}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: bold; min-width: 120px;">Имэйл:</span>
            <span>${data.customerEmail}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: bold; min-width: 120px;">Утас:</span>
            <span>${data.customerPhone || '-'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: bold; min-width: 120px;">Нэхэмжлэл:</span>
            <span>${data.invoiceDate}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: bold; min-width: 120px;">Дуусах:</span>
            <span>${data.dueDate}</span>
          </div>
        </div>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <thead>
          <tr>
            <th style="background-color: #34495e; color: white; padding: 8px 6px; text-align: left; font-weight: bold; font-size: 9pt;">#</th>
            <th style="background-color: #34495e; color: white; padding: 8px 6px; text-align: left; font-weight: bold; font-size: 9pt;">Бараа/Үйлчилгээ</th>
            <th style="background-color: #34495e; color: white; padding: 8px 6px; text-align: right; font-weight: bold; font-size: 9pt;">Тоо ширхэг</th>
            <th style="background-color: #34495e; color: white; padding: 8px 6px; text-align: right; font-weight: bold; font-size: 9pt;">Нэгж үнэ</th>
            <th style="background-color: #34495e; color: white; padding: 8px 6px; text-align: right; font-weight: bold; font-size: 9pt;">Нийт дүн</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map((item, index) => `
            <tr>
              <td style="padding: 6px 6px; border-bottom: 1px solid #ddd; font-size: 9pt;">${index + 1}</td>
              <td style="padding: 6px 6px; border-bottom: 1px solid #ddd; font-size: 9pt;">${item.description}</td>
              <td style="padding: 6px 6px; border-bottom: 1px solid #ddd; font-size: 9pt; text-align: right;">${item.quantity.toFixed(0)}</td>
              <td style="padding: 6px 6px; border-bottom: 1px solid #ddd; font-size: 9pt; text-align: right;">${item.price.toFixed(2)} ₮</td>
              <td style="padding: 6px 6px; border-bottom: 1px solid #ddd; font-size: 9pt; text-align: right;">${item.total.toFixed(2)} ₮</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #333;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 10pt;">
          <span>Нийт дүн:</span>
          <span>${data.subtotal.toFixed(2)} ₮</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 10pt;">
          <span>НӨАТ (10%):</span>
          <span>${data.tax.toFixed(2)} ₮</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 11pt; font-weight: bold; color: #e74c3c;">
          <span>Татвартай нийт дүн:</span>
          <span>${data.total.toFixed(2)} ₮</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 9pt;">
          <span style="font-weight: bold;">Нийт дүн үсгээр:</span>
          <span style="text-transform: capitalize; font-weight: bold;">${totalInWords}</span>
        </div>
      </div>
      
      ${data.notes ? `
        <div style="margin-top: 20px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
          <div style="font-size: 11pt; font-weight: bold; margin-bottom: 8px; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 3px;">ТЭМДЭГЛЭЛ</div>
          <p style="font-size: 9pt; margin: 5px 0;">${data.notes}</p>
        </div>
      ` : ''}
      
      <div style="margin-top: 30px; text-align: center; font-size: 9pt; color: #7f8c8d; border-top: 1px solid #ddd; padding-top: 15px;">
        <div style="display: table; width: 100%; margin-bottom: 20px;">
          <div style="display: table-cell; vertical-align: middle; padding-right: 20px; width: 120px;">
            <!-- Signature image placeholder -->
          </div>
          <div style="display: table-cell; vertical-align: middle;">
            <p style="font-size: 9pt; margin: 3px 0;">Дарга.............................. /....................../</p>
            <p style="font-size: 9pt; margin: 3px 0;">Хүлээн авсан .......................... /....................../</p>
            <p style="font-size: 9pt; margin: 3px 0;">Нягтлан бодогч.......................... /......................./</p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(invoiceDiv);
  
  try {
    // Wait for fonts and images to load
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Convert HTML to canvas
    const canvas = await html2canvas(invoiceDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: 794, // A4 width in pixels at 96 DPI (21cm = 794px)
      windowWidth: 794,
      backgroundColor: '#ffffff',
    });
    
    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgData = canvas.toDataURL('image/png', 1.0);
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // Calculate how many pages we need
    let heightLeft = imgHeight;
    let position = 0;
    
    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
    
    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
    
    // Save PDF
    pdf.save(`invoice-${data.invoiceNumber}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    // Clean up
    if (document.body.contains(invoiceDiv)) {
      document.body.removeChild(invoiceDiv);
    }
  }
}

export type { InvoiceData, InvoiceItem };

