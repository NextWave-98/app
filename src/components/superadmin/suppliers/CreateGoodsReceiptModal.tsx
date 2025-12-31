import { useState, useEffect } from 'react';
import { X, PackageCheck, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGoodsReceipt } from '../../../hooks/useGoodsReceipt';
import LoadingSpinner from '../../common/LoadingSpinner';

interface CreateGoodsReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  purchaseOrder: {
    id: string;
    orderNumber?: string;
    poNumber?: string;
    supplier?: {
      name: string;
      supplierCode: string;
    };
    items?: {
      id: string;
      productId: string;
      product?: {
        id: string;
        name: string;
        productCode: string;
        sku?: string;
        unitPrice?: number;
      };
      quantity: number;
      receivedQuantity?: number;
    }[];
  } | null;
}

interface ReceiptItem {
  productId: string;
  productName: string;
  productCode: string;
  orderedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  batchNumber: string;
  expiryDate: string;
  notes: string;
}

export default function CreateGoodsReceiptModal({
  isOpen,
  onClose,
  onSuccess,
  purchaseOrder,
}: CreateGoodsReceiptModalProps) {
  const { createGoodsReceipt } = useGoodsReceipt();
  const [loading, setLoading] = useState(false);
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ReceiptItem[]>([]);

  useEffect(() => {
    if (isOpen && purchaseOrder?.items) {
      const initialItems: ReceiptItem[] = purchaseOrder.items
        .filter(item => item.product)
        .map(item => ({
          productId: item.productId,
          productName: item.product!.name,
          productCode: item.product!.productCode,
          orderedQuantity: item.quantity,
          receivedQuantity: item.quantity - (item.receivedQuantity || 0),
          acceptedQuantity: item.quantity - (item.receivedQuantity || 0),
          rejectedQuantity: 0,
          batchNumber: '',
          expiryDate: '',
          notes: '',
        }));
      setItems(initialItems);
    }
  }, [isOpen, purchaseOrder]);

  const handleItemChange = (productId: string, field: keyof ReceiptItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const updated = { ...item, [field]: value };
        // Auto-calculate accepted quantity when received quantity changes
        if (field === 'receivedQuantity') {
          updated.acceptedQuantity = Math.max(0, Number(value) - updated.rejectedQuantity);
        }
        // Auto-calculate accepted quantity when rejected quantity changes
        if (field === 'rejectedQuantity') {
          updated.acceptedQuantity = Math.max(0, updated.receivedQuantity - Number(value));
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!purchaseOrder) {
      toast.error('No purchase order selected');
      return;
    }

    const itemsToReceive = items.filter(item => item.receivedQuantity > 0);

    if (itemsToReceive.length === 0) {
      toast.error('Please specify received quantities for at least one product');
      return;
    }

    // Validate accepted + rejected = received
    const invalidItems = itemsToReceive.filter(
      item => item.acceptedQuantity + item.rejectedQuantity !== item.receivedQuantity
    );

    if (invalidItems.length > 0) {
      toast.error('Accepted + Rejected quantities must equal Received quantity for all items');
      return;
    }

    setLoading(true);
    try {
      const data = {
        purchaseOrderId: purchaseOrder.id,
        receiptDate: new Date(receiptDate).toISOString(),
        invoiceNumber: invoiceNumber || undefined,
        invoiceDate: invoiceDate ? new Date(invoiceDate).toISOString() : undefined,
        notes: notes || undefined,
        items: itemsToReceive.map(item => ({
          productId: item.productId,
          orderedQuantity: item.orderedQuantity,
          receivedQuantity: item.receivedQuantity,
          acceptedQuantity: item.acceptedQuantity,
          rejectedQuantity: item.rejectedQuantity,
          batchNumber: item.batchNumber || undefined,
          expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString() : undefined,
          qualityStatus: 'PENDING' as const,
          notes: item.notes || undefined,
        })),
      };

     const res= await createGoodsReceipt(data);
     if (res?.success===true) {
       onSuccess();
       handleClose();
     }
     
    } catch (error) {
      console.error('Error creating goods receipt:', error);
      toast.error('Failed to create goods receipt');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReceiptDate(new Date().toISOString().split('T')[0]);
    setInvoiceNumber('');
    setInvoiceDate('');
    setNotes('');
    setItems([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <PackageCheck className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Create Goods Receipt</h2>
              <p className="text-sm text-gray-600">
                PO: {purchaseOrder?.poNumber || purchaseOrder?.orderNumber} - {purchaseOrder?.supplier?.name}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Receipt Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt Date *
                </label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Enter invoice number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* General Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                General Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Enter any general notes about this receipt"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Items Table */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Received Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordered</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accepted</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rejected</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch No.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item.productId}>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                          <div className="text-xs text-gray-500">{item.productCode}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">{item.orderedQuantity}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.receivedQuantity}
                            onChange={(e) => handleItemChange(item.productId, 'receivedQuantity', parseInt(e.target.value) || 0)}
                            min="0"
                            max={item.orderedQuantity}
                            className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.acceptedQuantity}
                            onChange={(e) => handleItemChange(item.productId, 'acceptedQuantity', parseInt(e.target.value) || 0)}
                            min="0"
                            max={item.receivedQuantity}
                            className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.rejectedQuantity}
                            onChange={(e) => handleItemChange(item.productId, 'rejectedQuantity', parseInt(e.target.value) || 0)}
                            min="0"
                            max={item.receivedQuantity}
                            className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.batchNumber}
                            onChange={(e) => handleItemChange(item.productId, 'batchNumber', e.target.value)}
                            placeholder="Batch"
                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={item.expiryDate}
                            onChange={(e) => handleItemChange(item.productId, 'expiryDate', e.target.value)}
                            className="w-36 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => handleItemChange(item.productId, 'notes', e.target.value)}
                            placeholder="Notes"
                            className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Goods Receipt
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
