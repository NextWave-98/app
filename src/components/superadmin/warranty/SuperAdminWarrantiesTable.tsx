import type { Warranty } from '../../../types/warranty.types';
import { formatDateTime } from '../../../utils/dateUtils';

interface SuperAdminWarrantiesTableProps {
  warranties: Warranty[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export default function SuperAdminWarrantiesTable({
  warranties,
  selectedIds,
  onSelectionChange,
}: SuperAdminWarrantiesTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(warranties.map((w) => w.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const allSelected = warranties.length > 0 && selectedIds.length === warranties.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < warranties.length;

  return (
    <div className="overflow-x-auto max-h-[600px] overflow-y-auto border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-2 text-left bg-gray-50 w-12">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) {
                    input.indeterminate = someSelected;
                  }
                }}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
              Warranty #
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
              Customer
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
              Product
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
              Type
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
              Status
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
              Expires
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {warranties.map((warranty) => {
            const isSelected = selectedIds.includes(warranty.id);
            return (
              <tr
                key={warranty.id}
                className={`${
                  isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                } cursor-pointer`}
                onClick={() => handleSelectOne(warranty.id, !isSelected)}
              >
                <td className="px-4 py-3 w-12" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleSelectOne(warranty.id, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {warranty.warrantyNumber}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{warranty.customerName}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{warranty.productName}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                    {warranty.warrantyType}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      warranty.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {warranty.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {formatDateTime(warranty.endDate)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
