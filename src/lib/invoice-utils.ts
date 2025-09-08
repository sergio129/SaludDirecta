import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Sale {
  _id: string;
  numeroFactura: string;
  cliente?: {
    nombre: string;
    cedula?: string;
    telefono?: string;
  };
  items: Array<{
    nombreProducto: string;
    cantidad: number;
    precioUnitario: number;
    precioTotal: number;
  }>;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  metodoPago: string;
  estado: string;
  vendedor?: {
    name: string;
    email: string;
  };
  notas?: string;
  fechaVenta: Date;
  fechaCreacion: Date;
}

export const generateInvoicePDF = async (sale: Sale): Promise<void> => {
  try {
    // Crear un elemento temporal con el contenido de la factura
    const invoiceElement = document.createElement('div');
    invoiceElement.innerHTML = generateInvoiceHTML(sale);
    invoiceElement.style.width = '800px';
    invoiceElement.style.padding = '20px';
    invoiceElement.style.fontFamily = 'Arial, sans-serif';
    invoiceElement.style.backgroundColor = 'white';
    invoiceElement.style.color = 'black';
    invoiceElement.style.position = 'absolute';
    invoiceElement.style.left = '-9999px';
    invoiceElement.style.top = '-9999px';

    // Agregar al DOM temporalmente
    document.body.appendChild(invoiceElement);

    // Esperar a que se renderice completamente
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generar canvas con mejor configuración
    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      width: 800,
      height: invoiceElement.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 800,
      windowHeight: invoiceElement.scrollHeight
    });

    // Remover elemento temporal
    document.body.removeChild(invoiceElement);

    // Crear PDF con mejor configuración
    const pdf = new jsPDF('p', 'mm', 'a4');

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Calcular cuántas páginas necesitamos
    const totalPages = Math.ceil(imgHeight / pageHeight);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }

      const yPosition = -(page * pageHeight * canvas.width / imgWidth);
      const sourceY = page * pageHeight * canvas.width / imgWidth;
      const sourceHeight = Math.min(pageHeight * canvas.width / imgWidth, canvas.height - sourceY);

      // Crear un canvas temporal para esta página
      const pageCanvas = document.createElement('canvas');
      const pageCtx = pageCanvas.getContext('2d');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sourceHeight;

      if (pageCtx) {
        pageCtx.drawImage(
          canvas,
          0, sourceY, canvas.width, sourceHeight,
          0, 0, canvas.width, sourceHeight
        );

        const pageImgData = pageCanvas.toDataURL('image/png');
        pdf.addImage(pageImgData, 'PNG', 0, 0, imgWidth, (sourceHeight * imgWidth) / canvas.width);
      }
    }

    // Descargar PDF
    const fileName = `Factura-${sale.numeroFactura.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generando PDF:', error);
    throw new Error(`Error al generar el PDF de la factura: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

const generateInvoiceHTML = (sale: Sale): string => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <!-- Header -->
      <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #2563eb; font-size: 32px; margin: 0; font-weight: bold;">SaludDirecta</h1>
        <p style="color: #6b7280; margin: 5px 0; font-size: 16px;">Sistema de Gestión Farmacéutica</p>
        <p style="color: #9ca3af; margin: 5px 0; font-size: 14px;">Factura Electrónica</p>
      </div>

      <!-- Invoice Info -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div style="flex: 1;">
          <h3 style="color: #111827; font-size: 18px; margin-bottom: 10px; font-weight: bold;">Información de la Venta</h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Factura:</strong> ${sale.numeroFactura}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Fecha:</strong> ${formatDate(sale.fechaVenta)}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Estado:</strong> ${sale.estado}</p>
          ${sale.vendedor ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Vendedor:</strong> ${sale.vendedor.name}</p>` : ''}
        </div>
        <div style="flex: 1;">
          <h3 style="color: #111827; font-size: 18px; margin-bottom: 10px; font-weight: bold;">Información del Cliente</h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Nombre:</strong> ${sale.cliente?.nombre || 'Cliente General'}</p>
          ${sale.cliente?.cedula ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Cédula:</strong> ${sale.cliente.cedula}</p>` : ''}
          ${sale.cliente?.telefono ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Teléfono:</strong> ${sale.cliente.telefono}</p>` : ''}
        </div>
      </div>

      <!-- Products Table -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #111827; font-size: 18px; margin-bottom: 15px; font-weight: bold;">Detalles de Productos</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-weight: bold;">Producto</th>
              <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: center; font-weight: bold;">Cant.</th>
              <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold;">Precio Unit.</th>
              <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map(item => `
              <tr>
                <td style="border: 1px solid #e5e7eb; padding: 10px;">${item.nombreProducto}</td>
                <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: center;">${item.cantidad}</td>
                <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: right;">${formatCurrency(item.precioUnitario)}</td>
                <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-weight: bold;">${formatCurrency(item.precioTotal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
        <div style="width: 250px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Subtotal:</span>
            <span>${formatCurrency(sale.subtotal)}</span>
          </div>
          ${sale.descuento > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #059669;">
              <span>Descuento (${sale.descuento}%):</span>
              <span>-${formatCurrency((sale.subtotal * sale.descuento) / 100)}</span>
            </div>
          ` : ''}
          ${sale.impuesto > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Impuesto:</span>
              <span>${formatCurrency(sale.impuesto)}</span>
            </div>
          ` : ''}
          <div style="border-top: 1px solid #e5e7eb; margin: 10px 0;"></div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px;">
            <span>Total:</span>
            <span>${formatCurrency(sale.total)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 14px; color: #6b7280;">
            <span>Método de pago:</span>
            <span style="text-transform: capitalize;">${sale.metodoPago}</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      ${sale.notas ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #111827; font-size: 18px; margin-bottom: 10px; font-weight: bold;">Notas</h3>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; border: 1px solid #e5e7eb;">
            ${sale.notas}
          </div>
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; color: #9ca3af; font-size: 12px;">
        <p style="margin: 5px 0;">Gracias por su compra en SaludDirecta</p>
        <p style="margin: 5px 0;">Factura generada automáticamente por el sistema</p>
      </div>
    </div>
  `;
};

export const printInvoice = (sale: Sale): void => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const invoiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Factura ${sale.numeroFactura}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: white;
          color: black;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #2563eb;
          font-size: 32px;
          margin: 0;
          font-weight: bold;
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .info-section > div {
          flex: 1;
        }
        .info-section h3 {
          color: #111827;
          font-size: 18px;
          margin-bottom: 10px;
          font-weight: bold;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #e5e7eb;
          margin-bottom: 30px;
        }
        th, td {
          border: 1px solid #e5e7eb;
          padding: 10px;
          text-align: left;
        }
        th {
          background-color: #f9fafb;
          font-weight: bold;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .totals {
          display: flex;
          justify-content: flex-end;
        }
        .totals > div {
          width: 250px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 18px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
        }
        .footer {
          text-align: center;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
          color: #9ca3af;
          font-size: 12px;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        ${generateInvoiceHTML(sale)}
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(invoiceHTML);
  printWindow.document.close();
  printWindow.focus();

  // Esperar a que se cargue el contenido antes de imprimir
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
  };
};
