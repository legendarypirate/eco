"use client";

import { memo } from 'react';
import FormInput from './FormInput';

interface InvoiceModalProps {
  showInvoiceModal: boolean;
  invoiceFormData: {
    name: string;
    register: string;
    email: string;
    phone: string;
  };
  isCreatingInvoice: boolean;
  handleInvoiceInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmitInvoice: (e?: React.FormEvent) => Promise<void>;
  setShowInvoiceModal: (show: boolean) => void;
  setInvoiceFormData: (data: any) => void;
}

const InvoiceModal = memo(({
  showInvoiceModal,
  invoiceFormData,
  isCreatingInvoice,
  handleInvoiceInputChange,
  handleKeyDown,
  handleSubmitInvoice,
  setShowInvoiceModal,
  setInvoiceFormData
}: InvoiceModalProps) => {
  if (!showInvoiceModal) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmitInvoice} className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Нэхэмжлэх мэдээлэл</h2>
        <div className="space-y-4">
          <FormInput
            name="name"
            value={invoiceFormData.name}
            onChange={handleInvoiceInputChange}
            onKeyDown={handleKeyDown}
            label="Байгууллагын нэр"
            required
            placeholder="Байгууллагын нэр"
          />
          <FormInput
            name="register"
            value={invoiceFormData.register}
            onChange={handleInvoiceInputChange}
            onKeyDown={handleKeyDown}
            label="Регистрийн дугаар"
            placeholder="Регистрийн дугаар"
          />
          <FormInput
            name="email"
            value={invoiceFormData.email}
            onChange={handleInvoiceInputChange}
            onKeyDown={handleKeyDown}
            label="Цахим шуудан"
            type="email"
            required
            placeholder="email@example.com"
          />
          <FormInput
            name="phone"
            value={invoiceFormData.phone}
            onChange={handleInvoiceInputChange}
            onKeyDown={handleKeyDown}
            label="Утасны дугаар"
            type="tel"
            required
            placeholder="88888888"
          />
        </div>
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => {
              setShowInvoiceModal(false);
              setInvoiceFormData({ name: '', register: '', email: '', phone: '' });
            }}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Цуцлах
          </button>
          <button
            type="submit"
            disabled={isCreatingInvoice}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingInvoice ? 'Үүсгэж байна...' : 'Үүсгэх'}
          </button>
        </div>
      </form>
    </div>
  );
});

InvoiceModal.displayName = 'InvoiceModal';

export default InvoiceModal;

