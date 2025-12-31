import { Eye, Edit, Trash2, Star } from 'lucide-react';
import type { Customer } from '../../../types/customer.types';
import { CustomerTier, CustomerStatus } from '../../../types/customer.types';
import { useState } from 'react';
import Pagination from '../../common/Pagination';

interface CustomerTableProps {
  customers: Customer[];
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  selectable?: boolean;
  selectedCustomers?: Customer[];
  onSelectionChange?: (customers: Customer[]) => void;
}

export default function CustomerTable({ 
  customers, 
  onView, 
  onEdit, 
  onDelete, 
  currentPage, 
  itemsPerPage, 
  totalItems, 
  totalPages, 
  onPageChange, 
  onItemsPerPageChange,
  selectable = false,
  selectedCustomers = [],
  onSelectionChange
}: CustomerTableProps) {

  const getTierBadge = (tier: CustomerTier) => {
    const badges = {
      [CustomerTier.BRONZE]: 'bg-orange-100 text-orange-700',
      [CustomerTier.SILVER]: 'bg-gray-100 text-gray-700',
      [CustomerTier.GOLD]: 'bg-yellow-100 text-yellow-700',
      [CustomerTier.PLATINUM]: 'bg-purple-100 text-purple-700',
    };
    return badges[tier];
  };

  const getStatusBadge = (status: CustomerStatus) => {
    const badges = {
      [CustomerStatus.ACTIVE]: 'bg-green-100 text-green-700',
      [CustomerStatus.INACTIVE]: 'bg-gray-100 text-gray-700',
      [CustomerStatus.BLOCKED]: 'bg-red-100 text-red-700',
    };
    return badges[status];
  };

  const formatCurrency = (amount: number) => {
    return `LKR ${(amount / 1000).toLocaleString()}K`;
  };

  const isSelected = (customer: Customer) => {
    return selectedCustomers.some(selected => selected.id === customer.id);
  };

  const handleSelectCustomer = (customer: Customer) => {
    if (!onSelectionChange) return;

    if (isSelected(customer)) {
      onSelectionChange(selectedCustomers.filter(selected => selected.id !== customer.id));
    } else {
      onSelectionChange([...selectedCustomers, customer]);
    }
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;

    if (selectedCustomers.length === customers.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(customers);
    }
  };

  // Controlled: parent provides paginated customers
  const currentCustomers = customers;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.length === customers.length && customers.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tier
              </th> */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loyalty Points
              </th> */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Purchases
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Spent
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                {selectable && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={isSelected(customer)}
                      onChange={() => handleSelectCustomer(customer)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{customer.customerId}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {customer.firstName} {customer.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{customer.city}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{customer.phone}</div>
                  <div className="text-sm text-gray-500">{customer.email}</div>
                </td>
                {/* <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTierBadge(customer.tier)}`}>
                    {customer.tier}
                  </span>
                </td> */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(customer.status)}`}>
                    {customer.status}
                  </span>
                </td>
                {/* <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    {customer.loyaltyPoints.toLocaleString()}
                  </div>
                </td> */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {customer.totalPurchases}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(customer.totalSpent)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        onPageChange={onPageChange}
        onItemsPerPageChange={(v) => onItemsPerPageChange(v)}
      />
    </div>
  );
}
