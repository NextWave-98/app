import type { WarrantyClaim } from '../../../types/warranty.types';

interface SuperAdminClaimsTableProps {
  claims: WarrantyClaim[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export default function SuperAdminClaimsTable({
  claims,
  selectedIds,
  onSelectionChange,
}: SuperAdminClaimsTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(claims.map((c) => c.id));
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

  const allSelected = claims.length > 0 && selectedIds.length === claims.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < claims.length;

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
              Claim #
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
              Customer
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
              Product
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
              Issue
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
              Status
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
              Cost
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {claims.map((claim) => {
            const isSelected = selectedIds.includes(claim.id);
            return (
              <tr
                key={claim.id}
                className={`${
                  isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                } cursor-pointer`}
                onClick={() => handleSelectOne(claim.id, !isSelected)}
              >
                <td className="px-4 py-3 w-12" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleSelectOne(claim.id, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {claim.claimNumber}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{claim.customerName}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{claim.productName}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{claim.issueDescription}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      claim.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : claim.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {claim.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  LKR {((claim.actualCost || claim.estimatedCost || 0) / 1000).toFixed(0)}K
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
