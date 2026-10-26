import React, { useRef, useState } from 'react';
import { ThermalReceiptResponse } from '../../../types';
import { Printer, X, Check, Copy, Share2 } from 'lucide-react';
import './billing.css';

interface ThermalReceiptModalProps {
  receipt: ThermalReceiptResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({ receipt, isOpen, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    if (!receipt) return;
    const text = [
      `*** ${receipt.storeName} ***`,
      `Store Code: ${receipt.storeCode}`,
      receipt.storeAddress,
      receipt.storePhone ? `Phone: ${receipt.storePhone}` : '',
      receipt.storeGstin ? `GSTIN: ${receipt.storeGstin}` : '',
      '--------------------------------',
      `Invoice #: ${receipt.invoiceNumber}`,
      `Date: ${receipt.dateFormatted}  Time: ${receipt.timeFormatted}`,
      `Cashier: ${receipt.cashierName}`,
      `Customer: ${receipt.customerName} (${receipt.customerPhone})`,
      '--------------------------------',
      ...receipt.items.map(
        (i) => `${i.name}\n  ${i.quantity} ${i.unitOfMeasure || 'pcs'} x ₹${i.rate.toFixed(2)} = ₹${i.lineTotal.toFixed(2)}`
      ),
      '--------------------------------',
      `Subtotal: ₹${receipt.subtotal.toFixed(2)}`,
      receipt.discountTotal > 0 ? `Discount: -₹${receipt.discountTotal.toFixed(2)}` : '',
      `Taxes (CGST+SGST): ₹${receipt.totalTax.toFixed(2)}`,
      `Grand Total: ₹${receipt.grandTotal.toFixed(2)}`,
      `Paid (${receipt.paymentMode}): ₹${receipt.amountPaid.toFixed(2)}`,
      receipt.changeReturned > 0 ? `Change Returned: ₹${receipt.changeReturned.toFixed(2)}` : '',
      '--------------------------------',
      receipt.returnPolicyText,
      receipt.footerThankYou,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    if (!receipt) return;
    const phone = (receipt.customerPhone || '').replace(/\D/g, '');
    const billSummary = `🧾 *${receipt.storeName}* - Bill Receipt\n` +
      `Invoice: *#${receipt.invoiceNumber}*\n` +
      `Date: ${receipt.dateFormatted} | Time: ${receipt.timeFormatted}\n` +
      `Total Items: ${receipt.items.length}\n` +
      `Grand Total: *₹${receipt.grandTotal.toFixed(2)}* (${receipt.paymentMode})\n\n` +
      `Thank you for shopping with us! Visit again.`;

    const encoded = encodeURIComponent(billSummary);
    const targetUrl = phone.length >= 10
      ? `https://api.whatsapp.com/send?phone=91${phone.slice(-10)}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(targetUrl, '_blank');
  };

  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal-card" style={{ maxWidth: '440px', maxHeight: '92vh' }}>
        {/* Modal Header */}
        <div className="pos-modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13px' }}>
            <Printer size={16} color="var(--success)" /> POS Thermal Bill Slip
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Realistic 80mm Receipt Paper Preview */}
        <div style={{ padding: '16px', overflowY: 'auto', background: 'var(--bg-primary)' }}>
          <div id="pos-thermal-receipt" ref={receiptRef} className="thermal-slip-container">
            {/* Store Header */}
            <div style={{ textAlign: 'center', paddingBottom: '8px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {receipt.storeName}
              </div>
              <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>Store Code: {receipt.storeCode}</div>
              {receipt.storeAddress && (
                <div style={{ fontSize: '10px', color: '#475569' }}>{receipt.storeAddress}</div>
              )}
              {receipt.storePhone && (
                <div style={{ fontSize: '10px', color: '#475569' }}>Tel: {receipt.storePhone}</div>
              )}
              {receipt.storeGstin && (
                <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '2px' }}>GSTIN: {receipt.storeGstin}</div>
              )}
            </div>

            <div className="thermal-slip-divider" />

            {/* Bill Info */}
            <div style={{ fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>INVOICE: #{receipt.invoiceNumber}</span>
                <span>{receipt.paymentMode}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Date: {receipt.dateFormatted}</span>
                <span>Time: {receipt.timeFormatted}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Cashier: {receipt.cashierName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '2px', fontWeight: 600 }}>
                <span>Customer: {receipt.customerName}</span>
                <span>{receipt.customerPhone}</span>
              </div>
            </div>

            <div className="thermal-slip-divider" />

            {/* Items Table */}
            <div style={{ fontSize: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderBottom: '1px solid #cbd5e1', paddingBottom: '3px', marginBottom: '4px' }}>
                <span style={{ width: '50%' }}>Item</span>
                <span style={{ width: '25%', textAlign: 'center' }}>Qty x Rate</span>
                <span style={{ width: '25%', textAlign: 'right' }}>Total</span>
              </div>

              {receipt.items.map((it, idx) => (
                <div key={idx} style={{ padding: '3px 0' }}>
                  <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {it.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '9px' }}>
                    <span>
                      {it.sku ? `[${it.sku}] ` : ''}
                      {it.taxRate > 0 ? `GST ${it.taxRate}%` : ''}
                      {it.discount > 0 ? ` Disc: -₹${it.discount}` : ''}
                    </span>
                    <span style={{ textAlign: 'center' }}>
                      {it.quantity} {it.unitOfMeasure || 'pcs'} x {it.rate.toFixed(2)}
                    </span>
                    <span style={{ fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>
                      ₹{it.lineTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="thermal-slip-divider" />

            {/* Totals */}
            <div style={{ fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Items Subtotal:</span>
                <span>₹{receipt.subtotal.toFixed(2)}</span>
              </div>
              {receipt.discountTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                  <span>Total Discount:</span>
                  <span>-₹{receipt.discountTotal.toFixed(2)}</span>
                </div>
              )}
              {receipt.cgstTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '9px' }}>
                  <span>CGST:</span>
                  <span>₹{receipt.cgstTotal.toFixed(2)}</span>
                </div>
              )}
              {receipt.sgstTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '9px' }}>
                  <span>SGST:</span>
                  <span>₹{receipt.sgstTotal.toFixed(2)}</span>
                </div>
              )}
              {receipt.roundOff !== 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '9px' }}>
                  <span>Round Off:</span>
                  <span>{receipt.roundOff > 0 ? `+₹${receipt.roundOff.toFixed(2)}` : `-₹${Math.abs(receipt.roundOff).toFixed(2)}`}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, borderTop: '1px solid #0f172a', paddingTop: '4px', marginTop: '2px' }}>
                <span>GRAND TOTAL:</span>
                <span>₹{receipt.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="thermal-slip-divider" />

            {/* Tender Info */}
            <div style={{ fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                <span>Tendered ({receipt.paymentMode}):</span>
                <span>₹{receipt.amountPaid.toFixed(2)}</span>
              </div>
              {receipt.changeReturned > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1e40af', fontWeight: 700 }}>
                  <span>Change Returned:</span>
                  <span>₹{receipt.changeReturned.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Policy & Footer */}
            <div style={{ textAlign: 'center', paddingTop: '10px', fontSize: '9px', color: '#64748b' }}>
              <div style={{ fontStyle: 'italic', marginBottom: '4px' }}>{receipt.returnPolicyText}</div>
              <div style={{ fontWeight: 800, textTransform: 'uppercase', color: '#334155' }}>
                {receipt.footerThankYou}
              </div>
              <div style={{ fontSize: '8px', color: '#94a3b8', marginTop: '4px' }}>Powered by Common CRM POS</div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="pos-modal-footer no-print" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleCopy}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={handleWhatsAppShare}
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              <Share2 size={13} /> WhatsApp
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '11px' }}
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary"
              style={{ padding: '6px 16px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={14} /> Print Bill (80mm)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
